import { renderEmailShell, EMAIL_COLORS } from "@/lib/email/layout";

interface ReplyEmailInput {
  customerName: string;
  replyText: string;
  originalSubject: string;
  originalMessage: string;
}

// Customer-controlled values are interpolated into HTML — escape them so a
// crafted name/subject/message can't inject markup into the email.
// Newlines still render via the pre-wrap styling on the containers.
const esc = (s: string) =>
  String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

// Renders the admin's reply to a contact-form message, sent to the customer.
// Shares the brand shell with the other customer emails; the original
// message is quoted below the reply for context.
export function getCustomerReplyEmail(
  { customerName, replyText, originalSubject, originalMessage }: ReplyEmailInput,
  shopName: string
): { subject: string; html: string } {
  const subject = `Re: ${originalSubject} - ${shopName}`;

  const bodyHtml = `
    <p style="margin: 0 0 4px; font-size: 14px;">Dear ${esc(customerName)},</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 16px 0;">
      <tr>
        <td style="background-color: ${EMAIL_COLORS.sageTint}; border-radius: 10px; padding: 16px; font-size: 14px; color: ${EMAIL_COLORS.ink}; white-space: pre-wrap;">${esc(replyText)}</td>
      </tr>
    </table>

    <p style="margin: 20px 0 8px; font-size: 12px; font-style: italic; color: ${EMAIL_COLORS.gray};">In response to your message:</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="border-left: 4px solid ${EMAIL_COLORS.border}; padding: 4px 0 4px 16px; font-size: 13px; color: ${EMAIL_COLORS.gray};">
          <strong style="color: ${EMAIL_COLORS.ink};">${esc(originalSubject)}</strong><br />
          <span style="white-space: pre-wrap;">${esc(originalMessage)}</span>
        </td>
      </tr>
    </table>

    <p style="font-size: 13px; color: ${EMAIL_COLORS.brownText}; margin: 24px 0 0; padding-top: 16px; border-top: 1px solid ${EMAIL_COLORS.border};">Best regards,<br />${shopName} Team</p>
  `;

  const html = renderEmailShell({
    title: subject,
    bannerText: "Reply to Your Message",
    shopName,
    bodyHtml,
  });

  return { subject, html };
}
