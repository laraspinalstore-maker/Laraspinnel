import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual, createHash } from "crypto";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp, serverError, badRequest, tooManyRequests, readJsonBody } from "@/lib/security/http";

/** Constant-time comparison, so match/no-match isn't distinguishable by timing. */
function secureCompare(a: string, b: string): boolean {
  const digestA = createHash("sha256").update(a, "utf8").digest();
  const digestB = createHash("sha256").update(b, "utf8").digest();
  return timingSafeEqual(digestA, digestB);
}

export async function POST(req: NextRequest) {
  try {
    // Lookups are cheap and read-only, so a short window is enough (the
    // 1-per-24h order limiter would lock customers out of retries).
    const ip = getClientIp(req);
    const { success, retryAfterSeconds } = await checkRateLimit("trackOrder", ip, {
      route: "/api/orders/track",
    });

    if (!success) {
      return tooManyRequests(
        "Too many tracking requests. Please wait a minute and try again.",
        retryAfterSeconds
      );
    }

    const parsed = await readJsonBody<{ orderNumber?: unknown; phone?: unknown }>(req, 4 * 1024);
    if (!parsed.ok) return parsed.response;

    // Both values are coerced to primitives before touching the query, so a
    // JSON object like {"$ne": null} can't reach Mongo as an operator.
    const orderNumber = String(parsed.data?.orderNumber ?? "").trim().toUpperCase();
    const phone = String(parsed.data?.phone ?? "").replace(/\D/g, "");

    if (!orderNumber || orderNumber.length > 30) {
      return badRequest("Please enter your order number.");
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return badRequest("Enter the 10-digit mobile number used while ordering.");
    }

    await connectToDatabase();

    const order = await Order.findOne({ orderNumber }).lean();

    // The phone number must match the order — a valid order number alone is not
    // enough, so a guessed or leaked reference can't expose someone else's order.
    //
    // Compared as the last 10 digits (stored numbers may carry a country code)
    // in constant time. `endsWith` was previously used, which leaks how much of
    // the number matched via response timing.
    const storedPhone = order ? String(order.phone).replace(/\D/g, "") : "";
    const storedLast10 = storedPhone.slice(-10);
    const phoneMatches = Boolean(order) && storedLast10.length === 10 && secureCompare(storedLast10, phone);

    if (!order || !phoneMatches) {
      // One message for both cases, so this can't be used to test which order
      // numbers exist.
      return NextResponse.json(
        { error: "No order found for that order number and mobile number combination." },
        { status: 404 }
      );
    }

    // Sanitized view only — never echo back address, email, or internal notes.
    return NextResponse.json({
      order: {
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        status: order.status,
        orderType: order.orderType,
        city: order.city,
        items: (order.items || []).map((item) => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          customText: item.customText || undefined,
        })),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    return serverError("orders-track:POST", error, "Failed to look up order. Please try again.");
  }
}

export const revalidate = 0;
