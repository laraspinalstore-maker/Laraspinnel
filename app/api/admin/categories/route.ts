import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError, readJsonBody, badRequest, isDuplicateKeyError } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Category from "@/models/Category";
import { categorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { revalidateCatalog } from "@/lib/data/revalidate";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const categories = await Category.find({}).sort({ name: 1 }).lean();
    return NextResponse.json(categories);
  } catch (error) {
    return serverError("Admin Categories GET error:", error, "Failed to fetch categories");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();

    const parsed = await readJsonBody(req, 256 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const result = categorySchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, description, image, isActive } = result.data;
    const slug = slugify(name);

    // Verify slug uniqueness
    const existing = await Category.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 400 }
      );
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
      isActive,
    });

    revalidateCatalog();

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    // The slug uniqueness check above is a read-then-write: two concurrent
    // requests both pass it and the unique index rejects one. Report that as the
    // same 400 the check would have returned, not an opaque 500.
    if (isDuplicateKeyError(error)) {
      return badRequest("A category with this name already exists.");
    }
    return serverError("Admin Category POST error:", error, "Failed to create category");
  }
}
export const revalidate = 0;
