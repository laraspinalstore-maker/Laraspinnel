import { NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import ContactMessage from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();

    const [orders, messages] = await Promise.all([
      Order.countDocuments({ status: "pending" }),
      ContactMessage.countDocuments({ status: "new" }),
    ]);

    return NextResponse.json({ orders, messages });
  } catch (error) {
    return serverError("Admin counts GET error:", error, "Failed to fetch counts");
  }
}
