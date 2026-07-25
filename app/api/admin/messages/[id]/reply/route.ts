import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";
import { sendEmail } from "@/lib/email/sendEmail";
import { getCustomerReplyEmail } from "@/lib/email/customerReply";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { replyText } = await request.json();
    if (!replyText || replyText.trim() === "") {
      return NextResponse.json({ error: "Reply text is required" }, { status: 400 });
    }

    await connectToDatabase();
    
    const resolvedParams = await params;
    const message = await ContactMessage.findById(resolvedParams.id);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    if (!message.email) {
      return NextResponse.json({ error: "Client has no email address" }, { status: 400 });
    }

    const { subject, html } = getCustomerReplyEmail(
      {
        customerName: message.name,
        replyText,
        originalSubject: message.subject,
        originalMessage: message.message,
      },
      "Laraspinnel"
    );

    const emailRes = await sendEmail({
      to: message.email,
      subject,
      html,
    });

    if (!emailRes.success) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    // Update message status to responded and store reply history
    message.status = "responded";
    if (!message.replies) {
      message.replies = [];
    }
    message.replies.push({ text: replyText, date: new Date() });
    
    await message.save();

    return NextResponse.json({ success: true, message: "Reply sent successfully", reply: { text: replyText, date: new Date() } });
  } catch (error: any) {
    console.error("Error replying to message:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
