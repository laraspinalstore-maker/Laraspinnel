import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError, readJsonBody, badRequest, isDuplicateKeyError, isValidObjectId, notFound } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Category from "@/models/Category";
import Product from "@/models/Product";
import { categorySchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { deleteImageByUrl } from "@/lib/imagekit";
import { revalidateAllProductPages, revalidateCatalog } from "@/lib/data/revalidate";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Category not found");
    const category = await Category.findById(id).lean();

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    return serverError("Admin Category Detail GET error:", error, "Failed to fetch category");
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Category not found");

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

    // Verify slug uniqueness (excluding current)
    const existing = await Category.findOne({ slug, _id: { $ne: id } });
    if (existing) {
      return NextResponse.json(
        { error: "A category with this name already exists." },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndUpdate(
      id,
      { name, slug, description, image, isActive },
      { returnDocument: 'after' }
    );

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // A category rename changes /shop?category=<slug>, the category tiles on the
    // homepage, and the sitemap. Product pages carry the category name in their
    // breadcrumb and Product schema, so they are purged too.
    revalidateCatalog();
    revalidateAllProductPages();

    return NextResponse.json(category);
  } catch (error) {
    // The slug uniqueness check above is a read-then-write: two concurrent
    // requests both pass it and the unique index rejects one. Report that as the
    // same 400 the check would have returned, not an opaque 500.
    if (isDuplicateKeyError(error)) {
      return badRequest("A category with this name already exists.");
    }
    return serverError("Admin Category PUT error:", error, "Failed to update category");
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Category not found");

    // Check if category is used by products
    const productCount = await Product.countDocuments({ category: id });
    if (productCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete category because it has ${productCount} associated products. Remove or reassign them first.` },
        { status: 400 }
      );
    }

    const category = await Category.findByIdAndDelete(id);

    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    // Deleting is only allowed with zero associated products (checked above), so
    // product pages cannot be affected — only the listings and the sitemap.
    revalidateCatalog();

    // Free up ImageKit storage — best-effort, never blocks the delete response.
    if (category.image) {
      await deleteImageByUrl(category.image).catch((err) =>
        console.error("Failed to delete category image from ImageKit:", err)
      );
    }

    return NextResponse.json({ message: "Category deleted successfully" });
  } catch (error) {
    return serverError("Admin Category DELETE error:", error, "Failed to delete category");
  }
}
export const revalidate = 0;
