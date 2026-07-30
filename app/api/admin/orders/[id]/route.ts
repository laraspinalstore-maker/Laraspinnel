import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError, readJsonBody, isValidObjectId, notFound } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import SiteSettings from "@/models/SiteSettings";
import { sendEmail } from "@/lib/email/sendEmail";
import { getOrderStatusUpdateEmail } from "@/lib/email/customerStatusUpdate";
import { restoreOrderStock, reserveOrderStock } from "@/lib/inventory";
import { logSecurityEvent, maskEmail } from "@/lib/security/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Order not found");
    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    return serverError("Admin Order Detail GET error:", error, "Failed to fetch order details");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Order not found");

    const parsed = await readJsonBody<{ status?: unknown }>(req, 8 * 1024);
    if (!parsed.ok) return parsed.response;
    // Coerced to a string before the allowlist check, so a non-string body
    // value can't slip past includes() and reach the update.
    const status = String(parsed.data?.status ?? "");

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    // Read the previous status first, so the stock side effect can be decided
    // from the actual transition rather than from the new value alone.
    const previous = await Order.findById(id).select("status").lean();
    if (!previous) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Keep inventory consistent with the order's lifecycle. Checkout reserved
    // these units; cancelling has to give them back, and un-cancelling has to
    // take them again. Both calls are idempotent (see lib/inventory.ts), so a
    // repeated or concurrent status write can't double-credit stock.
    if (status === "cancelled" && previous.status !== "cancelled") {
      await restoreOrderStock(id, "order_cancelled");
    } else if (previous.status === "cancelled" && status !== "cancelled") {
      await reserveOrderStock(id, "order_uncancelled");
    }

    // Notify the customer of the status change if they gave an email.
    // Best-effort — a failed/misconfigured email must never fail the update.
    if (order.email?.trim()) {
      try {
        const settingsList = await SiteSettings.find({
          key: { $in: ["farm_name", "email_status_subject", "email_status_intro", "email_status_footer"] },
        }).lean();
        const settingsMap = settingsList.reduce((acc: Record<string, string>, s) => {
          acc[s.key] = s.value;
          return acc;
        }, {});

        const { subject, html } = getOrderStatusUpdateEmail(
          { orderNumber: order.orderNumber, customerName: order.customerName, status: order.status },
          {
            shopName: settingsMap.farm_name || "Laraspinnel",
            subjectTemplate: settingsMap.email_status_subject,
            introTemplate: settingsMap.email_status_intro,
            footerTemplate: settingsMap.email_status_footer,
          }
        );

        await sendEmail({ to: order.email.trim(), subject, html });
      } catch (emailError) {
        console.error("Order status update email failed to send:", emailError);
      }
    }

    return NextResponse.json(order);
  } catch (error) {
    return serverError("Admin Order status PUT error:", error, "Failed to update order status");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Order not found");

    // Return the reserved units BEFORE the order document disappears — once it's
    // deleted there is no record of what to credit back. Idempotent, so an order
    // already cancelled (and therefore already restored) is not credited twice.
    await restoreOrderStock(id, "order_deleted");

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    logSecurityEvent("admin.mutation", {
      actor: maskEmail(auth.admin.email),
      resource: "order",
      resourceId: order.orderNumber,
      action: "DELETE",
    });

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error) {
    return serverError("Admin Order DELETE error:", error, "Failed to delete order");
  }
}
export const revalidate = 0;
