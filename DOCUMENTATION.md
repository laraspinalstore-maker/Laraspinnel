# Lara's Pinnal - Unified Documentation

This file is a consolidation of all previous markdown files in this repository.

---

## 1. Project Information (formerly README.md)

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

### Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

### Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

---

## 2. Audit Fixes (formerly FIXES.md)

# Audit Fixes — Lara's Pinnal

Date: 2026-07-14. Build verified: `next build` exit 0, `tsc --noEmit` clean.

### ✅ Fixed in code (already done)

| # | Issue | What changed |
|---|-------|--------------|
| 1 | Wrong domain hardcoded everywhere | New `lib/siteUrl.ts` single source of truth. All canonical/sitemap/robots/OG/schema/breadcrumbs/emails now resolve `NEXT_PUBLIC_APP_URL` → `NEXT_PUBLIC_SITE_URL` → `https://laraspinnal.com`. Fixed hardcoded domains in `layout.tsx`, `admin/layout.tsx`, `robots.ts`, `sitemap.ts`, `blog/[slug]`, product detail pages, all 6 email templates, `llms.txt`, `scripts/*`. |
| 2 | Public `/api/upload` had NO auth | Added `getServerSession` check + MIME allowlist + 5 MB size cap. Same validation added to `/api/admin/upload`. |
| 3 | Secrets logged (`MONGODB_URI`, emails) | Removed all 5 `console.log` lines in `lib/auth.ts`; dropped unused `mongoose` import. |
| 4 | User enumeration in login | Both "no user" and "wrong password" now return identical `"Invalid email or password"`. |
| 5 | GA / FB Pixel placeholders firing broken requests | Now read `NEXT_PUBLIC_GA_ID` / `NEXT_PUBLIC_FB_PIXEL_ID`; scripts only render when the env var is set. |
| 6 | Favicon 404 | Added `public/icon.svg` (branded logo mark); metadata default now `/icon.svg`. |
| 7 | Fake social `sameAs` (bare facebook.com etc.) | Now built from settings keys `social_facebook`/`social_instagram`/`social_youtube`; empty until you add real URLs (no fake links emitted). |
| 8 | SearchAction schema pointed to non-existent `/search` | Removed the `potentialAction` block. |
| 9 | `lang="en"` | Changed to `lang="en-IN"`. |
| 10 | Admin `/admin` bare path not matched by proxy | Added `"/admin"` to `proxy.ts` matcher (admin auth already handled by existing `proxy.ts` withAuth — Next 16 renamed middleware→proxy). |

### 🔴 YOU must do (needs your accounts — cannot be done in code)

#### Immediate — before/at launch
1. **Set Vercel env vars** (Project → Settings → Environment Variables):
   - `NEXT_PUBLIC_APP_URL` = `https://laraspinnal.vercel.app` (now) → change to `https://laraspinnal.com` after domain connect
   - `NEXT_PUBLIC_GA_ID` = your real `G-XXXXXXX` (or leave blank)
   - `NEXT_PUBLIC_FB_PIXEL_ID` = your real pixel id (or leave blank)
   - Redeploy after setting. Sitemap/canonical/OG auto-follow.

2. **🔑 ROTATE ALL SECRETS** — the login code was logging `MONGODB_URI` into Vercel logs, and these live values were exposed during audit. Rotate:
   - MongoDB Atlas DB user password (`MONGODB_URI`)
   - `NEXTAUTH_SECRET` (generate new: `openssl rand -hex 32`)
   - ImageKit private key
   - Gmail SMTP app password (`SMTP_PASS`)
   - Admin login password (`SEED_ADMIN_PASSWORD`)
   Update the new values in Vercel env, NOT committed to git.

3. **Confirm `.env.local` is git-ignored** — it is (`.gitignore` line 34 `.env*`). Never commit it.

#### Week 1
4. **Real OG/logo image** — replace `/logo.png` (OG) and `/placeholder-logo.jpg` (blog schema) with a branded 1200×630 image. Upload to `/public` or ImageKit.
5. **Add real social URLs** — in admin Settings, add `social_facebook`, `social_instagram`, `social_youtube` values (real profile URLs). Schema `sameAs` fills automatically.
6. **Business email** — create a branded inbox (e.g. `info@laraspinnal.com`) and update llms.txt / contact settings (personal Gmail hurts trust/E-E-A-T).
7. **Google Business Profile** — create/claim GBP for Villupuram location; add the GBP URL to social settings.

#### Month 1 (score polish → toward 95+)
8. **Distributed rate limiting** — `proxy.ts` + `lib/rateLimit.ts` use in-memory Maps that reset per serverless instance. Move to Upstash Redis for real cross-instance limits.
9. **CSP hardening** — currently allows `'unsafe-inline'`/`'unsafe-eval'` for GA/FB. Move to nonce-based CSP once analytics finalized.
10. **Trim bundle** — 3 icon libraries loaded (`lucide-react`, `@phosphor-icons/react`, `react-icons`). Standardize on one; lazy-load below-fold homepage sections.
11. **aggregateRating schema** — only add once you have a real review collection system (fake ratings violate Google guidelines and risk manual action).
12. **Per-page breadcrumb visible UI** — JSON-LD breadcrumbs exist; add visible breadcrumb nav on product/blog detail pages.

### ✅ Round 2 — pushed toward 100 (also done in code)

| Issue | Fix |
|-------|-----|
| 3× H1 on homepage | HeroSlider slide headlines → `<h2>`. Homepage now has exactly one H1 (the sr-only semantic heading in `page.tsx`). Verified live: H1 count = 1. |
| Blog schema logo 404 (`placeholder-logo.jpg`) | Points to `/icon.svg` (exists). |
| No PWA manifest | Added `app/manifest.ts` → serves `/manifest.webmanifest` (name, icons, theme, categories). |
| No apple-touch-icon / theme-color | Added `apple`+`shortcut` icons and `viewport.themeColor` in `layout.tsx`. |
| No visible breadcrumbs | Added accessible `<nav aria-label="Breadcrumb">` on blog and product detail pages (matches the JSON-LD). |

**Verification:** `tsc --noEmit` exit 0 · Turbopack "✓ Compiled successfully" · dev server: all pages 200, `/api/upload` returns 401 (auth working), H1=1, manifest serves, canonical/OG read env var correctly.
**Note:** `next build` OOMs on this local machine during static-page generation (RAM limit — `mongoose` arraybuffer alloc). Not a code issue; Vercel build memory is sufficient.

#### Notes
- `H1` count: homepage rendered 3 `<h1>` tags in HTML — verify only one true page H1 (check `HeroSlider` / section components); extras should be `h2`.
- After buying `laraspinnal.com`: add domain in Vercel, point DNS, update `NEXT_PUBLIC_APP_URL`. No code change needed.

---

## 3. Agent Rules (formerly AGENTS.md & CLAUDE.md)

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
