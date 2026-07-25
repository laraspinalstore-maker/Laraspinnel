import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import SiteSettings from "@/models/SiteSettings";
import { sendEmail } from "@/lib/email/sendEmail";
import { getOrderStatusUpdateEmail } from "@/lib/email/customerStatusUpdate";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;
    const order = await Order.findById(id).lean();

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error: any) {
    console.error("Admin Order Detail GET error:", error);
    return NextResponse.json({ error: "Failed to fetch order details" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const body = await req.json();
    const { status } = body;

    const validStatuses = ["pending", "confirmed", "preparing", "ready", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' }
    );

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Notify the customer of the status change if they gave an email.
    // Best-effort — a failed/misconfigured email must never fail the update.
    if (order.email?.trim()) {
      try {
        const settingsList = await SiteSettings.find({
          key: { $in: ["farm_name", "email_status_subject", "email_status_intro", "email_status_footer"] },
        }).lean();
        const settingsMap = settingsList.reduce((acc: Record<string, string>, s: any) => {
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
  } catch (error: any) {
    console.error("Admin Order status PUT error:", error);
    return NextResponse.json({ error: "Failed to update order status" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const { id } = await params;

    const order = await Order.findByIdAndDelete(id);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Order deleted successfully" });
  } catch (error: any) {
    console.error("Admin Order DELETE error:", error);
    return NextResponse.json({ error: "Failed to delete order" }, { status: 500 });
  }
}
export const revalidate = 0;
