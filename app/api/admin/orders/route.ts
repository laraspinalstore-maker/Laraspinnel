import { NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Category from "@/models/Category";
import { BANGLES_CATEGORY_SLUG, orderMatchesCategory } from "@/lib/orderCategories";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const orders = await Order.find({}).sort({ createdAt: -1 }).lean();

    // Resolve the Bangles category's product ids ONCE for the whole list, rather
    // than per order. Matched on slug rather than name so renaming the category's
    // display text doesn't quietly break the grouping.
    const banglesCategory = await Category.findOne({ slug: BANGLES_CATEGORY_SLUG })
      .select("_id")
      .lean();

    const banglesProductIds = new Set<string>();
    if (banglesCategory) {
      const banglesProducts = await Product.find({ category: banglesCategory._id })
        .select("_id")
        .lean();
      for (const p of banglesProducts) banglesProductIds.add(String(p._id));
    }

    // `isBangles` is computed server-side so the client needs no product or
    // category data to group the list. Catalog products only — custom-order
    // requests that merely name the category are excluded by design, see
    // lib/orderCategories.ts.
    const enriched = orders.map((order) => ({
      ...order,
      isBangles: orderMatchesCategory(order.items, banglesProductIds),
    }));

    return NextResponse.json(enriched);
  } catch (error) {
    return serverError("Admin Orders GET error:", error, "Failed to fetch orders");
  }
}
export const revalidate = 0;
