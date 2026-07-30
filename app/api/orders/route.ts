import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { orderSchema } from "@/lib/validations";
import { generateRefId } from "@/lib/utils";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp, serverError, badRequest, tooManyRequests, readJsonBody } from "@/lib/security/http";
import { logSecurityEvent, maskPhone } from "@/lib/security/audit";
import { isOwnImageKitUrl, stripTags } from "@/lib/security/sanitize";
import SiteSettings from "@/models/SiteSettings";
import { sendEmail } from "@/lib/email/sendEmail";
import { getOrderConfirmationEmail } from "@/lib/email/customerConfirmation";

/** Max distinct line items in one order. Bounds per-request DB work. */
const MAX_LINE_ITEMS = 50;
/** Max units of any single product per order. */
const MAX_QUANTITY_PER_ITEM = 100;

interface ReservedItem {
  productId: string;
  quantity: number;
}

/**
 * Releases stock already reserved during this request.
 *
 * Mongo transactions need a replica set, which isn't guaranteed here, so the
 * reservation loop compensates explicitly instead: if any item fails, whatever
 * was already decremented is added back before the error returns. Without this,
 * a partially-failed checkout would silently destroy inventory.
 */
async function releaseReservations(reserved: ReservedItem[]): Promise<void> {
  await Promise.all(
    reserved.map((item) =>
      Product.findByIdAndUpdate(item.productId, { $inc: { stock: item.quantity } }).catch((err) =>
        console.error("[orders:POST] Failed to release reserved stock", {
          productId: item.productId,
          quantity: item.quantity,
          err,
        })
      )
    )
  );
}

export async function POST(req: NextRequest) {
  const reserved: ReservedItem[] = [];
  const ip = getClientIp(req);

  try {
    // 1. Rate Limiting Check
    const { success, retryAfterSeconds } = await checkRateLimit("order", ip, { route: "/api/orders" });

    if (!success) {
      return tooManyRequests(
        "Too many checkout requests. Please wait before ordering again.",
        retryAfterSeconds
      );
    }

    await connectToDatabase();

    const parsedBody = await readJsonBody(req, 256 * 1024);
    if (!parsedBody.ok) return parsedBody.response;

    const result = orderSchema.safeParse(parsedBody.data);

    if (!result.success) {
      return badRequest("Validation failed", result.error.format());
    }

    const { customerName, phone, email, address, city, pincode, notes, items } = result.data;

    if (items.length > MAX_LINE_ITEMS) {
      return badRequest(`An order cannot contain more than ${MAX_LINE_ITEMS} different items.`);
    }

    // Collapse duplicate lines for the same product before checking stock —
    // otherwise two lines of the same item are each validated against the full
    // stock figure and together can exceed it.
    const requestedByProduct = new Map<string, number>();
    for (const item of items) {
      const previous = requestedByProduct.get(item.productId) ?? 0;
      requestedByProduct.set(item.productId, previous + item.quantity);
    }

    for (const [productId, quantity] of requestedByProduct) {
      if (quantity > MAX_QUANTITY_PER_ITEM) {
        return badRequest(`Maximum ${MAX_QUANTITY_PER_ITEM} units per product per order.`);
      }
      // Reject non-ObjectId ids up front so Mongoose doesn't throw a CastError
      // that would surface as a 500.
      if (!/^[a-f0-9]{24}$/i.test(productId)) {
        return badRequest("One of the items in your cart is invalid. Please refresh and try again.");
      }
    }

    // Fetch site settings early for delivery fee and emails
    const settingsList = await SiteSettings.find({}).lean();
    const settingsMap = settingsList.reduce((acc: Record<string, string>, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    let subtotal = 0;
    const finalItems = [];

    // Reserve stock atomically, one product at a time.
    //
    // SECURITY: this was previously a read-then-write split across two loops
    // (`findById` to check `product.stock`, then `$inc` at the end). Two
    // concurrent checkouts both passed the check before either decremented, so
    // stock could be driven negative and items oversold — a time-of-check /
    // time-of-use race, trivially triggered by firing parallel requests. The
    // conditional update below makes the check and the decrement one atomic
    // operation: it only matches while enough stock remains.
    for (const [productId, quantity] of requestedByProduct) {
      const product = await Product.findOneAndUpdate(
        {
          _id: productId,
          isActive: true,
          stock: { $gte: quantity },
        },
        { $inc: { stock: -quantity } },
        { returnDocument: "after" }
      );

      if (!product) {
        // Distinguish "gone" from "not enough left" for a useful message,
        // without revealing anything an anonymous shopper can't already see.
        const existing = await Product.findById(productId).lean();
        await releaseReservations(reserved);
        reserved.length = 0;

        logSecurityEvent("order.rejected", {
          ip,
          resource: "product",
          resourceId: productId,
          reason: existing ? "insufficient_stock" : "unavailable",
        });

        if (!existing || !existing.isActive) {
          return badRequest("One of the products in your cart is no longer available.");
        }
        return badRequest(
          `Insufficient stock for '${stripTags(existing.name)}'. Available: ${existing.stock}`
        );
      }

      reserved.push({ productId, quantity });

      // Price always comes from the database, never from the request body, so a
      // tampered cart in localStorage cannot change what is charged.
      const price = product.discountPrice || product.price;
      subtotal += price * quantity;
    }

    // Rebuild the line items from trusted product data, keeping the original
    // per-line split so the customer sees the breakdown they submitted.
    for (const item of items) {
      const product = await Product.findById(item.productId).lean();
      if (!product) continue;

      const price = product.discountPrice || product.price;

      // A customer-supplied reference image is only accepted if it is a file on
      // this project's own ImageKit account. It was previously validated as any
      // `url()`, so an arbitrary external — or `javascript:` — URL could be
      // stored, and it is later rendered as a clickable link on the admin order
      // page.
      const customImage = isOwnImageKitUrl(item.customImage) ? item.customImage : undefined;

      finalItems.push({
        productId: product._id,
        name: product.name,
        price: price,
        quantity: item.quantity,
        image: product.images[0] || "",
        customText: item.customText ? stripTags(item.customText).trim() || undefined : undefined,
        customImage,
      });
    }

    // Calculate delivery fee
    const deliveryFeeSetting = parseFloat(settingsMap.delivery_fee) || 0;
    const isFreeDeliveryEnabled = settingsMap.is_free_delivery_enabled === "true";
    const freeDeliveryThreshold = parseFloat(settingsMap.free_delivery_threshold) || 0;

    let deliveryFee = deliveryFeeSetting;
    if (isFreeDeliveryEnabled && subtotal >= freeDeliveryThreshold) {
      deliveryFee = 0;
    }

    const totalAmount = subtotal + deliveryFee;

    // Generate unique order number
    const orderNumber = generateRefId();

    const order = await Order.create({
      orderNumber,
      customerName: stripTags(customerName),
      phone,
      email: email?.trim() || undefined,
      address: stripTags(address),
      city: stripTags(city),
      pincode,
      notes: notes ? stripTags(notes) : undefined,
      items: finalItems,
      subtotal,
      deliveryFee,
      totalAmount,
      status: "pending",
    });

    // Stock is now committed to a persisted order — nothing left to roll back.
    reserved.length = 0;

    // Identifiers only: never log the address, email, or full phone number.
    logSecurityEvent("order.created", {
      ip,
      resource: "order",
      resourceId: orderNumber,
      phone: maskPhone(phone),
      itemCount: finalItems.length,
    });

    // Send the customer a confirmation email if they provided one.
    // Best-effort — a failed/misconfigured email must never fail the order itself.
    if (email?.trim()) {
      try {
        const { subject, html } = getOrderConfirmationEmail(
          { orderNumber, customerName, address, city, pincode, totalAmount, items: finalItems },
          {
            shopName: settingsMap.farm_name || "Laraspinnel",
            subjectTemplate: settingsMap.email_order_subject,
            introTemplate: settingsMap.email_order_intro,
            footerTemplate: settingsMap.email_order_footer,
          }
        );

        await sendEmail({ to: email.trim(), subject, html });
      } catch (emailError) {
        console.error("Order confirmation email failed to send:", emailError);
      }
    }

    return NextResponse.json(
      { message: "Order placed successfully", orderNumber, id: order._id },
      { status: 201 }
    );
  } catch (error) {
    // Any unexpected failure after reservations must not leave stock consumed.
    if (reserved.length > 0) {
      await releaseReservations(reserved);
    }
    return serverError("orders:POST", error, "Failed to place order. Please try again.");
  }
}
export const revalidate = 0;
