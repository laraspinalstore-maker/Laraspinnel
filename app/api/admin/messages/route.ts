import { NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const messages = await ContactMessage.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json(messages);
  } catch (error) {
    return serverError("Admin Messages GET error:", error, "Failed to fetch contact messages");
  }
}
