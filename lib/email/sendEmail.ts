import { Resend } from "resend";
import { maskEmail } from "@/lib/security/audit";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

/** Single address, no CR/LF — a newline in a header value is header injection. */
const SAFE_ADDRESS = /^[^\s@,;:<>"\r\n]+@[^\s@,;:<>"\r\n]+\.[^\s@,;:<>"\r\n]+$/;

/** Collapses CR/LF so a crafted value can't append extra headers. */
function sanitizeHeaderValue(value: string): string {
  return String(value ?? "").replace(/[\r\n]+/g, " ").trim();
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  // Fallback must stay on the Resend-verified domain (laraspinal.in) — any
  // other from-domain is rejected with a 403 validation_error.
  const fromEmail = process.env.EMAIL_FROM || "Laraspinnel <no-reply@laraspinal.in>";

  const recipient = String(to ?? "").trim();

  // Recipients reach here from customer-supplied fields (order/contact email).
  // Reject anything that isn't a single plain address, so a value like
  // "a@b.com, victim@x.com" or one carrying a newline can't turn one
  // notification into a relay for someone else's mail.
  if (!SAFE_ADDRESS.test(recipient)) {
    console.error("[sendEmail] Refused to send: invalid recipient address");
    return { success: false, error: "Invalid recipient address" };
  }

  const safeSubject = sanitizeHeaderValue(subject).slice(0, 300);

  if (!process.env.RESEND_API_KEY) {
    // Development fallback. The recipient is masked because this line lands in
    // application logs, which must not become a store of customer addresses.
    console.log("-----------------------------------------");
    console.log(`DEBUG EMAIL LOG (RESEND_API_KEY Missing)`);
    console.log(`TO: ${maskEmail(recipient)}`);
    console.log(`FROM: ${fromEmail}`);
    console.log(`SUBJECT: ${safeSubject}`);
    console.log(`CONTENT SIZE: ${html.length} chars`);
    console.log("-----------------------------------------");
    return { success: true, message: "Email logged to console (Missing RESEND_API_KEY)" };
  }

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipient,
      subject: safeSubject,
      html,
    });

    if (error) {
      // Logged server-side only: the error can quote account/domain detail
      // that must not reach a caller.
      console.error("Resend sendEmail error:", error);
      return { success: false, error: "Failed to send email" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("Resend sendEmail error:", error);
    return { success: false, error: "Failed to send email" };
  }
}
export const revalidate = 0;
