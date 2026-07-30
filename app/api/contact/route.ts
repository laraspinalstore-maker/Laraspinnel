import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import SiteSettings from "@/models/SiteSettings";
import { contactMessageSchema } from "@/lib/validations";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp, serverError, badRequest, tooManyRequests, readJsonBody } from "@/lib/security/http";
import { stripTags } from "@/lib/security/sanitize";
import { sendEmail } from "@/lib/email/sendEmail";
import { getAdminNewContactEmailHtml } from "@/lib/email/adminNewContact";
import { getContactConfirmationEmail } from "@/lib/email/customerContactConfirmation";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const { success, retryAfterSeconds } = await checkRateLimit("contact", ip, { route: "/api/contact" });
    if (!success) {
      return tooManyRequests(
        "Too many messages sent. Please wait a moment and try again.",
        retryAfterSeconds
      );
    }

    await connectToDatabase();

    const parsed = await readJsonBody(req, 32 * 1024);
    if (!parsed.ok) return parsed.response;

    const result = contactMessageSchema.safeParse(parsed.data);

    if (!result.success) {
      return badRequest("Validation failed", result.error.format());
    }

    // Markup is stripped at the boundary. These values are displayed in the
    // admin panel and interpolated into the notification email, so they are
    // stored as plain text rather than trusted as-is.
    const name = stripTags(result.data.name).trim();
    const subject = stripTags(result.data.subject).trim();
    const message = stripTags(result.data.message).trim();
    const { phone, email } = result.data;

    if (!name || !subject || !message) {
      return badRequest("Please fill in your name, a subject and a message.");
    }

    const contactMessage = await ContactMessage.create({
      name,
      phone,
      email: email?.trim() || undefined,
      subject,
      message,
    });

    const settingsList = await SiteSettings.find({
      key: { $in: ["farm_name", "contact_email", "email_contact_subject", "email_contact_intro", "email_contact_footer"] },
    }).lean();
    const settingsMap = settingsList.reduce((acc: Record<string, string>, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    const shopName = settingsMap.farm_name || "Laraspinnel";

    // Notify the shop owner — best-effort, never blocks the response.
    if (settingsMap.contact_email) {
      try {
        await sendEmail({
          to: settingsMap.contact_email,
          subject: `New Contact Message: ${subject}`,
          html: getAdminNewContactEmailHtml({ name, email, phone, subject, message }),
        });
      } catch (err) {
        console.error("Admin new-contact notification failed to send:", err);
      }
    }

    // Confirm receipt to the sender if they gave an email — best-effort.
    if (email?.trim()) {
      try {
        const { subject: emailSubject, html } = getContactConfirmationEmail(
          { name, subject, message },
          {
            shopName,
            subjectTemplate: settingsMap.email_contact_subject,
            introTemplate: settingsMap.email_contact_intro,
            footerTemplate: settingsMap.email_contact_footer,
          }
        );
        await sendEmail({ to: email.trim(), subject: emailSubject, html });
      } catch (err) {
        console.error("Contact confirmation email failed to send:", err);
      }
    }

    return NextResponse.json(
      { message: "Message sent successfully", id: contactMessage._id },
      { status: 201 }
    );
  } catch (error) {
    return serverError("contact:POST", error, "Failed to send message. Please try again.");
  }
}
export const revalidate = 0;
