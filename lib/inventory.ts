/**
 * Inventory bookkeeping for order state changes.
 *
 * Checkout decrements stock when an order is created (see
 * app/api/orders/route.ts). Nothing put it back: cancelling an order, or
 * deleting one, left the units permanently consumed. Every cancellation
 * therefore silently shrank sellable inventory, and because the shop front hides
 * items at `stock <= 0`, a run of cancelled orders could take products off sale
 * with no visible cause.
 *
 * Both directions are guarded by the order's `stockRestored` flag and applied
 * with a conditional update, so concurrent requests can't double-credit.
 */
import mongoose from "mongoose";
import Order, { IOrder } from "@/models/Order";
import Product from "@/models/Product";
import { logSecurityEvent } from "@/lib/security/audit";

type OrderDoc = Pick<IOrder, "orderNumber" | "items" | "stockRestored"> & {
  _id: mongoose.Types.ObjectId | unknown;
};

/** Sums requested quantity per product, collapsing repeated line items. */
function quantitiesByProduct(order: OrderDoc): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of order.items || []) {
    if (!item.productId) continue; // custom-order lines aren't catalog products
    const id = String(item.productId);
    totals.set(id, (totals.get(id) ?? 0) + Number(item.quantity || 0));
  }
  return totals;
}

/**
 * Returns this order's units to stock, exactly once.
 *
 * The `stockRestored: { $ne: true }` guard is what makes it idempotent — the
 * flag is claimed atomically before any product is touched, so a second caller
 * finds nothing to claim and does no work.
 */
export async function restoreOrderStock(orderId: string, reason: string): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, stockRestored: { $ne: true } },
    { stockRestored: true },
    { returnDocument: "after" }
  );

  if (!claimed) return false; // already restored, or no such order

  const totals = quantitiesByProduct(claimed);
  if (totals.size === 0) return true;

  await Promise.all(
    Array.from(totals).map(([productId, quantity]) =>
      Product.findByIdAndUpdate(productId, { $inc: { stock: quantity } }).catch((err) =>
        console.error("[inventory] Failed to restore stock", { orderId, productId, quantity, err })
      )
    )
  );

  logSecurityEvent("admin.mutation", {
    resource: "inventory",
    resourceId: claimed.orderNumber,
    action: "stock_restored",
    reason,
    products: totals.size,
  });

  return true;
}

/**
 * Re-reserves stock for an order moving back out of "cancelled".
 *
 * Applied unconditionally rather than only when stock is available: the units
 * were already reserved once, and refusing here would leave the order active
 * while its stock sat unreserved. A resulting negative figure is a truthful
 * signal of oversell that the admin can see and correct, which is safer than
 * silently losing the reservation.
 */
export async function reserveOrderStock(orderId: string, reason: string): Promise<boolean> {
  const claimed = await Order.findOneAndUpdate(
    { _id: orderId, stockRestored: true },
    { stockRestored: false },
    { returnDocument: "after" }
  );

  if (!claimed) return false;

  const totals = quantitiesByProduct(claimed);
  if (totals.size === 0) return true;

  await Promise.all(
    Array.from(totals).map(([productId, quantity]) =>
      Product.findByIdAndUpdate(productId, { $inc: { stock: -quantity } }).catch((err) =>
        console.error("[inventory] Failed to re-reserve stock", { orderId, productId, quantity, err })
      )
    )
  );

  logSecurityEvent("admin.mutation", {
    resource: "inventory",
    resourceId: claimed.orderNumber,
    action: "stock_reserved",
    reason,
    products: totals.size,
  });

  return true;
}
