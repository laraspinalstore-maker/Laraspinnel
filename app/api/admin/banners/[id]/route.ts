import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError, readJsonBody, isValidObjectId, notFound } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Banner from "@/models/Banner";
import { bannerSchema } from "@/lib/validations";
import { deleteImageByUrl } from "@/lib/imagekit";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Banner not found");

    const parsed = await readJsonBody(req, 32 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const result = bannerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { imageUrl, headline, subtext, buttonText, buttonLink, buttonTheme, order, isActive } = result.data;

    const updatedBanner = await Banner.findByIdAndUpdate(
      id,
      {
        imageUrl,
        headline,
        subtext,
        buttonText,
        buttonLink,
        buttonTheme,
        order,
        isActive,
      },
      { returnDocument: 'after' }
    );

    if (!updatedBanner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    return NextResponse.json(updatedBanner);
  } catch (error) {
    return serverError("Admin Banners PUT error:", error, "Failed to update banner");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Banner not found");

    const banner = await Banner.findByIdAndDelete(id);
    if (!banner) {
      return NextResponse.json({ error: "Banner not found" }, { status: 404 });
    }

    // Free up ImageKit storage — best-effort, never blocks the delete response.
    if (banner.imageUrl) {
      await deleteImageByUrl(banner.imageUrl).catch((err) =>
        console.error("Failed to delete banner image from ImageKit:", err)
      );
    }

    return NextResponse.json({ message: "Banner deleted successfully" });
  } catch (error) {
    return serverError("Admin Banners DELETE error:", error, "Failed to delete banner");
  }
}
