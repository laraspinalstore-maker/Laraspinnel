import { renderEmailShell, sectionHeading, EMAIL_COLORS } from "@/lib/email/layout";

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
      <td style="padding: 6px 0; color: ${EMAIL_COLORS.gray}; font-size: 13px; width: 35%; vertical-align: top;">${label}</td>
      <td style="padding: 6px 0; font-weight: bold; color: ${EMAIL_COLORS.ink}; font-size: 13px;">${valueHtml}</td>
    </tr>`;
}

// Internal ops notification to the shop owner when a new contact message
// comes in — a fixed system alert, not customer-facing brand copy, so it's
// not part of the admin-editable template settings (unlike the customer
// confirmation email in customerContactConfirmation.ts).
export function getAdminNewContactEmailHtml(message: NewContactMessage): string {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://laraspinnal.com";

  const bodyHtml = `
    <p style="margin: 0; font-size: 14px;">A new message was submitted via the contact form on the website.</p>

    ${sectionHeading("Sender Details")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 8px;">
      ${detailRow("Name:", message.name)}
      ${message.email ? detailRow("Email:", `<a href="mailto:${message.email}" style="color: ${EMAIL_COLORS.sage}; text-decoration: none;">${message.email}</a>`) : ""}
      ${detailRow("Phone:", `<a href="tel:${message.phone}" style="color: ${EMAIL_COLORS.sage}; text-decoration: none;">${message.phone}</a>`)}
      ${detailRow("Subject:", message.subject)}
    </table>

    ${sectionHeading("Message")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 12px 0;">
      <tr>
        <td style="background-color: ${EMAIL_COLORS.cream}; border: 1px solid ${EMAIL_COLORS.border}; padding: 16px; border-radius: 10px; font-size: 14px; white-space: pre-wrap; color: ${EMAIL_COLORS.ink};">${message.message}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 28px;">
      <tr>
        <td align="center">
          <a href="${siteUrl}/admin/messages" style="background-color: ${EMAIL_COLORS.terracotta}; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 9999px; font-weight: bold; font-size: 14px; display: inline-block;">View in Admin Panel</a>
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
