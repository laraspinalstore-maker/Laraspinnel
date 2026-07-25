import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Testimonial from "@/models/Testimonial";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("activeOnly") === "true";
    const query = activeOnly ? { isActive: true } : {};

    const testimonials = await Testimonial.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json(testimonials);
  } catch (error: any) {
    console.error("Testimonials GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch testimonials" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const { name, location, goal, outcome, rating, refId, avatarUrl, imageUrl, orderImageUrl, isActive } = body;

    if (!name && !imageUrl) {
      return NextResponse.json(
        { error: "Review name or image upload is required" },
        { status: 400 }
      );
    }

    const initial = (name || "C").charAt(0).toUpperCase();

    const newTestimonial = await Testimonial.create({
      name: name || "Customer Review",
      location: location || "",
      goal: goal || "",
      outcome: outcome || "",
      initial,
      rating: Number(rating) || 5,
      refId: refId || "ADMIN-CREATED",
      avatarUrl: avatarUrl || "",
      imageUrl: imageUrl || "",
      orderImageUrl: orderImageUrl || "",
      isActive: isActive !== undefined ? isActive : true,
    });

    const { revalidatePath } = require("next/cache");
    revalidatePath("/");
    revalidatePath("/about");

    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error: any) {
    console.error("Testimonial POST error:", error);
    return NextResponse.json(
      { error: "Failed to create testimonial" },
      { status: 500 }
    );
  }
}
