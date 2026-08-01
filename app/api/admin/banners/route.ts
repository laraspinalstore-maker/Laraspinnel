import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError, readJsonBody } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Banner from "@/models/Banner";
import { bannerSchema } from "@/lib/validations";
import { revalidatePath } from "next/cache";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const banners = await Banner.find().sort({ order: 1, createdAt: -1 }).lean();
    return NextResponse.json(banners);
  } catch (error) {
    return serverError("Admin Banners GET error:", error, "Failed to fetch banners");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();

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

    const banner = await Banner.create({
      imageUrl,
      headline,
      subtext,
      buttonText,
      buttonLink,
      buttonTheme,
      order,
      isActive,
    });

    // The homepage hero is ISR (revalidate = 60), so a new banner needs an
    // explicit purge to show up straight away.
    revalidatePath("/");

    return NextResponse.json(banner, { status: 201 });
  } catch (error) {
    return serverError("Admin Banners POST error:", error, "Failed to create banner");
  }
}
