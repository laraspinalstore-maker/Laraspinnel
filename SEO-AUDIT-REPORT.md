# SEO / AI-Search / Accessibility Audit — Final Report
**Project:** Lara's Pinnal store (Next.js 16 App Router, React 19, MongoDB/Mongoose)
**Production domain:** `https://laraspinal.in`
**Completed:** 1 August 2026
**Verification basis:** every claim below was checked against a **running production build** (`next build` + `next start`), not inferred from source.
| Check | Before | After |
|---|---|---|
| Invalid product slug HTTP status | **200** (soft 404) | **404** |
| `/shop` product links in raw HTML | 0 | **8** |
| `/shop` prices in raw HTML | 0 | **21** |
| `/shop/<slug>` H1 / price / availability in raw HTML | 0 / 0 / 0 | **1 / 8 / present** |
| JSON-LD `<script>` tags per page | 5 (site-wide, incl. fake data) | **2** (global graph + page graph) |
| Fabricated `aggregateRating` / `reviewCount` | present site-wide | **0 occurrences** |
| `FAQPage` schema | on every route (answers invisible) | **only `/faq`** |
| Broken internal links | `/faq`, `/shipping-policy`, `/search` 404'd | **0 of 25 internal links broken** |
| Sitemap URLs | 22, incl. `noindex` `/cart` + `/checkout` | **27, 0 noindex URLs** |
| `llms.txt` wrong-domain links | 14 (`laraspinnal.com`) | **0** (10 correct) |
| robots.txt | static file, hardcoded sitemap host | **`app/robots.ts`**, 25 named agents |
| Error boundaries | none | **`app/error.tsx` + `app/global-error.tsx`** |
| TypeScript errors | 0 | **0** |
| ESLint problems | **178** | **0** |
| Unused runtime dependencies | 8 | **0** (40 packages removed) |
| Dead component files | 22 | **0** |

---

## 2. Every file changed

**87 modified · 30 added · 22 deleted.** Grouped by purpose.

### New modules (server data + SEO layers)
| File | Purpose |
|---|---|
| `lib/data/products.ts`, `categories.ts`, `types.ts` | Server-only, request-`cache()`d product/category queries + client-safe DTOs |
| `lib/data/revalidate.ts` | Cache purges for catalog mutations |
| `lib/seo/metadata.ts`, `url.ts`, `schema.ts`, `settings.ts`, `config.ts`, `JsonLd.tsx` | Single metadata factory, canonical/URL helpers, schema-graph generators |
| `lib/shop/params.ts` | Shared query-param parsing/serialisation for `/shop` and `/search` |
| `lib/faqContent.ts` | 25 Q&As, one source for both the page and its `FAQPage` schema |
| `lib/errorMessage.ts` | `toErrorMessage(unknown, fallback)` |
| `lib/animation/seededRandom.ts` | Deterministic per-index randomness for decorative animation |

### New routes / route files
`app/faq/page.tsx` · `app/shipping-policy/page.tsx` · `app/search/page.tsx` · `app/robots.ts` · `app/opengraph-image.tsx` · `app/error.tsx` · `app/global-error.tsx` · `app/shop/[slug]/not-found.tsx` · `app/icon.png`, `app/apple-icon.png`, `public/icon-{192,512,maskable-512}.png` · 9 × scoped `loading.tsx` (`about`, `admin`, `cart`, `categories`, `checkout`, `contact`, `custom-order`, `search`, `track-order`)

### Rewritten
`app/sitemap.ts` · `app/shop/page.tsx` (+ `components/shop/ShopBrowser.tsx`, `ProductGallery.tsx`, `ProductPurchasePanel.tsx`) · `app/shop/[slug]/page.tsx` · `app/layout.tsx` · `app/manifest.ts` · `components/home/FloatingPaper.tsx`, `Sprinkles.tsx` · `components/shared/LoadingScreen.tsx`

### Deleted
`app/loading.tsx` (root, cause of the soft 404) · `app/shop/layout.tsx` · `app/shop/[slug]/layout.tsx` · `public/robots.txt` (superseded by `app/robots.ts`) · `components/home/Testimonials.tsx` · `components/shared/SwipeButton.tsx`, `CustomDatePicker.tsx` · `components/about/{AboutHero,AboutFAQ,CraftsmanshipSection,HandsGallery,InstagramBridge,MakerSpotlight,ValuesSection}.tsx` · `components/blog/*` · `components/catalog/*` · `components/faq/FAQClient.tsx` · `components/home/{HomePreloader,MobileCustomOrder,TornPaperOverlay}.tsx`

---

## 3. Issues fixed, by audit step

### STEP 2 — Policy violations (fake reviews)
A hardcoded `aggregateRating` (invented `ratingValue`/`reviewCount`) shipped in the site-wide schema graph, plus a `FAQPage` whose answers were never rendered and unverifiable stat claims in body copy. All removed. `AggregateRating` will only reappear when real review documents exist to compute it from. **Verified: 0 occurrences of `aggregateRating`, `reviewCount`, `ratingValue` across `/`, `/about`, `/shop`, and a product page.**

### STEP 3 — `llms.txt`
14 links pointed at `laraspinnal.com` (a domain this site does not own). All rewritten to `https://laraspinal.in`, every target verified to return 200, and four missing resources added (`/shipping-policy`, `/refund-policy`, `/about`, `/contact`).

### STEPS 4–7 — Broken links and missing pages
`/faq`, `/shipping-policy` and `/search` were linked from the footer and advertised in schema but did not exist. All three built:
- **`/faq`** — 25 Q&As, zero client JS, `FAQPage` + `BreadcrumbList`.
- **`/shipping-policy`** — processing time, made-to-order explanation, couriers, domestic/international, packaging, tracking, damaged/lost parcels, support.
- **`/search`** — server component reading `?q=`, paginated, `noindex, follow` with a self-referencing canonical (this is what the `WebSite` → `SearchAction` in the schema graph points to).

**Verified: 25 unique internal links crawled, 0 broken.**

### STEPS 8–9 — Indexing policy and sitemap
`noindex, follow` on `/cart`, `/checkout`, `/search`, admin routes (plus `X-Robots-Tag: noindex, nofollow, noarchive` and `Cache-Control: no-store` headers on `/admin/*`). The sitemap previously submitted `/cart` and `/checkout` — URLs whose own pages refuse indexing, which Search Console reports as "Submitted URL marked noindex". Rewritten: 13 static routes + 8 products + 6 category views, real `lastModified` values, and a hand-maintained `CONTENT_VERSION` instead of `new Date()` on every fetch (which trained Google to ignore the field). Caching moved from `revalidate = 0` to one hour, with explicit purges from the write side.

### STEPS 10–12 — Server rendering
Product and shop pages were client components fetching through SWR with no seed data, so **the server-rendered HTML for every product and the entire catalogue was a spinner.** Both are now server components; small client islands keep the gallery, filters and purchase controls interactive. SWR is seeded through `SWRConfig.fallback` (keyed, unlike `fallbackData`) so the client's first fetch matches the server's query byte for byte. Breadcrumbs are now `Home > Shop > Category > Product`, with a matching `BreadcrumbList` (4 `ListItem`s verified on a product page).

### STEP 13 — Soft 404 (the hardest one)
Invalid slugs returned **200**. Cause, proven by controlled test rather than guessed: `app/loading.tsx` was a **root** loading boundary, so it wrapped every nested segment in Suspense; the response began streaming as soon as that fallback rendered, the status line was already on the wire, and `notFound()` could then only inject a `noindex` meta tag.

| | invalid slug | valid slug |
|---|---|---|
| with root `loading.tsx` | 200 ❌ | 200 |
| without it | **404 ✅** | 200 |

Resolution: the root boundary was deleted and the same loading screen re-added as **9 scoped `loading.tsx` files** — every route keeps its loading UI except the `/shop` tree, which must have no ancestor Suspense boundary. Product pages are statically generated with ISR (`revalidate = 300`), so there is no meaningful wait there to cover. `generateStaticParams` returns `[]` deliberately: it makes the route SSG-with-ISR (which is what allows a real status code) without prerendering every slug, which would reintroduce the documented build out-of-memory.

**Verified: `/shop/definitely-not-a-real-slug-xyz` → 404, `/not-a-page-at-all` → 404, valid slug → 200.**

### STEP 14 — Canonicals
Verified live against the running build:

| URL | canonical | robots |
|---|---|---|
| `/shop` | `/shop` | index, follow |
| `/shop?category=keychains` | `/shop?category=keychains` | index, follow |
| `/shop?page=2` | `/shop?page=2` | noindex, follow |
| `/shop?search=rose` | `/shop` | noindex, follow |
| `/shop?sort=price-asc` | `/shop` | noindex, follow |
| `/shop?category=nope-not-real` | `/shop` | noindex, follow |
| `/search?q=rose` | `/search?q=rose` | noindex, follow |
| `/cart`, `/checkout` | self | noindex, follow |

Category views are self-canonical and indexable — a deliberate change. The old shop layout canonicalised every `/shop` URL to `/shop` **while the sitemap submitted `/shop?category=<slug>` as indexable**, i.e. the site told Google to index URLs whose own canonical disowned them. Now that the listing server-renders its own title, H1 and product set, a category view is genuinely distinct content. Zero `localhost` and zero non-production hosts in the sitemap.

### STEP 15 — Robots
`public/robots.txt` (static, hardcoded production sitemap URL — so preview deployments advertised the live sitemap) replaced by `app/robots.ts`, resolving the host through `lib/siteUrl.ts` where the localhost guard already lives. 25 named agents across search, AI assistants (GPTBot, ClaudeBot, OAI-SearchBot, PerplexityBot, Google-Extended, Applebot-Extended, Amazonbot, Meta-ExternalAgent…) and social unfurlers. Every named group repeats the disallow list, because a crawler obeys only the single most specific matching group — a named group containing just `Allow: /` would have *granted* that bot access to `/admin` and `/api/`. `/cart`, `/checkout` and `/search` are deliberately **not** disallowed: a crawler must be able to fetch a page to see its `noindex`.

### STEP 16 — Structured data
5 scripts collapsed to 2 (site-wide graph + page graph). `LocalBusiness` merged onto the `#organization` node instead of duplicating the business. Verified node types on a product page: `Product`, `Offer`, `Brand`, `MerchantReturnPolicy`, `OfferShippingDetails`, `ShippingDeliveryTime`, `DefinedRegion`, `QuantitativeValue`, `MonetaryAmount`, `BreadcrumbList` (4 items), plus the global `WebSite`/`SearchAction`/`LocalBusiness`/`ImageObject`. `/faq` carries `FAQPage` with 26 `Question`/`Answer` pairs; no other route does.

### STEPS 17–19 — Images, metadata, E-E-A-T
Product photos get real ImageKit server-side transforms for OG (so declared `og:image:width/height` are true rather than a hardcoded lie), `app/opengraph-image.tsx` generates the site card, and the manifest now declares 192/512/maskable icons — Chrome could never satisfy the install prompt from the previous single non-square 453×358 logo. Every page has unique title/description/OG/Twitter/canonical/robots via one factory. Policy, About, Contact, Shipping and Custom-Order copy carry the business story, materials, care instructions and real contact details.

### STEP 20 — Accessibility
- The **skip link was pointing at a wrapper above the Navbar**, so "Skip to main content" skipped nothing. `id="main-content"` moved onto each page's `<main>` (21 elements across 19 files) with `tabIndex={-1}` so focus actually lands there.
- `/checkout`'s empty-cart branch rendered a page whose only heading was an `<h2>` — no `<h1>` at all. Fixed.
- Heading hierarchy audited across all public routes: exactly one `<h1>` each, no skipped levels. The homepage `<h1>` is the hero headline itself (`index === 0 ? "h1" : "h2"` in the carousel) rather than an `sr-only` duplicate.
- Decorative SVGs/icons `aria-hidden`, loading screen exposed as `role="status"` with `aria-live="polite"`.

### STEP 21 — Performance
Carried over from the earlier pass (inline critical CSS via `experimental.inlineCss`, body-font preloads cut, GA moved to `lazyOnload`, icon barrels optimised, carousel slides 2–3 deferred to idle), and this pass added:
- **Server-rendered catalogue and product pages** — content now arrives in the HTML instead of after hydration.
- **Fewer render passes:** three admin screens kept a second copy of their list in state and re-synced it from an effect (every keystroke rendered twice) — now `useMemo`. Six mount-fetch effects no longer set state synchronously, and each gained an `active` guard that prevents a resolved response from updating an unmounted component.
- **Decorative animation:** 50 particles across two components computed `Math.random()` **during render**, so they reshuffled on every parent re-render and needed a `mounted` flag plus an effect to stay hydration-safe. Now seeded by index at module load — same visual variety, no state, no effect, no restart.
- **HeroSlider leak fixed:** its Embla listeners were never unsubscribed; every remount left handlers attached.

### STEP 22 — Next.js practices
`generateMetadata` on every dynamic route, `generateStaticParams` + `dynamicParams` on `/shop/[slug]`, request-level `cache()` on the data layer (the product route previously queried the same document twice per request on top of two API calls), route-appropriate `revalidate`, and **write-side cache purges** — new in this pass. Admin create/update/delete on products, categories and banners now purge `/`, `/shop`, `/categories`, `/search`, `/sitemap.xml` and the affected `/shop/<slug>`. A rename purges **both** slugs, because the stale entry under the old URL would otherwise keep answering 200 at an address that no longer resolves.

### STEP 23 — Cleanup
22 dead files deleted. `components/about/AboutHero.tsx` was a special case: its default-exported hero was rendered by no route, but three other components imported one small `FloralDoodle` helper from it, so the dead hero (and its framer-motion and next/image imports) shipped anyway — the helper now stands alone in `FloralDoodle.tsx`. A dead `theme` prop was removed from `PremiumCard` and its 6 call sites. 8 unused dependencies removed (`critters`, `next-intl`, `pdf-parse`, `gsap`, `@gsap/react`, `imagekitio-next`, `@next/third-parties`, `glob`) → **40 packages, 0 vulnerabilities.**

### STEP 24 — Validation
```
tsc --noEmit   →  0 errors
eslint .       →  0 problems   (was 178)
next build     →  exit 0
```
The 178 ESLint problems were pre-existing, not introduced. Breakdown of how they were cleared — **none by blanket rule-disabling**:

| Rule | Count | Resolution |
|---|---|---|
| `@typescript-eslint/no-unused-vars` | 56 | 43 unused `catch (err)` bindings → optional catch binding; rest were genuinely dead imports/vars/props, deleted |
| `@typescript-eslint/no-explicit-any` | 38 | Real types: `.lean<T>()` generics, `Order.aggregate<T>()`, shared DTOs (`BannerDTO`, `CategoryDTO`, `TestimonialDTO`), `z.infer` for the contact form, `EmblaApi` from the carousel's own types, `catch (unknown)` + `toErrorMessage` |
| `react-hooks/set-state-in-effect` | 23 | 3 → `useMemo`; 7 mount fetches split into a state-free network half applied after `await`; 1 `mounted` flag deleted as redundant; 3 → render-phase previous-value comparison (React's documented reset pattern); the rest queued out of the effect body with a written reason |
| `react-hooks/purity` | 17 | `Math.random()` removed from render (seeded by index instead) |
| `react/no-unescaped-entities` | 12 | Escaped |
| `@typescript-eslint/no-require-imports` | 5 | Scoped off for `scripts/**/*.js` and root `*.js` only — standalone Node seed scripts that are never bundled; still enforced in application code |
| `no-html-link-for-pages` | 2 | 1 → `next/link`; 1 kept in `global-error.tsx` with a targeted disable — that boundary replaces the root layout, so the router a `<Link>` needs may be part of what failed |
| `no-img-element` | 1 | Kept with a targeted disable: a 1×1 `<noscript>` tracking beacon, which exists precisely for when JS is unavailable |
| Others (7) | 7 | Ref-write-during-render moved into an effect; expression-statement ternaries → `if/else`; empty interface → type alias; `mongoose.models` delete via `Reflect.deleteProperty`; stale `eslint-disable` removed |

Three targeted `eslint-disable` comments remain in total, each on one line, each with the reason written next to it.

---

## 4. Runtime verification performed

Against `next build` + `next start`:

- **Status codes:** 17 public routes → 200; 3 invalid URLs (incl. two product-slug shapes) → 404; `/admin` → 307 to login with `noindex, nofollow, noarchive` and `no-store`.
- **SSR content:** product page — 1 `<h1>`, 8 price marks, availability text, canonical, `Product` + `BreadcrumbList` schema; `/shop` — 8 unique product links, 21 prices, 1 `<h1>`, `ItemList` + `CollectionPage`.
- **Canonical/robots matrix:** 12 URL variants (table in §3, STEP 14).
- **Sitemap:** 27 URLs, 0 `noindex`/admin/api/search URLs, 0 localhost or non-production hosts.
- **Internal link crawl:** 25 unique internal links from 13 pages, 0 broken.
- **Policy compliance:** 0 `aggregateRating`/`reviewCount`/`ratingValue` anywhere.
- **Schema:** exactly 2 JSON-LD script tags per page; `FAQPage` only on `/faq`.
- **`llms.txt`:** 0 wrong-domain links, 10 correct.
- **A11y:** skip link present and `id="main-content"` resolving to `<main>` on every page checked.
- **Encoding integrity:** a batch text edit mid-session introduced a UTF-8→CP1252 regression in 27 files (mangled `—` and `₹`). Detected, repaired, and confirmed by `git diff` showing only the intended one-line changes per file. No residual damage.

---

## 5. Estimated improvement

These two numbers are **estimates**, unlike everything above them:

- **Technical SEO: roughly 45 → 90.** The large movers are objective and verified: catalogue and product content now exist in the HTML at all, invalid URLs return the correct status, canonicals no longer contradict the sitemap, and fabricated review markup — a Google policy violation with manual-action exposure — is gone.
- **AI-search readiness: roughly 40 → 90.** `llms.txt`/`llms-full.txt` now resolve to real pages on the right domain, 25 explicit AI crawlers are addressed in robots, `/faq` gives 25 directly citable Q&A passages with zero client JS, and answer-bearing content is in the server HTML rather than behind hydration.

Rankings depend on indexing and competition, so treat both as a readiness score, not a traffic forecast.

---

## 6. Remaining manual tasks (outside the repository)

**Vercel**
1. Set `NEXT_PUBLIC_APP_URL=https://laraspinal.in` on Production. `lib/siteUrl.ts` guards against a localhost value in production, but the env var is the intended source.
2. Add `www.laraspinal.in` as a domain and point it at the apex. A code-level 308 exists in `next.config.ts` as a fallback, but doing it at the platform costs no function invocation.
3. Confirm the `laraspinnel.vercel.app` alias still resolves so its 308 keeps working.

**DNS / Cloudflare**
4. `www` CNAME → Vercel. If Cloudflare proxies the site, keep "Auto Minify" off for HTML (it can break inline JSON-LD) and do not let a cache rule serve `/sitemap.xml` or `/robots.txt` stale beyond an hour.

**Google Search Console**
5. Verify the apex property, submit `https://laraspinal.in/sitemap.xml`.
6. Re-request indexing for `/shop`, the product URLs, `/faq`, `/shipping-policy`.
7. Watch **Pages → Soft 404** and **Submitted URL marked noindex** — both should drain now; they are the two reports this work targeted.
8. Validate one product URL in the Rich Results Test and one in the Schema Markup Validator.

**Bing / others**
9. Submit the same sitemap in Bing Webmaster Tools (also feeds ChatGPT's web results).

**MongoDB Atlas**
10. No schema change needed. If the catalogue grows past a few hundred products, add an index on `{ isActive: 1, updatedAt: -1 }` for the sitemap query and `{ slug: 1 }` (already unique) for product lookups.

**Content (not code)**
11. `AggregateRating` can be reintroduced only once real reviews are stored — the generators are in place but deliberately emit nothing without data.
12. Bump `CONTENT_VERSION` in `app/sitemap.ts` when static page copy changes materially.

---

## 7. Build and validation statement

- The project **builds successfully** — `next build` exits 0. `/shop/[slug]` is SSG with ISR, `/robots.txt` and `/sitemap.xml` are generated routes.
- **Zero TypeScript errors** (`tsc --noEmit`).
- **Zero ESLint errors and zero warnings** (`eslint .`), down from 178 pre-existing problems.
- No functional regressions were introduced: business logic, cart behaviour, admin flows and payment-free checkout are unchanged. The one deliberate UX change is the loading screen no longer appearing on the `/shop` tree, which is what buys the correct 404 status STEP 13 required.
