import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImageToImageKit, deleteImageByUrl } from "@/lib/imagekit";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify admin session
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse FormData
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // 2b. Validate file type and size (videos get a larger cap than images)
    const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    const VIDEO_TYPES = ["video/mp4", "video/webm", "video/quicktime"];
    const isVideo = VIDEO_TYPES.includes(file.type);
    if (!IMAGE_TYPES.includes(file.type) && !isVideo) {
      return NextResponse.json(
        { error: "Unsupported file type. Allowed: JPEG, PNG, WebP, AVIF, GIF, MP4, WebM, MOV." },
        { status: 415 }
      );
    }
    const MAX_FILE_SIZE = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File too large. Maximum size is ${isVideo ? "50" : "5"} MB.` },
        { status: 413 }
      );
    }

    // 3. Read file as buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Upload to ImageKit
    const uploadResponse = await uploadImageToImageKit(
      buffer,
      file.name || `image_${Date.now()}`
    );

    return NextResponse.json({
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
    });
  } catch (error: any) {
    console.error("Upload route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload image" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "No image URL provided" }, { status: 400 });
    }

    await deleteImageByUrl(url);

    return NextResponse.json({ message: "Image deleted" });
  } catch (error: any) {
    console.error("Upload DELETE route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete image" },
      { status: 500 }
    );
  }
}
