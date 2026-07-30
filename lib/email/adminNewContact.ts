import { renderEmailShell, sectionHeading, EMAIL_COLORS } from "@/lib/email/layout";
import { escapeHtml, safeUrl } from "@/lib/security/url";
import { SITE_URL } from "@/lib/siteUrl";

interface NewContactMessage {
  name: string;
  email?: string;
  phone: string;
  subject: string;
  message: string;
}

function detailRow(label: string, valueHtml: string): string {
  return `
    <tr>
      <td style="padding: 6px 0; color: ${EMAIL_COLORS.gray}; font-size: 13px; width: 35%; vertical-align: top;">${escapeHtml(label)}</td>
      <td style="padding: 6px 0; font-weight: bold; color: ${EMAIL_COLORS.ink}; font-size: 13px;">${valueHtml}</td>
    </tr>`;
}

// Internal ops notification to the shop owner when a new contact message
// comes in — a fixed system alert, not customer-facing brand copy, so it's
// not part of the admin-editable template settings (unlike the customer
// confirmation email in customerContactConfirmation.ts).
//
// SECURITY: every field here is attacker-controlled — it comes from the public
// contact form, and from the public custom-order form, which routes its entire
// composed request through `message`. The values were previously interpolated
// raw into the HTML, including inside `href="mailto:${email}"` and
// `href="tel:${phone}"`. A crafted submission could therefore inject arbitrary
// markup and links into the shop owner's inbox — a clean phishing primitive
// aimed at the one account that can administer the store. All values are now
// HTML-escaped, and the mailto/tel targets are scheme-validated before being
// placed in an attribute.
export function getAdminNewContactEmailHtml(message: NewContactMessage): string {
  const emailHref = message.email ? safeUrl(`mailto:${message.email.trim()}`, "") : "";
  const phoneDigits = String(message.phone ?? "").replace(/[^\d+]/g, "");
  const phoneHref = phoneDigits ? safeUrl(`tel:${phoneDigits}`, "") : "";

  const bodyHtml = `
    <p style="margin: 0; font-size: 14px;">A new message was submitted via the contact form on the website.</p>

    ${sectionHeading("Sender Details")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
      ${detailRow("Name:", escapeHtml(message.name))}
      ${
        message.email
          ? detailRow(
              "Email:",
              emailHref
                ? `<a href="${escapeHtml(emailHref)}" style="color: ${EMAIL_COLORS.sage}; text-decoration: none;">${escapeHtml(message.email)}</a>`
                : escapeHtml(message.email)
            )
          : ""
      }
      ${detailRow(
        "Phone:",
        phoneHref
          ? `<a href="${escapeHtml(phoneHref)}" style="color: ${EMAIL_COLORS.sage}; text-decoration: none;">${escapeHtml(message.phone)}</a>`
          : escapeHtml(message.phone)
      )}
      ${detailRow("Subject:", escapeHtml(message.subject))}
    </table>

    ${sectionHeading("Message")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0;">
      <tr>
        <td style="background-color: ${EMAIL_COLORS.cream}; border: 1px solid ${EMAIL_COLORS.border}; padding: 16px; border-radius: 10px; font-size: 14px; white-space: pre-wrap; color: ${EMAIL_COLORS.ink};">${escapeHtml(message.message)}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
      <tr>
        <td align="center">
          <a href="${escapeHtml(SITE_URL)}/admin/messages" style="background-color: ${EMAIL_COLORS.terracotta}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 14px; display: inline-block;">View in Admin Panel</a>
        </td>
      </tr>
    </table>
  `;

  return renderEmailShell({
    title: "New Contact Message",
    bannerText: "New Contact Message",
    shopName: "Laraspinnel",
    bodyHtml,
    variant: "admin",
  });
}
