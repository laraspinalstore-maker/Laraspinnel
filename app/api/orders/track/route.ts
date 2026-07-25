import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import { rateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  try {
    // Lookups are cheap and read-only, so a short in-memory window is enough
    // (the 1-per-24h Upstash form limiter would lock customers out of retries).
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = rateLimit(`track_${ip}`, 10, 60 * 1000);

    if (!success) {
      return NextResponse.json(
        { error: "Too many tracking requests. Please wait a minute and try again." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const orderNumber = String(body.orderNumber || "").trim().toUpperCase();
    const phone = String(body.phone || "").replace(/\D/g, "");

    if (!orderNumber || orderNumber.length > 30) {
      return NextResponse.json({ error: "Please enter your order number." }, { status: 400 });
    }
    if (!/^[6-9]\d{9}$/.test(phone)) {
      return NextResponse.json(
        { error: "Enter the 10-digit mobile number used while ordering." },
        { status: 400 }
      );
    }

    await connectToDatabase();

    const order = await Order.findOne({ orderNumber }).lean();

    // Phone must match the order — a valid order number alone is not enough,
    // so guessing/leaked order numbers can't expose someone else's order.
    const storedPhone = order ? String(order.phone).replace(/\D/g, "") : "";
    if (!order || !storedPhone.endsWith(phone)) {
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
        items: (order.items || []).map((item: any) => ({
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
  } catch (error: any) {
    console.error("Public Order Track POST error:", error);
    return NextResponse.json(
      { error: "Failed to look up order. Please try again." },
      { status: 500 }
    );
  }
}

export const revalidate = 0;
