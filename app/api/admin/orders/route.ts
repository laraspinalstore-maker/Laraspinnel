import { NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();
    return NextResponse.json(orders);
  } catch (error) {
    return serverError("Admin Orders GET error:", error, "Failed to fetch orders");
  }
}
export const revalidate = 0;
