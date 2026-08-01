import { NextRequest, NextResponse } from "next/server";
import { sanitizeRichText } from "@/lib/security/sanitize";
import { requireAdmin, isDenied, serverError, readJsonBody, badRequest, isDuplicateKeyError, isValidObjectId, notFound } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";
import { deleteImageByUrl } from "@/lib/imagekit";
import { revalidateCatalog } from "@/lib/data/revalidate";

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
    if (!isValidObjectId(id)) return notFound("Product not found");
    const product = await Product.findById(id).populate("category", "name").lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    return serverError("Admin Product Detail GET error:", error, "Failed to fetch product details");
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
    if (!isValidObjectId(id)) return notFound("Product not found");

    const parsed = await readJsonBody(req, 512 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data;
    const result = productSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, category, price, discountPrice, images, stock, isFeatured, isActive } = result.data;

    // The description is the one admin field rendered as HTML (product page,
    // via dangerouslySetInnerHTML). Sanitized HERE rather than in the zod schema:
    // lib/validations.ts is shared with a client component, so it cannot import
    // sanitize-html — and the route is the correct boundary anyway, since it also
    // covers a caller posting straight to the API.
    const description = sanitizeRichText(result.data.description);
    const slug = slugify(name);

    // Verify slug uniqueness (excluding current)
    const existing = await Product.findOne({ slug, _id: { $ne: id } });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this name already exists." },
        { status: 400 }
      );
    }

    // Captured before the write: a rename leaves a cached page under the old
    // /shop/<slug>, which would keep serving the previous content at a URL that no
    // longer resolves. Both slugs get purged below.
    const previous = await Product.findById(id).select("slug").lean<{ slug?: string }>();

    const product = await Product.findByIdAndUpdate(
      id,
      { name, slug, category, price, discountPrice, description, images, stock, isFeatured, isActive },
      { returnDocument: 'after' }
    );

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    revalidateCatalog(slug, previous?.slug);

    return NextResponse.json(product);
  } catch (error) {
    // The slug uniqueness check above is a read-then-write: two concurrent
    // requests both pass it and the unique index rejects one. Report that as the
    // same 400 the check would have returned, not an opaque 500.
    if (isDuplicateKeyError(error)) {
      return badRequest("A product with this name already exists.");
    }
    return serverError("Admin Product PUT error:", error, "Failed to update product");
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
    if (!isValidObjectId(id)) return notFound("Product not found");

    const product = await Product.findByIdAndDelete(id);

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Drop the cached product page immediately, so the deleted URL starts
    // answering 404 instead of serving its stale ISR entry for another 5 minutes.
    revalidateCatalog(product.slug);

    // Free up ImageKit storage — best-effort, never blocks the delete response.
    await Promise.all(
      (product.images || []).map((url: string) =>
        deleteImageByUrl(url).catch((err) => console.error("Failed to delete product image from ImageKit:", err))
      )
    );

    return NextResponse.json({ message: "Product deleted successfully" });
  } catch (error) {
    return serverError("Admin Product DELETE error:", error, "Failed to delete product");
  }
}
export const revalidate = 0;
