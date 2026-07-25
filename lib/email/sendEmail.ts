import nodemailer from "nodemailer";

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: SendEmailParams) {
  const fromEmail = process.env.EMAIL_FROM || "Laraspinnel <no-reply@laraspinnal.com>";

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.log("-----------------------------------------");
    console.log(`DEBUG EMAIL LOG (SMTP Credentials Missing)`);
    console.log(`TO: ${to}`);
    console.log(`FROM: ${fromEmail}`);
    console.log(`SUBJECT: ${subject}`);
    console.log(`CONTENT SIZE: ${html.length} chars`);
    console.log("-----------------------------------------");
    return { success: true, message: "Email logged to console (Missing SMTP Credentials)" };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === "465",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: fromEmail,
      to,
      subject,
      html,
    });

    return { success: true, data: info };
  } catch (error: any) {
    console.error("Nodemailer sendEmail error:", error);
    return { success: false, error: error.message };
  }
}
export const revalidate = 0;
