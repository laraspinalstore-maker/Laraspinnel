/**
 * Server-side category queries. SERVER ONLY — imports mongoose.
 *
 * The sort order must stay identical to `app/api/categories/route.ts`
 * (`.sort({ name: 1 })`). The shop page seeds SWR's "/api/categories" key with
 * this result and SWR then refetches through the API; a different order would
 * make the filter sidebar and the mobile category dropdown reorder themselves
 * after hydration.
 */

import { cache } from "react";
import type { Types } from "mongoose";
import { connectToDatabase } from "@/lib/db";
import Category from "@/models/Category";
import type { CategoryDTO } from "./types";

interface LeanCategory {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  updatedAt?: Date;
}

/** Every active category, ordered by name. Throws on database failure. */
export const listActiveCategories = cache(async (): Promise<CategoryDTO[]> => {
  await connectToDatabase();
  const docs = await Category.find({ isActive: true })
    .sort({ name: 1 })
    .lean<LeanCategory[]>();

  return docs.map((doc) => ({
    _id: String(doc._id),
    name: doc.name,
    slug: doc.slug,
    description: doc.description ?? "",
    image: doc.image ?? "",
  }));
});

/**
 * Slugs and modification times for every active category. Used by the sitemap,
 * which needs `updatedAt` and therefore cannot reuse the DTO above.
 */
export const getActiveCategorySlugs = cache(
  async (): Promise<{ slug: string; name: string; updatedAt: Date }[]> => {
    await connectToDatabase();
    const docs = await Category.find({ isActive: true })
      .select("slug name updatedAt")
      .sort({ name: 1 })
      .lean<{ slug: string; name: string; updatedAt?: Date }[]>();
    return docs.map((d) => ({
      slug: d.slug,
      name: d.name,
      updatedAt: d.updatedAt ?? new Date(0),
    }));
  }
);
