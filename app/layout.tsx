import type { Metadata, Viewport } from "next";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { Baloo_Da_2, Poppins } from "next/font/google";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#1a1a1a",
  width: "device-width",
  initialScale: 1,
};

const balooDa2 = Baloo_Da_2({
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  preload: true,
  adjustFontFallback: true,
});

const poppins = Poppins({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  // Not preloaded: 4 body-font preloads were competing with the hero LCP image
  // for bandwidth during the critical window. swap keeps text visible while
  // the font loads normally via CSS.
  preload: false,
  adjustFontFallback: true,
});

import { connectToDatabase } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";

import { SITE_URL } from "@/lib/siteUrl";
import { CONTENT_DEFAULTS } from "@/lib/siteContent";
const BASE_URL = SITE_URL;

// Favicons never pass through /_next/image, so an ImageKit-hosted icon URL
// would otherwise be fetched at its full upload size on every page load (the
// admin-configured favicon was a 2K ~147KB JPEG — the single heaviest resource
// on the page). For ImageKit URLs, request the icon at its display size via
// ImageKit's own transform params; any other host is returned untouched.
function iconAtSize(url: string, size: number): string {
  try {
    const u = new URL(url, BASE_URL);
    if (u.hostname === "ik.imagekit.io") {
      u.searchParams.set("tr", `w-${size},h-${size},f-png`);
      return u.toString();
    }
  } catch {
    // Relative or malformed value — leave as-is.
  }
  return url;
}

export async function generateMetadata(): Promise<Metadata> {
  let title = "Lara's Pinnal | Handmade Crochet Gifts & Flowers in Tamil Nadu";
  let description =
    "Shop handmade crochet gifts from Lara's Pinnal, Tamil Nadu. Crochet flower bouquets, amigurumi plushies, custom frames, keychains & gift hampers shipped across India.";
  let favicon = "/logo.png";

  try {
    await connectToDatabase();
    const settings = await SiteSettings.find({
      key: { $in: ["seo_title", "seo_description", "favicon_url", "logo_url"] },
    });

    const getSetting = (k: string) => settings.find((s) => s.key === k)?.value;

    title = getSetting("seo_title") || title;
    description = getSetting("seo_description") || description;
    favicon = getSetting("favicon_url") || getSetting("logo_url") || favicon;
  } catch (error) {
    console.error("Error loading site settings for metadata:", error);
  }

  return {
    title,
    description,
    keywords: [
      "handmade crochet gifts Tamil Nadu",
      "crochet flower bouquet",
      "crochet flowers online India",
      "amigurumi plush toys India",
      "custom crochet frames",
      "crochet keychains online",
      "crochet baby gifts",
      "crochet gift hampers",
      "milk cotton yarn crochet",
      "handmade crochet gifts online India",
      "Lara's Pinnal",
    ],
    authors: [{ name: "Lara's Pinnal", url: BASE_URL }],
    creator: "Lara's Pinnal",
    metadataBase: new URL(BASE_URL),
    // No `alternates` here: a canonical set in the root layout is inherited by
    // every page that doesn't override it, which pointed the whole site's
    // canonical at the homepage. Each page declares its own canonical.
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: BASE_URL,
      siteName: "Lara's Pinnal",
      title,
      description,
      images: [
        {
          url: "/logo.png",
          width: 1200,
          height: 630,
          alt: "Lara's Pinnal Handmade Crochet Bouquet",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    icons: {
      icon: iconAtSize(favicon, 64),
      apple: iconAtSize(favicon, 180),
      shortcut: iconAtSize(favicon, 64),
    },
    other: {
      "geo.region": "IN-TN",
      "geo.placename": "Villupuram",
      "geo.position": "11.9401;79.4861",
      ICBM: "11.9401, 79.4861",
    },
  };
}

import { Providers } from "@/components/Providers";
import FloatingCartBar from "@/components/layout/FloatingCartBar";
import Script from "next/script";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let farmName = "Lara's Pinnal";
  let phone = "+91 9442379832";
  let email = "senthilraguanthan2004@gmail.com";
  let address = " MettuStreet, Therkunam, Villupuram, Tamil Nadu - 604102";
  let socialLinks: string[] = [CONTENT_DEFAULTS.social_instagram];

  // Interpolated into an inline <script> below (same treatment as the Pixel
  // ID): constrain to the G-/AW-/GT- measurement-ID shape so the interpolation
  // can never carry markup.
  const rawGaId = process.env.NEXT_PUBLIC_GA_ID?.trim() ?? "";
  const GA_ID = /^(G|AW|GT)-[A-Z0-9]{4,20}$/.test(rawGaId) ? rawGaId : "";

  // Interpolated into an inline <script> and into an <img src> below, so the
  // value is constrained to the digits a real Pixel ID consists of. Env vars are
  // not attacker-controlled today, but this keeps the one remaining inline-script
  // interpolation in the app incapable of carrying markup.
  const rawPixelId = process.env.NEXT_PUBLIC_FB_PIXEL_ID?.trim() ?? "";
  const FB_PIXEL_ID = /^\d{5,25}$/.test(rawPixelId) ? rawPixelId : "";

  try {
    await connectToDatabase();
    const settings = await SiteSettings.find({
      key: { $in: ["farm_name", "contact_phone", "contact_email", "contact_address", "social_facebook", "social_instagram", "social_youtube"] }
    });
    const getSetting = (k: string) => settings.find(s => s.key === k)?.value;
    farmName = getSetting("farm_name") || farmName;
    phone = getSetting("contact_phone") || phone;
    email = getSetting("contact_email") || email;
    address = getSetting("contact_address") || address;
    socialLinks = [
      getSetting("social_facebook"),
      getSetting("social_instagram") || CONTENT_DEFAULTS.social_instagram,
      getSetting("social_youtube"),
    ].filter((v): v is string => Boolean(v));
  } catch (error) {
    console.error("Error loading settings for RootLayout schema:", error);
  }

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      "@id": `${BASE_URL}/#localbusiness`,
      "name": farmName,
      "image": `${BASE_URL}/logo.png`,
      "url": BASE_URL,
      "telephone": phone,
      "email": email,
      "priceRange": "$$",
      "sameAs": socialLinks,
      "address": {
        "@type": "PostalAddress",
        "streetAddress": address.split(",")[0]?.trim() || " MettuStreet",
        "addressLocality": "Villupuram",
        "addressRegion": "Tamil Nadu",
        "postalCode": "604102",
        "addressCountry": "IN"
      },
      "geo": {
        "@type": "GeoCoordinates",
        "latitude": "11.9401",
        "longitude": "79.4861"
      },
      "areaServed": ["Villupuram", "Chennai", "Pondicherry", "Tamil Nadu"],
      "openingHoursSpecification": [
        {
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
          "opens": "06:00",
          "closes": "20:00"
        }
      ],
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": "4.9",
        "reviewCount": "128"
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      "@id": `${BASE_URL}/#organization`,
      "name": farmName,
      "url": BASE_URL,
      "logo": `${BASE_URL}/logo.png`,
      "contactPoint": {
        "@type": "ContactPoint",
        "telephone": phone,
        "contactType": "customer service",
        "areaServed": "IN",
        "availableLanguage": ["English", "Tamil"]
      },
      "sameAs": socialLinks,
      "founder": {
        "@type": "Person",
        "name": "Senthil Ragu",
        "jobTitle": "Lead Artisan & Founder",
        "knowsAbout": ["Crochet", "Amigurumi", "Handicrafts", "Fibre Arts"]
      },
      "knowsAbout": ["Crochet Gifts", "Crochet Flowers", "Amigurumi Plush Toys", "Handmade Handicrafts"]
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${BASE_URL}/#website`,
      "url": BASE_URL,
      "name": farmName,
      "publisher": {
        "@id": `${BASE_URL}/#organization`
      },
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${BASE_URL}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      },
      "dateModified": new Date().toISOString()
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Home",
          "item": BASE_URL
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": "Shop",
          "item": `${BASE_URL}/shop`
        },
        {
          "@type": "ListItem",
          "position": 3,
          "name": "Categories",
          "item": `${BASE_URL}/categories`
        }
      ]
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": [
        {
          "@type": "Question",
          "name": "Do you deliver custom crochet orders?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "Yes, we create custom crochet bouquets, amigurumi plushies, and gift hampers. Reach out to us on WhatsApp to customize."
          }
        },
        {
          "@type": "Question",
          "name": "Where are you located?",
          "acceptedAnswer": {
            "@type": "Answer",
            "text": "We are based in Villupuram, Tamil Nadu, and ship our handmade gifts all across India."
          }
        }
      ]
    }
  ];

  return (
    <html
      lang="en-IN"
      className={`${balooDa2.variable} ${poppins.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://ik.imagekit.io" crossOrigin="anonymous" />
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Resource" />
        <link rel="alternate" type="text/plain" href="/llms-full.txt" title="Comprehensive LLM Resource" />
      </head>
      <body className="min-h-full flex flex-col font-body bg-white text-brand-black" suppressHydrationWarning>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-9999 focus:p-4 focus:bg-brand-black focus:text-white"
        >
          Skip to main content
        </a>
        <div className="flex flex-col min-h-screen w-full relative" id="main-content">
          <Providers>
            {children}
            <FloatingCartBar />
          </Providers>
        </div>
        {jsonLd.map((schema, index) => (
          <script
            key={index}
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
          />
        ))}
        {/* Facebook Pixel — only rendered when NEXT_PUBLIC_FB_PIXEL_ID is set */}
        {FB_PIXEL_ID && (
          <>
            <Script
              id="fb-pixel"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                  !function(f,b,e,v,n,t,s)
                  {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                  n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                  if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                  n.queue=[];t=b.createElement(e);t.async=!0;
                  t.src=v;s=b.getElementsByTagName(e)[0];
                  s.parentNode.insertBefore(t,s)}(window, document,'script',
                  'https://connect.facebook.net/en_US/fbevents.js');
                  fbq('init', '${FB_PIXEL_ID}');
                  fbq('track', 'PageView');
                `,
              }}
            />
            <noscript>
              <img
                height="1"
                width="1"
                style={{ display: "none" }}
                src={`https://www.facebook.com/tr?id=${FB_PIXEL_ID}&ev=PageView&noscript=1`}
                alt="Facebook Pixel"
              />
            </noscript>
          </>
        )}
        {/* Google Analytics — only rendered when NEXT_PUBLIC_GA_ID is set.
            Loaded lazyOnload (after the window load event) instead of
            @next/third-parties' afterInteractive: gtag.js evaluation was
            competing with hydration inside the LCP/INP-critical window on
            mobile. Page-view data is unaffected; only beacon timing shifts. */}
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="lazyOnload"
            />
            <Script
              id="ga-init"
              strategy="lazyOnload"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${GA_ID}');
                `,
              }}
            />
          </>
        )}
      </body>
    </html>
  );
}
