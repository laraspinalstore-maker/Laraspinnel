import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { escapeRegex } from "@/lib/security/sanitize";
import { serverError } from "@/lib/security/http";

/** Longest search term accepted. Beyond this it's a scan, not a search. */
const MAX_SEARCH_LENGTH = 80;

/** Cap on returned documents so one call can't pull the whole table. */
const MAX_RESULTS = 200;

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const { searchParams } = new URL(req.url);
    const featured = searchParams.get("featured");
    const categorySlug = searchParams.get("category");
    const search = searchParams.get("search");
    const sort = searchParams.get("sort");

    const query: Record<string, unknown> = { isActive: true };

    // Filter by featured
    if (featured === "true") {
      query.isFeatured = true;
    }

    // Filter by category slug. Coerced to a bounded string so the value is
    // compared as a literal and can't arrive as a query operator object.
    if (categorySlug && categorySlug !== "all") {
      const categoryDoc = await Category.findOne({
        slug: String(categorySlug).slice(0, 120),
        isActive: true,
      });
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        // If category is not found, return empty array
        return NextResponse.json([]);
      }
    }

    // Filter by search query.
    //
    // SECURITY: the term was previously interpolated straight into `$regex`, so
    // a request like ?search=(a%2B)%2B%24 compiled to a catastrophically
    // backtracking pattern that MongoDB then evaluated against every document —
    // an unauthenticated, single-request CPU denial of service. It is now
    // escaped to a literal substring match and length-capped.
    if (search) {
      const term = String(search).trim().slice(0, MAX_SEARCH_LENGTH);
      if (term) {
        query.name = { $regex: escapeRegex(term), $options: "i" };
      }
    }

    // Only known sort keys are honoured — an arbitrary field from the query
    // string would let a caller sort on an unindexed column.
    let sortOption: Record<string, 1 | -1> = { name: 1 };
    if (sort === "price-asc") {
      sortOption = { price: 1 };
    } else if (sort === "price-desc") {
      sortOption = { price: -1 };
    } else if (sort === "latest") {
      sortOption = { createdAt: -1 };
    }

    const products = await Product.find(query)
      .populate("category", "name slug")
      .sort(sortOption)
      .limit(MAX_RESULTS)
      .lean();

    return NextResponse.json(products);
  } catch (error) {
    return serverError("products:GET", error, "Failed to fetch products");
  }
}
export const dynamic = "force-dynamic";
