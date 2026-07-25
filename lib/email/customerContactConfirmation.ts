import {
  DEFAULT_CONTACT_CONFIRMATION_SUBJECT_TEMPLATE,
  DEFAULT_CONTACT_CONFIRMATION_INTRO_TEMPLATE,
  DEFAULT_CONTACT_CONFIRMATION_FOOTER_TEMPLATE,
  renderEmailText,
} from "@/lib/emailTemplate";
import { renderEmailShell, EMAIL_COLORS } from "@/lib/email/layout";

interface ContactMessageInput {
  name: string;
  subject: string;
  message: string;
}

interface GetContactConfirmationEmailOptions {
  shopName: string;
  subjectTemplate?: string;
  introTemplate?: string;
  footerTemplate?: string;
}

// Renders the "we received your message" email sent back to whoever submits
// the public contact form — same admin-editable-text pattern as the order
// emails: fixed layout, editable subject/intro/footer.
export function getContactConfirmationEmail(
  contact: ContactMessageInput,
  { shopName, subjectTemplate, introTemplate, footerTemplate }: GetContactConfirmationEmailOptions
): { subject: string; html: string } {
  const data = {
    customerName: contact.name,
    shopName,
    messageSubject: contact.subject,
  };

  const subject = renderEmailText(subjectTemplate || DEFAULT_CONTACT_CONFIRMATION_SUBJECT_TEMPLATE, data);
  const intro = renderEmailText(introTemplate || DEFAULT_CONTACT_CONFIRMATION_INTRO_TEMPLATE, data);
  const footer = renderEmailText(footerTemplate || DEFAULT_CONTACT_CONFIRMATION_FOOTER_TEMPLATE, data);

  const bodyHtml = `
    <p style="white-space: pre-line; margin: 0 0 4px; font-size: 14px;">${intro}</p>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 20px 0;">
      <tr>
        <td style="background-color: ${EMAIL_COLORS.sageTint}; border-left: 4px solid ${EMAIL_COLORS.sage}; border-radius: 6px; padding: 14px 16px;">
          <p style="margin: 0 0 4px; font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: ${EMAIL_COLORS.sageText}; font-weight: bold;">Your Message &mdash; ${contact.subject}</p>
          <p style="margin: 0; font-size: 13px; color: ${EMAIL_COLORS.ink}; white-space: pre-wrap;">${contact.message}</p>
        </td>
      </tr>
    </table>

    <p style="white-space: pre-line; font-size: 13px; color: ${EMAIL_COLORS.brownText}; margin: 24px 0 0; padding-top: 16px; border-top: 1px solid ${EMAIL_COLORS.border};">${footer}</p>
  `;

  const html = renderEmailShell({
    title: subject,
    bannerText: "Message Received",
    shopName,
    bodyHtml,
  });

  return { subject, html };
}
