# Lara's Pinnal — Handmade Crochet Gift Store

E-commerce storefront and admin CMS for [Lara's Pinnal](https://laraspinnel.vercel.app), a handmade crochet gift studio in Villupuram, Tamil Nadu. Sells crochet flower bouquets, amigurumi plushies, custom frames, keychains, and gift hampers — every product made to order and shipped across India.

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19, TypeScript)
- **Styling:** Tailwind CSS v4
- **Database:** MongoDB (Mongoose)
- **Auth:** NextAuth v4 (credentials, admin panel only)
- **Media:** ImageKit CDN (uploads + transformations)
- **Email:** Nodemailer (SMTP) / Resend
- **Rate limiting:** Upstash Redis
- **UI extras:** Framer Motion, GSAP, Embla Carousel, Tiptap (rich-text editor), SWR, React Hook Form + Zod

## Features

### Storefront
- Product catalog with categories, search, and filters (`/shop`, `/categories`)
- Cart and checkout with order placement (no payment gateway — orders confirmed by phone/WhatsApp)
- Custom order request flow (`/custom-order`)
- Order tracking by order ID (`/track-order`)
- About, contact, and policy pages (privacy, terms, refund, editorial)
- SEO: sitemap, robots, JSON-LD structured data, `llms.txt` for AI crawlers, PWA manifest
- Optional Google Analytics 4 and Meta Pixel (rendered only when env vars are set)

### Admin panel (`/admin`)
- Dashboard with sales analytics and top-selling products
- Products, categories, and inventory management
- Orders management with status updates and email/WhatsApp templates
- Homepage banners, testimonials, and content editor (CMS for site copy)
- Contact message inbox
- Site settings: branding, contact info, social links, SEO title/description

## Getting Started

### Prerequisites
- Node.js 20+
- MongoDB instance (local or Atlas)
- ImageKit account (media)
- SMTP credentials (order/contact emails)

### Setup

```bash
npm install
# create .env — see Environment Variables below
npm run dev
```

Open http://localhost:3000. Admin panel at http://localhost:3000/admin.

### Environment Variables

Create `.env` (git-ignored — never commit it):

| Variable | Purpose |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `NEXTAUTH_URL` | Base URL for NextAuth (e.g. `http://localhost:3000`) |
| `NEXTAUTH_SECRET` | Session secret (`openssl rand -hex 32`) |
| `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` | Bootstrap admin credentials for `npm run admin:create` |
| `ALLOW_ADMIN_BOOTSTRAP` | Must be set to allow admin creation script |
| `NEXT_PUBLIC_APP_URL` | Canonical public site URL (sitemap/OG/schema follow this) |
| `NEXT_PUBLIC_SITE_URL` | Legacy fallback for the above |
| `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` / `IMAGEKIT_URL_ENDPOINT` | ImageKit server-side config |
| `NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY` / `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT` | ImageKit client-side config |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `EMAIL_FROM` | Outgoing email |
| `ADMIN_EMAIL` / `ADMIN_NOTIFICATION_EMAIL` | Where order/contact notifications go |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Rate limiting (optional in dev) |
| `NEXT_PUBLIC_GA_ID` | Google Analytics 4 ID (optional) |
| `NEXT_PUBLIC_FB_PIXEL_ID` | Meta Pixel ID (optional) |

### Create the admin user

```bash
npm run admin:create   # uses SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
npm run admin:verify   # sanity-check login flow
```

### Seed data (optional)

```bash
node seed-content.js            # default site copy (SiteSettings)
node seed-testimonials.js       # sample testimonials
npx tsx scripts/seed-banners.ts # homepage hero banners
node scripts/seed-commerce.js   # categories + products (clears existing!)
```

All seed scripts read `MONGODB_URI` from the environment.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |
| `npm run admin:create` | Create/bootstrap admin user |
| `npm run admin:verify` | Simulate admin auth |

## Project Structure

```
app/                 # Next.js App Router routes
  admin/             # Admin panel (auth-protected)
  api/               # API routes (products, orders, upload, ...)
  shop/              # Catalog + product detail pages
  ...                # cart, checkout, about, contact, policies, etc.
components/          # UI components (home, about, admin, catalog, layout, shared)
lib/                 # DB, auth, email, security, validation, site content defaults
models/              # Mongoose models (Product, Order, Category, Banner, ...)
scripts/             # Admin bootstrap + seeders
public/              # Static assets, robots.txt, llms.txt
```

## Deployment

Deployed on Vercel. Set all env vars in Project → Settings → Environment Variables, especially `NEXT_PUBLIC_APP_URL` — canonical URLs, sitemap, OG tags, and JSON-LD all derive from it via `lib/siteUrl.ts`. After connecting a custom domain, update `NEXT_PUBLIC_APP_URL` and redeploy; no code change needed.

More detail (audit history, agent rules): see [DOCUMENTATION.md](DOCUMENTATION.md).
