/**
 * Classifying orders by CATALOG product category.
 *
 * Matching is done purely on `items[].productId` — an order belongs to a category
 * only when it contains a real product filed under that category.
 *
 * Custom-order requests are deliberately NOT matched, even when the customer
 * picked the same category name. The custom-order form stores its chosen category
 * only inside the line item's name (`Custom Order — Bangles`, see
 * app/api/custom-orders/route.ts) and carries no productId, so those are quote
 * requests against a category label rather than orders for a catalogued product.
 * They stay in the main list.
 *
 * The name is never substring-searched: a product called "Bangle Keychain" is
 * filed under Keychains, and matching on its title would put it in the wrong
 * group.
 */

/** Catalog category slug that drives the separate section on the orders page. */
export const BANGLES_CATEGORY_SLUG = "bangles";

export interface ClassifiableOrderItem {
  productId?: unknown;
}

/**
 * Whether an order contains at least one product from the given category.
 *
 * `categoryProductIds` is the set of product ids in that category, which the
 * caller resolves once for the whole page rather than per order.
 */
export function orderMatchesCategory(
  items: ClassifiableOrderItem[] | undefined,
  categoryProductIds: ReadonlySet<string>
): boolean {
  if (!items?.length || categoryProductIds.size === 0) return false;

  return items.some((item) => Boolean(item.productId) && categoryProductIds.has(String(item.productId)));
}
