/**
 * Renders a page's structured data as one `application/ld+json` script.
 *
 * Emitting a single `@graph` rather than N sibling scripts means cross-node
 * references resolve within one document: a Product's `seller` points at
 * `#organization`, its `shippingDetails` at `#shipping-in`, and each is defined
 * exactly once. The site previously shipped five separate scripts on every page.
 *
 * `serializeJsonLd` is imported from `lib/security/url` rather than
 * `lib/security/sanitize`. Both re-export it, but `sanitize` top-level-imports
 * sanitize-html (~200KB) — the two modules were split apart specifically so that
 * shared code could take the escaping helpers without dragging the sanitiser in.
 */

import { serializeJsonLd } from "@/lib/security/url";
import type { SchemaNode } from "./schema";

export default function JsonLd({ graph }: { graph: (SchemaNode | null)[] }) {
  const nodes = graph.filter((node): node is SchemaNode => node !== null);
  if (!nodes.length) return null;

  return (
    <script
      type="application/ld+json"
      // serializeJsonLd escapes <, >, & and the U+2028/U+2029 line separators,
      // so no node value can break out of the script element.
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd({
          "@context": "https://schema.org",
          "@graph": nodes,
        }),
      }}
    />
  );
}
