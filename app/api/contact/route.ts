import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import SiteSettings from "@/models/SiteSettings";
import { contactMessageSchema } from "@/lib/validations";
import { rateLimit } from "@/lib/rateLimit";
import { sendEmail } from "@/lib/email/sendEmail";
import { getAdminNewContactEmailHtml } from "@/lib/email/adminNewContact";
import { getContactConfirmationEmail } from "@/lib/email/customerContactConfirmation";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const { success } = rateLimit(`contact_${ip}`, 3, 60 * 1000);
    if (!success) {
      return NextResponse.json(
        { error: "Too many messages sent. Please wait a moment and try again." },
        { status: 429 }
      );
    }

    await connectToDatabase();

    const body = await req.json();
    const result = contactMessageSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Validation failed", details: result.error.format() },
        { status: 400 }
      );
    }

    const { name, phone, email, subject, message } = result.data;

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
    const settingsMap = settingsList.reduce((acc: Record<string, string>, s: any) => {
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
  } catch (error: any) {
    console.error("Public Contact POST error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to send message" },
      { status: 500 }
    );
  }
}
export const revalidate = 0;
