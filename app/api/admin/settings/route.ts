import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import SiteSettings from "@/models/SiteSettings";
import { requireAdmin, isDenied, serverError, badRequest, readJsonBody } from "@/lib/security/http";
import {
  isValidSettingKey,
  maxSettingValueLength,
  RICH_TEXT_SETTING_KEYS,
} from "@/lib/security/publicSettings";
import { sanitizeRichText } from "@/lib/security/sanitize";
import { logSecurityEvent, maskEmail } from "@/lib/security/audit";

/** Cap on how many keys one request may write. */
const MAX_KEYS_PER_REQUEST = 200;

export async function GET() {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();

    const settingsList = await SiteSettings.find({}).lean();

    // Map list [ { key: 'farm_name', value: '...' } ] to single object { farm_name: '...' }
    const settingsObject = settingsList.reduce((acc: Record<string, string>, curr) => {
      acc[curr.key] = curr.value;
      return acc;
    }, {});

    return NextResponse.json(settingsObject);
  } catch (error) {
    return serverError("admin-settings:GET", error, "Failed to fetch site settings");
  }
}

/**
 * Writes settings.
 *
 * SECURITY: this previously accepted any JSON object and wrote `String(val)` for
 * every entry with no validation of the key or the length of the value. That
 * allowed arbitrary key names (including prototype-shaped ones) and unbounded
 * document growth, and it stored rich-text values verbatim even though the
 * policy pages render them as raw HTML.
 */
export async function PUT(req: NextRequest) {
  try {
    const auth = await requireAdmin();
    if (isDenied(auth)) return auth.response;

    await connectToDatabase();

    // Rich text needs headroom, so the overall body cap is generous but finite.
    const parsed = await readJsonBody<Record<string, unknown>>(req, 2 * 1024 * 1024);
    if (!parsed.ok) return parsed.response;

    const body = parsed.data;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return badRequest("Expected an object of settings key/value pairs.");
    }

    const entries = Object.entries(body);
    if (entries.length === 0) {
      return badRequest("No settings provided.");
    }
    if (entries.length > MAX_KEYS_PER_REQUEST) {
      return badRequest(`Cannot update more than ${MAX_KEYS_PER_REQUEST} settings at once.`);
    }

    const rejected: string[] = [];
    const updates: Array<{ key: string; value: string }> = [];

    for (const [key, rawValue] of entries) {
      if (!isValidSettingKey(key)) {
        rejected.push(key);
        continue;
      }

      // Objects/arrays are stringified by the existing contract (list-type
      // content is stored as a JSON string), so that behaviour is preserved.
      let value =
        typeof rawValue === "string"
          ? rawValue
          : rawValue === null || rawValue === undefined
            ? ""
            : typeof rawValue === "object"
              ? JSON.stringify(rawValue)
              : String(rawValue);

      // Admin-authored HTML is sanitized before storage, so the policy pages
      // never hold a script payload even if the editor is bypassed by posting
      // to this endpoint directly.
      if (RICH_TEXT_SETTING_KEYS.has(key)) {
        value = sanitizeRichText(value);
      }

      const limit = maxSettingValueLength(key);
      if (value.length > limit) {
        rejected.push(key);
        continue;
      }

      updates.push({ key, value });
    }

    // All-or-nothing. Applying the valid keys and quietly dropping the rest
    // looked like a successful save in the admin UI while silently discarding
    // the admin's edit — a data-integrity trap. Reject the whole request instead,
    // naming the offending keys, so the failure is visible.
    if (rejected.length > 0) {
      return badRequest(
        "Some settings were rejected (invalid key name, or value too long). No changes were saved.",
        { rejected }
      );
    }

    if (updates.length === 0) {
      return badRequest("No valid settings to update.");
    }

    await Promise.all(
      updates.map(({ key, value }) =>
        SiteSettings.findOneAndUpdate({ key }, { value }, { upsert: true, returnDocument: "after" })
      )
    );

    logSecurityEvent("admin.mutation", {
      actor: maskEmail(auth.admin.email),
      resource: "site_settings",
      action: "PUT",
      keys: updates.map((u) => u.key),
      rejectedCount: rejected.length,
    });

    // Purge the site cache so changes (including policy pages and layout) show immediately
    revalidatePath("/", "layout");

    return NextResponse.json({
      message: "Settings updated successfully",
      updated: updates.length,
    });
  } catch (error) {
    return serverError("admin-settings:PUT", error, "Failed to update site settings");
  }
}
