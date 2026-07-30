import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import Testimonial from "@/models/Testimonial";
import { requireAdmin, isDenied, serverError, badRequest, readJsonBody } from "@/lib/security/http";
import { isOwnImageKitUrl, stripTags } from "@/lib/security/sanitize";
import { logSecurityEvent, maskEmail } from "@/lib/security/audit";

export const dynamic = "force-dynamic";

/**
 * Admin review list — includes unapproved submissions, so it requires a session.
 *
 * SECURITY: this handler previously had NO authorization check (the only admin
 * route that didn't), and public pages fetched it directly. Anonymous callers
 * could omit `activeOnly` and read every row, including reviews pending
 * moderation. Public pages now use `GET /api/testimonials`, which hardcodes
 * `isActive: true`.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const url = new URL(req.url);
    const activeOnly = url.searchParams.get("activeOnly") === "true";
    const query = activeOnly ? { isActive: true } : {};

    const testimonials = await Testimonial.find(query).sort({ createdAt: -1 }).lean();

    return NextResponse.json(testimonials);
  } catch (error) {
    return serverError("admin-testimonials:GET", error, "Failed to fetch testimonials");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();

    const parsed = await readJsonBody<Record<string, unknown>>(req, 32 * 1024);
    if (!parsed.ok) return parsed.response;

    const { name, location, goal, outcome, rating, refId, avatarUrl, imageUrl, orderImageUrl, isActive } =
      parsed.data ?? {};

    // Image URLs are pinned to this project's own ImageKit account even for an
    // admin: these values are rendered as raw <img src> on public pages, so an
    // arbitrary host would become a third-party beacon on every visitor.
    const safeAvatar = isOwnImageKitUrl(avatarUrl) ? String(avatarUrl) : "";
    const safeImage = isOwnImageKitUrl(imageUrl) ? String(imageUrl) : "";
    const safeOrderImage = isOwnImageKitUrl(orderImageUrl) ? String(orderImageUrl) : "";

    if (!name && !safeImage) {
      return badRequest("Review name or image upload is required");
    }

    const clean = (value: unknown, max: number) => stripTags(String(value ?? "")).trim().slice(0, max);

    const cleanName = clean(name, 80) || "Customer Review";
    const initial = cleanName.charAt(0).toUpperCase();

    const newTestimonial = await Testimonial.create({
      name: cleanName,
      location: clean(location, 80),
      goal: clean(goal, 500),
      outcome: clean(outcome, 1000),
      initial,
      rating: Math.min(5, Math.max(1, Number(rating) || 5)),
      refId: clean(refId, 40) || "ADMIN-CREATED",
      avatarUrl: safeAvatar,
      imageUrl: safeImage,
      orderImageUrl: safeOrderImage,
      isActive: isActive !== undefined ? Boolean(isActive) : true,
    });

    logSecurityEvent("admin.mutation", {
      actor: maskEmail(auth.admin.email),
      resource: "testimonial",
      resourceId: String(newTestimonial._id),
      action: "POST",
    });

    revalidatePath("/");
    revalidatePath("/about");

    return NextResponse.json(newTestimonial, { status: 201 });
  } catch (error) {
    return serverError("admin-testimonials:POST", error, "Failed to create testimonial");
  }
}
