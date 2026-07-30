import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin, isDenied, serverError, readJsonBody, isValidObjectId, notFound } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Testimonial from "@/models/Testimonial";
import { isOwnImageKitUrl, stripTags } from "@/lib/security/sanitize";
import { logSecurityEvent, maskEmail } from "@/lib/security/audit";

/** Fields this endpoint is allowed to write. */
interface TestimonialUpdate {
  name?: string;
  initial?: string;
  location?: string;
  goal?: string;
  outcome?: string;
  rating?: number;
  refId?: string;
  avatarUrl?: string;
  imageUrl?: string;
  orderImageUrl?: string;
  isActive?: boolean;
}

const clean = (value: unknown, max: number) => stripTags(String(value ?? "")).trim().slice(0, max);

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization first, always: validating the id before checking the session
    // lets an unauthenticated caller distinguish a malformed id (404) from a
    // well-formed one (401), and no request should get any answer about a
    // resource before it has been authorized.
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    const params = await props.params;
    if (!isValidObjectId(params.id)) return notFound("Testimonial not found");

    await connectToDatabase();

    const parsed = await readJsonBody<Record<string, unknown>>(req, 32 * 1024);
    if (!parsed.ok) return parsed.response;

    const { name, location, goal, outcome, rating, refId, avatarUrl, imageUrl, orderImageUrl, isActive } =
      parsed.data ?? {};

    // Built as an explicit typed object rather than spreading the request body,
    // so only these keys can ever be written — text is stripped of markup
    // (these render on public pages) and image URLs are pinned to this project's
    // own ImageKit account, which the previous version did not check at all.
    const updateData: TestimonialUpdate = {};

    if (name) {
      const cleanName = clean(name, 80);
      if (cleanName) {
        updateData.name = cleanName;
        updateData.initial = cleanName.charAt(0).toUpperCase();
      }
    }
    if (location !== undefined) updateData.location = clean(location, 80);
    if (goal !== undefined) updateData.goal = clean(goal, 500);
    if (outcome !== undefined) updateData.outcome = clean(outcome, 1000);
    if (rating) updateData.rating = Math.min(5, Math.max(1, Number(rating) || 5));
    if (refId) updateData.refId = clean(refId, 40);
    if (avatarUrl !== undefined) updateData.avatarUrl = isOwnImageKitUrl(avatarUrl) ? String(avatarUrl) : "";
    if (imageUrl !== undefined) updateData.imageUrl = isOwnImageKitUrl(imageUrl) ? String(imageUrl) : "";
    if (orderImageUrl !== undefined) {
      updateData.orderImageUrl = isOwnImageKitUrl(orderImageUrl) ? String(orderImageUrl) : "";
    }
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      params.id,
      updateData,
      { returnDocument: 'after' }
    );

    if (!updatedTestimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

    logSecurityEvent("admin.mutation", {
      actor: maskEmail(auth.admin.email),
      resource: "testimonial",
      resourceId: params.id,
      action: "PUT",
    });

    revalidatePath("/");
    revalidatePath("/about");

    return NextResponse.json(updatedTestimonial);
  } catch (error) {
    return serverError("admin-testimonials-id:PUT", error, "Failed to update testimonial");
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    // Authorization first, always: validating the id before checking the session
    // lets an unauthenticated caller distinguish a malformed id (404) from a
    // well-formed one (401), and no request should get any answer about a
    // resource before it has been authorized.
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    const params = await props.params;
    if (!isValidObjectId(params.id)) return notFound("Testimonial not found");

    await connectToDatabase();

    const deletedTestimonial = await Testimonial.findByIdAndDelete(params.id);

    if (!deletedTestimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

    logSecurityEvent("admin.mutation", {
      actor: maskEmail(auth.admin.email),
      resource: "testimonial",
      resourceId: params.id,
      action: "DELETE",
    });

    revalidatePath("/");
    revalidatePath("/about");

    return NextResponse.json({ success: true });
  } catch (error) {
    return serverError("admin-testimonials-id:DELETE", error, "Failed to delete testimonial");
  }
}
