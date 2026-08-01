import type { Metadata, Viewport } from "next";
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

import JsonLd from "@/lib/seo/JsonLd";
import { buildRootMetadata } from "@/lib/seo/metadata";
import { localBusinessNode, logoNode, webSiteNode } from "@/lib/seo/schema";
import { getSeoSettings } from "@/lib/seo/settings";

/**
 * Title, description and favicon come from admin-editable settings.
 *
 * `getSeoSettings` is request-cached, so the RootLayout body below reuses this
 * exact result for the LocalBusiness node instead of issuing a second query.
 */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSeoSettings();
  return buildRootMetadata({
    title: settings.title,
    description: settings.description,
    faviconUrl: settings.faviconUrl,
    addressLocality: settings.address.addressLocality,
  });
}

import { Providers } from "@/components/Providers";
import FloatingCartBar from "@/components/layout/FloatingCartBar";
import Script from "next/script";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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

  // One request-cached settings read, shared with generateMetadata above.
  const settings = await getSeoSettings();

  // Three nodes, site-wide. Everything page-specific (breadcrumbs, WebPage,
  // CollectionPage, Product, FAQPage) is emitted by the page that owns it —
  // this layout used to ship a static Home > Shop > Categories breadcrumb and a
  // FAQPage with invisible answers on every single route.
  const graph = [
    localBusinessNode({
      farmName: settings.farmName,
      phone: settings.phone,
      email: settings.email,
      address: settings.address,
      socialLinks: settings.socialLinks,
    }),
    logoNode(),
    webSiteNode(settings.farmName),
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
        {/* The skip link targets each page's <main>, not this wrapper. The id
            used to live here, above the Navbar, so activating "Skip to main
            content" moved focus to the top of the page and skipped nothing —
            the navigation it exists to bypass was still ahead of the user. */}
        <div className="flex flex-col min-h-screen w-full relative">
          <Providers>
            {children}
            <FloatingCartBar />
          </Providers>
        </div>
        <JsonLd graph={graph} />
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
              {/* A 1x1 tracking beacon inside <noscript>, not content. next/image
                  renders a client component and would be useless here: the whole
                  point of this element is to fire when JavaScript is unavailable. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
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
