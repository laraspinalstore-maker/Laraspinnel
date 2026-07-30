import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { serverError } from "@/lib/security/http";
import Banner from "@/models/Banner";

export async function GET() {
  try {
    await connectToDatabase();
    const banners = await Banner.find({ isActive: true }).sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json(banners);
  } catch (error) {
    return serverError("banners:GET", error, "Failed to fetch banners");
  }
}
