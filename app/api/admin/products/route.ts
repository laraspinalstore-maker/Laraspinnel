import { NextRequest, NextResponse } from "next/server";
import { sanitizeRichText } from "@/lib/security/sanitize";
import { requireAdmin, isDenied, serverError, readJsonBody, badRequest, isDuplicateKeyError } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import { productSchema } from "@/lib/validations";
import { slugify } from "@/lib/utils";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const products = await Product.find({})
      .populate("category", "name slug")
      .sort({ name: 1 })
      .lean();
    return NextResponse.json(products);
  } catch (error) {
    return serverError("Admin Products GET error:", error, "Failed to fetch products");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();

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

    // Verify slug uniqueness
    const existing = await Product.findOne({ slug });
    if (existing) {
      return NextResponse.json(
        { error: "A product with this name already exists." },
        { status: 400 }
      );
    }

    const product = await Product.create({
      name,
      slug,
      category,
      price,
      discountPrice,
      description,
      images,
      stock,
      isFeatured,
      isActive,
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    // The slug uniqueness check above is a read-then-write: two concurrent
    // requests both pass it and the unique index rejects one. Report that as the
    // same 400 the check would have returned, not an opaque 500.
    if (isDuplicateKeyError(error)) {
      return badRequest("A product with this name already exists.");
    }
    return serverError("Admin Product POST error:", error, "Failed to create product");
  }
}
export const revalidate = 0;
