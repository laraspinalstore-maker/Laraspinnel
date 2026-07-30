import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { filterPublicSettings, RICH_TEXT_SETTING_KEYS } from "@/lib/security/publicSettings";
import { sanitizeRichText } from "@/lib/security/sanitize";
import { serverError } from "@/lib/security/http";

/**
 * Public settings feed.
 *
 * SECURITY: this used to return every row in the SiteSettings table to anyone,
 * so internal values (email templates, and anything an admin added later) were
 * world-readable JSON. It now returns only keys the exposure policy in
 * lib/security/publicSettings.ts marks public.
 *
 * Rich-text values are re-sanitized on the way out, so content stored before
 * write-time sanitizing existed can't carry a script payload into the pages
 * that render it as HTML.
 */
export async function GET() {
  try {
    await connectToDatabase();

    const settingsList = await SiteSettings.find({}).lean();

    // Map list [ { key: 'farm_name', value: '...' } ] to single object { farm_name: '...' }
    const settingsObject = settingsList.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    const publicSettings = filterPublicSettings(settingsObject);

    for (const key of Object.keys(publicSettings)) {
      if (RICH_TEXT_SETTING_KEYS.has(key)) {
        publicSettings[key] = sanitizeRichText(publicSettings[key]);
      }
    }

    return NextResponse.json(publicSettings);
  } catch (error) {
    return serverError("settings:GET", error, "Failed to fetch site settings");
  }
}
export const revalidate = 60; // Cache and revalidate settings every 60s
