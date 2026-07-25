import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import Testimonial from "@/models/Testimonial";

export async function PUT(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();
    const body = await req.json();

    const { name, location, goal, outcome, rating, refId, avatarUrl, imageUrl, orderImageUrl, isActive } = body;

    const initial = name ? name.charAt(0).toUpperCase() : undefined;

    const updateData: any = {
      ...(name && { name, initial }),
      ...(location !== undefined && { location }),
      ...(goal !== undefined && { goal }),
      ...(outcome !== undefined && { outcome }),
      ...(rating && { rating: Number(rating) }),
      ...(refId && { refId }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(imageUrl !== undefined && { imageUrl }),
      ...(orderImageUrl !== undefined && { orderImageUrl }),
      ...(isActive !== undefined && { isActive }),
    };

    const updatedTestimonial = await Testimonial.findByIdAndUpdate(
      params.id,
      updateData,
      { returnDocument: 'after' }
    );

    if (!updatedTestimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

    const { revalidatePath } = require("next/cache");
    revalidatePath("/");
    revalidatePath("/about");

    return NextResponse.json(updatedTestimonial);
  } catch (error: any) {
    console.error("Testimonial PUT error:", error);
    return NextResponse.json(
      { error: "Failed to update testimonial" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const params = await props.params;
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    const deletedTestimonial = await Testimonial.findByIdAndDelete(params.id);

    if (!deletedTestimonial) {
      return NextResponse.json(
        { error: "Testimonial not found" },
        { status: 404 }
      );
    }

    const { revalidatePath } = require("next/cache");
    revalidatePath("/");
    revalidatePath("/about");

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Testimonial DELETE error:", error);
    return NextResponse.json(
      { error: "Failed to delete testimonial" },
      { status: 500 }
    );
  }
}
