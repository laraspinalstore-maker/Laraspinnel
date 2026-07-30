import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Testimonial from "@/models/Testimonial";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp, serverError, badRequest, tooManyRequests, readJsonBody } from "@/lib/security/http";
import { isOwnImageKitUrl, stripTags } from "@/lib/security/sanitize";

export const dynamic = "force-dynamic";

/** Cap on returned reviews. */
const MAX_RESULTS = 100;

/**
 * Public list of APPROVED reviews.
 *
 * SECURITY: the public home and about pages previously read this data from
 * `/api/admin/testimonials`, whose GET handler had no session check — the only
 * admin route missing one. Because its `activeOnly` filter was a caller-supplied
 * query flag, omitting it returned every document, including reviews still
 * awaiting moderation. This endpoint replaces that call and can only ever return
 * approved rows: `isActive: true` is hardcoded, not derived from the request.
 *
 * Only the fields the public UI renders are projected, so moderation metadata
 * doesn't ride along.
 */
export async function GET() {
  try {
    await connectToDatabase();

    const testimonials = await Testimonial.find({ isActive: true })
      .select("name location goal outcome initial rating avatarUrl imageUrl orderImageUrl createdAt")
      .sort({ createdAt: -1 })
      .limit(MAX_RESULTS)
      .lean();

    return NextResponse.json(testimonials);
  } catch (error) {
    return serverError("testimonials:GET", error, "Failed to fetch reviews");
  }
}

// Public endpoint — customers submit a review from the "Customer Love" section.
// Submissions land as inactive and only appear on the site after admin approval.
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success, retryAfterSeconds } = await checkRateLimit("testimonial", ip, {
      route: "/api/testimonials",
    });
    if (!success) {
      return tooManyRequests(
        "Too many submissions. Please wait a moment and try again.",
        retryAfterSeconds
      );
    }

    await connectToDatabase();

    const parsed = await readJsonBody<Record<string, unknown>>(req, 32 * 1024);
    if (!parsed.ok) return parsed.response;

    const { name, location, goal, outcome, rating, refId, avatarUrl, orderImageUrl } = parsed.data ?? {};

    if (!name || !location || !goal || !outcome || !refId) {
      return badRequest("Name, location, order ref ID, and both messages are required");
    }

    // Strip markup as well as trimming: these values are rendered on the home
    // and about pages once approved.
    const clean = (value: unknown, max: number) => stripTags(String(value ?? "")).trim().slice(0, max);

    // Avatar and order photo are optional and must be our own ImageKit uploads.
    // Compared against the parsed endpoint origin rather than a string prefix,
    // so a lookalike host or neighbouring account id can't pass.
    const safeAvatar = isOwnImageKitUrl(avatarUrl) ? String(avatarUrl) : "";
    const safeOrderImage = isOwnImageKitUrl(orderImageUrl) ? String(orderImageUrl) : "";

    const cleanName = clean(name, 80);
    if (!cleanName) {
      return badRequest("Please enter your name.");
    }

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
  } catch (error) {
    return serverError("testimonials:POST", error, "Failed to submit review");
  }
}
