import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, isDenied, serverError, readJsonBody, isValidObjectId, notFound } from "@/lib/security/http";
import { connectToDatabase } from "@/lib/db";
import ContactMessage from "@/models/ContactMessage";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Message not found");

    const parsed = await readJsonBody<{ status?: unknown }>(req, 8 * 1024);
    if (!parsed.ok) return parsed.response;
    // Coerced to a string before the allowlist check, so a non-string body
    // value can't slip past includes() and reach the update.
    const status = String(parsed.data?.status ?? "");

    if (!["new", "read", "responded"].includes(status)) {
      return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
    }

    const updatedMessage = await ContactMessage.findByIdAndUpdate(
      id,
      { status },
      { returnDocument: 'after' }
    );

    if (!updatedMessage) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json(updatedMessage);
  } catch (error) {
    return serverError("Admin Messages PUT error:", error, "Failed to update message status");
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();
    const { id } = await params;
    // Reject a malformed id before Mongoose throws a CastError (which would
    // otherwise be reported as a 500 rather than "not found").
    if (!isValidObjectId(id)) return notFound("Message not found");

    const message = await ContactMessage.findByIdAndDelete(id);
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }

    return NextResponse.json({ message: "Message deleted successfully" });
  } catch (error) {
    return serverError("Admin Messages DELETE error:", error, "Failed to delete message");
  }
}
