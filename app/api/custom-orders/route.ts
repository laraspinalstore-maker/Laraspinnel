import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import Order from "@/models/Order";
import SiteSettings from "@/models/SiteSettings";
import { checkRateLimit } from "@/lib/security/rateLimit";
import { getClientIp, serverError, badRequest, tooManyRequests, readJsonBody } from "@/lib/security/http";
import { isOwnImageKitUrl, stripTags } from "@/lib/security/sanitize";
import { generateRefId } from "@/lib/utils";
import { sendEmail } from "@/lib/email/sendEmail";
import { getAdminNewContactEmailHtml } from "@/lib/email/adminNewContact";

export const dynamic = "force-dynamic";

// Public endpoint — customers submit a made-to-order request from /custom-order.
// It lands in the admin Orders page as a pending order with orderType "custom";
// price is 0 until the admin confirms a quote with the customer.
export async function POST(req: NextRequest) {
  try {
    // Client IP is read from the last forwarded hop rather than the raw header,
    // which a caller can prepend to in order to rotate their limiter bucket.
    const ip = getClientIp(req);
    const { success, retryAfterSeconds } = await checkRateLimit("customOrder", ip, {
      route: "/api/custom-orders",
    });
    if (!success) {
      return tooManyRequests(
        "Too many requests. Please wait a moment and try again.",
        retryAfterSeconds
      );
    }

    await connectToDatabase();
    const parsed = await readJsonBody<Record<string, unknown>>(req, 64 * 1024);
    if (!parsed.ok) return parsed.response;
    const body = parsed.data ?? {};
    const {
      name,
      phone,
      email,
      category,
      categoryImage,
      occasion,
      colors,
      size,
      quantity,
      personalization,
      requirements,
      date,
      cityPin,
      notes,
      images,
    } = body;

    if (!name || !phone || !category) {
      return badRequest("Name, phone, and product category are required");
    }
    if (!/^\d{10}$/.test(String(phone).replace(/[^\d]/g, "").slice(-10))) {
      return badRequest("Please enter a valid 10-digit phone number");
    }

    // Markup is stripped, not just trimmed: every one of these values is shown
    // in the admin panel and interpolated into the owner notification email.
    const clean = (value: unknown, max: number) =>
      typeof value === "string" ? stripTags(value).trim().slice(0, max) : "";

    // Only accept image URLs from our own ImageKit uploads
    const safeImages = (Array.isArray(images) ? images : [])
      // Parsed-origin check, not a string prefix: "https://ik.imagekit.io/" also
      // prefixes a neighbouring account's path.
      .filter((u: unknown): u is string => isOwnImageKitUrl(u))
      .slice(0, 4);
    const safeCategoryImage =
      isOwnImageKitUrl(categoryImage) ||
      (typeof categoryImage === "string" && categoryImage.startsWith("/") && !categoryImage.startsWith("//"))
        ? String(categoryImage)
        : "";

    const colorList = (Array.isArray(colors) ? colors : [])
      .map((c: unknown) => clean(c, 40))
      .filter(Boolean)
      .slice(0, 10);

    const quantityLabel = clean(quantity, 20) || "1";
    const numericQty = /^\d+$/.test(quantityLabel)
      ? Math.min(99, parseInt(quantityLabel, 10))
      : 6; // "More than 5"

    // All request details live in the order's notes — shown on the admin detail page
    const composedNotes = [
      "CUSTOM ORDER REQUEST",
      occasion && `Occasion: ${clean(occasion, 60)}`,
      colorList.length > 0 && `Preferred colors: ${colorList.join(", ")}`,
      size && `Size: ${clean(size, 60)}`,
      `Quantity: ${quantityLabel}`,
      personalization && `Personalization: ${clean(personalization, 300)}`,
      requirements && `Special requirements: ${clean(requirements, 500)}`,
      date && `Preferred delivery date: ${clean(date, 20)}`,
      notes && `Additional notes: ${clean(notes, 500)}`,
      safeImages.length > 0 && `Reference images:\n${safeImages.join("\n")}`,
    ]
      .filter(Boolean)
      .join("\n");

    const orderNumber = generateRefId();
    const cleanName = clean(name, 80);
    const cleanCityPin = clean(cityPin, 80);

    const order = await Order.create({
      orderNumber,
      customerName: cleanName,
      phone: clean(phone, 20),
      email: clean(email, 120) || undefined,
      address: "Custom order — address to be confirmed",
      city: cleanCityPin || "To be confirmed",
      pincode: cleanCityPin.match(/\d{6}/)?.[0] || "-",
      // notes holds only the customer's own words; the rest is structured below
      notes: clean(notes, 500) || undefined,
      customDetails: {
        occasion: clean(occasion, 60) || undefined,
        colors: colorList.length > 0 ? colorList : undefined,
        size: clean(size, 60) || undefined,
        quantityLabel,
        personalization: clean(personalization, 300) || undefined,
        requirements: clean(requirements, 500) || undefined,
        preferredDate: clean(date, 20) || undefined,
        customerNote: clean(notes, 500) || undefined,
      },
      items: [
        {
          name: `Custom Order — ${clean(category, 80)}`,
          price: 0,
          quantity: numericQty,
          image: safeCategoryImage || "/logo.png",
          customText: clean(personalization, 300) || undefined,
          customImage: safeImages[0] || undefined,
        },
      ],
      subtotal: 0,
      deliveryFee: 0,
      totalAmount: 0,
      status: "pending",
      orderType: "custom",
      referenceImages: safeImages.length > 0 ? safeImages : undefined,
    });

    // Notify the shop owner — best-effort, never blocks the response
    try {
      const settingsList = await SiteSettings.find({ key: "contact_email" }).lean();
      const contactEmail = settingsList[0]?.value;
      if (contactEmail) {
        await sendEmail({
          to: contactEmail,
          subject: `New Custom Order Request: ${orderNumber}`,
          html: getAdminNewContactEmailHtml({
            name: cleanName,
            email: clean(email, 120),
            phone: clean(phone, 20),
            subject: `Custom Order Request (${orderNumber})`,
            message: composedNotes,
          }),
        });
      }
    } catch (err) {
      console.error("Custom order admin notification failed to send:", err);
    }

    return NextResponse.json(
      { message: "Custom order request received", orderNumber, id: order._id },
      { status: 201 }
    );
  } catch (error) {
    return serverError("custom-orders:POST", error, "Failed to submit your request. Please try again.");
  }
}
