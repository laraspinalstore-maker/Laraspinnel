import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Testimonial from "@/models/Testimonial";
import { rateLimit } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Public endpoint — customers submit a review from the "Customer Love" section.
// Submissions land as inactive and only appear on the site after admin approval.
export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = rateLimit(`testimonial_submit_${ip}`, 5, 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many submissions. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    await connectToDatabase();
    const body = await req.json();
    const { name, location, goal, outcome, rating, refId, avatarUrl, orderImageUrl } = body;

    if (!name || !location || !goal || !outcome || !refId) {
      return NextResponse.json(
        { error: "Name, location, order ref ID, and both messages are required" },
        { status: 400 }
      );
    }

    const clean = (value: unknown, max: number) => String(value).trim().slice(0, max);

    // Avatar and order photo are optional and must be our own ImageKit uploads
    const safeAvatar =
      typeof avatarUrl === "string" && avatarUrl.startsWith("https://ik.imagekit.io/")
        ? avatarUrl
        : "";
    const safeOrderImage =
      typeof orderImageUrl === "string" && orderImageUrl.startsWith("https://ik.imagekit.io/")
        ? orderImageUrl
        : "";

    const cleanName = clean(name, 80);

    await Testimonial.create({
      name: cleanName,
      location: clean(location, 80),
      goal: clean(goal, 500),
      outcome: clean(outcome, 1000),
      initial: cleanName.charAt(0).toUpperCase(),
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      refId: clean(refId, 40).toUpperCase(),
      avatarUrl: safeAvatar,
      orderImageUrl: safeOrderImage,
      isActive: false,
    });

    return NextResponse.json(
      { message: "Review submitted and pending approval" },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Public testimonial POST error:", error);
    return NextResponse.json(
      { error: "Failed to submit review" },
      { status: 500 }
    );
  }
}
