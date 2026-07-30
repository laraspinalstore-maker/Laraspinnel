// Shared visual shell for every outgoing email — customer-facing and
// admin notifications alike — so all mail renders as one brand system.
// Layout is table-based with inline styles only (no flexbox, no external
// CSS) so it survives Outlook, Gmail and other strict email clients.
// Colors mirror the site tokens in app/globals.css.
//
// SECURITY: title/bannerText/shopName reach HTML sinks here. shopName comes from
// admin-editable settings, so they are escaped. `bodyHtml` is trusted by
// contract — every caller must escape its own values before passing them in.

import { escapeHtml } from "@/lib/security/url";
import { SITE_URL } from "@/lib/siteUrl";

export const EMAIL_COLORS = {
  cream: "#FDF8F0", // page canvas (matches --color-cream-bg)
  ink: "#2B2420", // primary text (matches --color-brand-black)
  gray: "#6B7280",
  border: "#E8E1D8",
  sage: "#5F7359", // primary (WCAG-safe sage)
  sageTint: "#EEF3EC",
  sageText: "#56695A",
  terracotta: "#C1622D", // CTA / highlight
  gold: "#C9A15A", // stitch borders, dividers
  goldText: "#8C6B32",
  brownTint: "#F1E9DF", // footer band
  brownText: "#4A3320",
} as const;

export const EMAIL_FONTS = {
  display: `Georgia, 'Times New Roman', serif`,
  body: `'Segoe UI', Helvetica, Arial, sans-serif`,
  mono: `'Courier New', Courier, monospace`,
} as const;

interface EmailShellOptions {
  /** Document <title> */
  title: string;
  /** Short uppercase label on the colored band under the masthead */
  bannerText: string;
  /** Band background color — defaults to sage; status emails pass their status color */
  bannerColor?: string;
  /** Shop name shown in the serif masthead and the footer */
  shopName: string;
  /** Inner content HTML (already escaped/safe) */
  bodyHtml: string;
  /** Footer line under the copyright; defaults per variant */
  footerNote?: string;
  /** "admin" swaps the masthead accent to ink + gold for internal alerts */
  variant?: "customer" | "admin";
}

/** The dashed-gold "stitch" card used for order refs, quotes and callouts. */
export function stitchCard(innerHtml: string): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="background-color: ${EMAIL_COLORS.cream}; border: 2px dashed ${EMAIL_COLORS.gold}; border-radius: 12px; padding: 16px; text-align: center;">
          ${innerHtml}
        </td>
      </tr>
    </table>`;
}

/**
 * Table-based pill button. Tables (not a styled <a> alone) because Outlook
 * ignores padding on inline anchors.
 *
 * `href` must already be a trusted, fully-formed URL — it is escaped here for the
 * attribute, but callers must not pass unvalidated user input.
 */
export function ctaButton(href: string, label: string, backgroundColor: string = EMAIL_COLORS.terracotta): string {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 24px 0 8px;">
      <tr>
        <td align="center">
          <a href="${escapeHtml(href)}" style="background-color: ${backgroundColor}; color: #ffffff; padding: 13px 32px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 14px; display: inline-block; font-family: ${EMAIL_FONTS.body};">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`;
}

/**
 * "Track Your Order" call to action for customer order emails.
 *
 * Links to /track-order with the reference prefilled. The tracking page still
 * asks for the customer's phone number before showing anything — that second
 * factor is what stops a forwarded or guessed link exposing someone else's order,
 * so the link deliberately carries the order number only.
 */
export function trackOrderButton(orderNumber: string, label = "Track Your Order"): string {
  const href = `${SITE_URL}/track-order?order=${encodeURIComponent(orderNumber)}`;
  return `
    ${ctaButton(href, label)}
    <p style="margin: 0 0 4px; text-align: center; font-size: 11px; color: ${EMAIL_COLORS.gray};">
      You'll be asked for the mobile number used on the order.
    </p>`;
}

/** Uppercase letterspaced section heading with a hairline underneath. */
export function sectionHeading(text: string): string {
  return `
    <h3 style="font-family: ${EMAIL_FONTS.body}; font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: ${EMAIL_COLORS.brownText}; border-bottom: 1px solid ${EMAIL_COLORS.border}; padding-bottom: 6px; margin: 24px 0 8px; font-weight: bold;">
      ${escapeHtml(text)}
    </h3>`;
}

export function renderEmailShell({
  title,
  bannerText,
  bannerColor,
  shopName,
  bodyHtml,
  footerNote,
  variant = "customer",
}: EmailShellOptions): string {
  const isAdmin = variant === "admin";
  const band = bannerColor || (isAdmin ? EMAIL_COLORS.ink : EMAIL_COLORS.sage);
  const bandText = isAdmin ? EMAIL_COLORS.gold : "#ffffff";
  const note =
    footerNote ?? (isAdmin ? "System generated · Admin notification" : "Handmade with care 🌸");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${escapeHtml(title)}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: ${EMAIL_COLORS.cream}; font-family: ${EMAIL_FONTS.body}; color: ${EMAIL_COLORS.ink}; line-height: 1.6;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${EMAIL_COLORS.cream};">
        <tr>
          <td align="center" style="padding: 32px 16px;">
            <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 16px; overflow: hidden;">

              <!-- Masthead -->
              <tr>
                <td style="padding: 28px 24px 18px; text-align: center;">
                  <div style="font-family: ${EMAIL_FONTS.display}; font-size: 24px; letter-spacing: 0.5px; color: ${EMAIL_COLORS.ink};">${escapeHtml(shopName)}</div>
                  <div style="font-size: 13px; color: ${EMAIL_COLORS.gold}; letter-spacing: 6px; margin-top: 6px;">&middot;&nbsp;&#10048;&nbsp;&middot;</div>
                </td>
              </tr>

              <!-- Title band -->
              <tr>
                <td style="background-color: ${band}; padding: 12px 24px; text-align: center;">
                  <span style="color: ${bandText}; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 3px;">${escapeHtml(bannerText)}</span>
                </td>
              </tr>

              <!-- Body -->
              <tr>
                <td style="padding: 28px 28px 32px;">
                  ${bodyHtml}
                </td>
              </tr>

              <!-- Footer -->
              <tr>
                <td style="background-color: ${EMAIL_COLORS.brownTint}; padding: 18px 24px; text-align: center;">
                  <p style="margin: 0; font-size: 12px; color: ${EMAIL_COLORS.brownText};">${escapeHtml(shopName)} &copy; ${new Date().getFullYear()}</p>
                  <p style="margin: 4px 0 0; font-size: 11px; color: ${EMAIL_COLORS.brownText};">${escapeHtml(note)}</p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}
