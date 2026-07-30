import nodemailer from "nodemailer";
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
  const fromEmail = process.env.EMAIL_FROM || "Laraspinnel <no-reply@laraspinnal.com>";

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

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    // Development fallback. The recipient is masked because this line lands in
    // application logs, which must not become a store of customer addresses.
    console.log("-----------------------------------------");
    console.log(`DEBUG EMAIL LOG (SMTP Credentials Missing)`);
    console.log(`TO: ${maskEmail(recipient)}`);
    console.log(`FROM: ${fromEmail}`);
    console.log(`SUBJECT: ${safeSubject}`);
    console.log(`CONTENT SIZE: ${html.length} chars`);
    console.log("-----------------------------------------");
    return { success: true, message: "Email logged to console (Missing SMTP Credentials)" };
  }

  try {
    const port = Number(process.env.SMTP_PORT) || 587;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // On port 587 the connection starts in the clear and is upgraded, so
      // STARTTLS is required rather than optional — otherwise a network
      // attacker can strip it and the SMTP password crosses the wire in plain
      // text. Certificate validation is left at its (enabled) default.
      requireTLS: port !== 465,
      tls: {
        minVersion: "TLSv1.2",
      },
    });

    const info = await transporter.sendMail({
      from: fromEmail,
      to: recipient,
      subject: safeSubject,
      html,
    });

    return { success: true, data: info };
  } catch (error) {
    // Logged server-side only: SMTP errors quote credentials-adjacent detail
    // (host, user, auth mechanism) that must not reach a caller.
    console.error("Nodemailer sendEmail error:", error);
    return { success: false, error: "Failed to send email" };
  }
}
export const revalidate = 0;
