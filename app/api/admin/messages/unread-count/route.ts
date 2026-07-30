import { NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    
    // Count only "new" (unread) messages
    const count = await ContactMessage.countDocuments({ status: "new" });

    return NextResponse.json({ count });
  } catch (error) {
    return serverError("Admin Messages Unread Count GET error:", error, "Failed to fetch unread message count");
  }
}
