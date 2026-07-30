import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import { serverError } from "@/lib/security/http";
import { sanitizeRichText } from "@/lib/security/sanitize";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    await connectToDatabase();
    const { slug } = await params;

    // Bounded string, so the value is matched literally and an absurdly long
    // path segment never reaches the query.
    if (!slug || slug.length > 200) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const product = await Product.findOne({ slug, isActive: true })
      .populate("category", "name slug")
      .lean();

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // A product whose category was deleted leaves `category` unpopulated, so
    // reading `.category._id` threw a TypeError that surfaced as a 500.
    const category = product.category as unknown;
    const categoryId =
      category && typeof category === "object" && "_id" in category
        ? (category as { _id: unknown })._id
        : category;

    // Fetch related products (same category, active, excluding this one)
    const relatedProducts = categoryId
      ? await Product.find({
          category: categoryId,
          slug: { $ne: slug },
          isActive: true,
        })
          .limit(4)
          .lean()
      : [];

    // The product page is a client component that renders `description` with
    // `dangerouslySetInnerHTML`. Sanitizing here rather than there keeps the
    // sanitizer on the server: it can't be skipped by any other consumer of this
    // endpoint, and `sanitize-html` stays out of the browser bundle.
    return NextResponse.json({
      product: { ...product, description: sanitizeRichText(product.description) },
      relatedProducts,
    });
  } catch (error) {
    return serverError("products-slug:GET", error, "Failed to fetch product details");
  }
}
export const revalidate = 10;
