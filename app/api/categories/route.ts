import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { serverError } from "@/lib/security/http";
import Category from "@/models/Category";

export async function GET() {
  try {
    await connectToDatabase();
    const categories = await Category.find({ isActive: true }).sort({ name: 1 }).lean();
    return NextResponse.json(categories);
  } catch (error) {
    return serverError("categories:GET", error, "Failed to fetch categories");
  }
}
export const revalidate = 60;
