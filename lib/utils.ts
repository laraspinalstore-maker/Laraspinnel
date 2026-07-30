import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/[^\w\-]+/g, "") // Remove all non-word chars
    .replace(/\-\-+/g, "-") // Replace multiple - with single -
    .replace(/^-+/, "") // Trim - from start of text
    .replace(/-+$/, ""); // Trim - from end of text
}

/**
 * Generates an order reference.
 *
 * This was `Math.random()` over a 4-digit range, which gave only 9,000 values
 * per day. Two consequences: order numbers were guessable (they are one of the
 * two factors on the public /track-order lookup), and `orderNumber` carries a
 * unique index, so collisions surfaced as failed checkouts well before that
 * space was exhausted.
 *
 * Now: 8 characters from a cryptographically secure source over a 32-symbol
 * Crockford-style alphabet (no I/L/O/U, so a reference read off a phone screen
 * isn't ambiguous) — about 1.1e12 values per day. Web Crypto is used rather
 * than `node:crypto` so this stays safe to import from shared code.
 */
const REF_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const REF_RANDOM_LENGTH = 8;

export function generateRefId(): string {
  const date = new Date();
  const year = date.getFullYear().toString();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  const bytes = new Uint8Array(REF_RANDOM_LENGTH);
  crypto.getRandomValues(bytes);

  let random = "";
  for (const byte of bytes) {
    // 256 is a multiple of 32, so the modulo introduces no bias.
    random += REF_ALPHABET[byte % REF_ALPHABET.length];
  }

  return `LPO-${year}${month}${day}-${random}`;
}

/**
 * Push out-of-stock items (stock <= 0) to the end of the list while keeping
 * everything else in its existing order. Uses a stable sort, so in-stock
 * items stay in whatever order the caller already applied (latest/price/etc.),
 * and items regain their normal position the moment stock is restored.
 */
export function sortInStockFirst<T extends { stock?: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aOut = typeof a.stock === "number" && a.stock <= 0 ? 1 : 0;
    const bOut = typeof b.stock === "number" && b.stock <= 0 ? 1 : 0;
    return aOut - bOut;
  });
}

export function formatDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export type TrailGradientStops = {
  light: string;
  base: string;
  dark: string;
};

function clamp255(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

function mixWithWhite(channel: number, amount: number): number {
  return clamp255(channel + (255 - channel) * amount);
}

function mixWithBlack(channel: number, amount: number): number {
  return clamp255(channel * (1 - amount));
}

function toHex(value: number): string {
  return value.toString(16).padStart(2, "0");
}

/**
 * Derives a light/base/dark triad from a single theme hex color, so the
 * snake-trail's glow always matches whatever decoration color an admin has
 * configured for that banner, instead of a fixed palette.
 */
export function getTrailGradientStops(hex: string): TrailGradientStops {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);

  const light = `#${toHex(mixWithWhite(r, 0.45))}${toHex(mixWithWhite(g, 0.45))}${toHex(mixWithWhite(b, 0.45))}`;
  const dark = `#${toHex(mixWithBlack(r, 0.3))}${toHex(mixWithBlack(g, 0.3))}${toHex(mixWithBlack(b, 0.3))}`;

  return { light, base: hex.toLowerCase(), dark };
}
