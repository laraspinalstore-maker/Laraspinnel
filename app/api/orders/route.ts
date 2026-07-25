import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import { orderSchema } from "@/lib/validations";
import { generateRefId } from "@/lib/utils";
import { formRateLimit } from "@/lib/rateLimit";
import SiteSettings from "@/models/SiteSettings";
import { sendEmail } from "@/lib/email/sendEmail";
import { getOrderConfirmationEmail } from "@/lib/email/customerConfirmation";

export async function POST(req: NextRequest) {
  try {
    // 1. Rate Limiting Check
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = await formRateLimit.limit(`ratelimit_order_${ip}`);
    
    if (!success) {
      return NextResponse.json(
        { error: "Too many checkout requests. Please wait before ordering again." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const result = orderSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { customerName, phone, email, address, city, pincode, notes, items } = result.data;

    // Fetch site settings early for delivery fee and emails
    const settingsList = await SiteSettings.find({}).lean();
    const settingsMap = settingsList.reduce((acc: Record<string, string>, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    // Verify stock and update product quantities in a loop/transaction
    let subtotal = 0;
    const finalItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product || !product.isActive) {
        return NextResponse.json(
          { error: `Product '${item.name}' is no longer available.` },
          { status: 400 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for '${item.name}'. Available: ${product.stock}` },
          { status: 400 }
        );
      }

      const price = product.discountPrice || product.price;
      subtotal += price * item.quantity;

      finalItems.push({
        productId: product._id,
        name: product.name,
        price: price,
        quantity: item.quantity,
        image: product.images[0] || "",
        customText: item.customText?.trim() || undefined,
        customImage: item.customImage || undefined,
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
      customerName,
      phone,
      email: email?.trim() || undefined,
      address,
      city,
      pincode,
      notes,
      items: finalItems,
      subtotal,
      deliveryFee,
      totalAmount,
      status: "pending",
    });

    // Decrement stock for each product purchased
    for (const item of items) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { stock: -item.quantity },
      });
    }

    console.log(`Order created successfully: ${orderNumber}. Total: ₹${totalAmount}`);

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
  } catch (error: any) {
    console.error("Public Orders POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to place order" },
      { status: 500 }
    );
  }
}
export const revalidate = 0;
