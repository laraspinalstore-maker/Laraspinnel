"use client";

import React, { useRef, useState } from "react";
import { Plus, Trash2, ArrowUp, ArrowDown, Loader2, Video, X } from "lucide-react";
import ImageUploader from "@/components/admin/ImageUploader";
import { PromoCard, PROMO_CARD_COLORS, CustomGalleryItem } from "@/lib/siteContent";
import type { AboutReel } from "@/components/about/ReelsSection";

/* ---------------- Single-value fields ---------------- */

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
      />
      {hint && <p className="text-[10px] text-brand-gray">{hint}</p>}
    </div>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  rows = 3,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  hint?: string;
  rows?: number;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full p-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all resize-none"
      />
      {hint && <p className="text-[10px] text-brand-gray">{hint}</p>}
    </div>
  );
}

export function ImageField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">{label}</label>
      <ImageUploader
        images={value ? [value] : []}
        onChange={(imgs) => onChange(imgs[0] || "")}
        multiple={false}
        label={label}
      />
      {hint && <p className="text-[10px] text-brand-gray">{hint}</p>}
    </div>
  );
}

/* ---------------- CRUD list editor ----------------
 * Handles two shapes:
 *  - a list of plain strings         (fields = ["value"] shorthand -> pass `stringField`)
 *  - a list of objects with fields    (e.g. {label, href} or {title, desc})
 */

export interface ListFieldDef {
  key: string;
  label: string;
  placeholder?: string;
}

export function ListEditor<T>({
  label,
  items,
  onChange,
  fields,
  addLabel = "Add item",
  hint,
}: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  /** Field definitions for object rows. Omit for a list of plain strings. */
  fields?: ListFieldDef[];
  addLabel?: string;
  hint?: string;
}) {
  const isStringList = !fields || fields.length === 0;

  const blankItem = (): T =>
    (isStringList ? "" : Object.fromEntries(fields!.map((f) => [f.key, ""]))) as T;

  const update = (index: number, next: T) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, blankItem()]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">{label}</label>
        <span className="text-[10px] font-semibold text-brand-gray">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="space-y-2.5">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 bg-brand-light-gray/30 border border-brand-border rounded-xl"
          >
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="p-1 text-brand-gray hover:text-brand-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="p-1 text-brand-gray hover:text-brand-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDown size={13} />
              </button>
            </div>

            <div className="flex-1 min-w-0 grid grid-cols-1 lg:grid-cols-2 gap-2">
              {isStringList ? (
                <input
                  type="text"
                  value={item as string}
                  onChange={(e) => update(index, e.target.value as T)}
                  placeholder={hint}
                  className="lg:col-span-2 w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
              ) : (
                fields!.map((f) => (
                  <input
                    key={f.key}
                    type="text"
                    value={(item as Record<string, string>)[f.key] || ""}
                    onChange={(e) =>
                      update(index, { ...(item as Record<string, string>), [f.key]: e.target.value } as T)
                    }
                    placeholder={f.placeholder || f.label}
                    className="w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                  />
                ))
              )}
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove item"
              className="shrink-0 p-1.5 mt-0.5 text-brand-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-xs text-brand-gray italic px-1 py-2">No items yet — add one below.</p>
        )}
      </div>

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-goat-primary hover:text-goat-hover border border-dashed border-goat-primary/40 hover:border-goat-primary rounded-lg px-3 py-2 transition-colors"
      >
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}

/* ---------------- Custom Order gallery list editor ---------------- */

export function GalleryItemListEditor({
  items,
  onChange,
  label = "Gallery Images",
}: {
  items: CustomGalleryItem[];
  onChange: (items: CustomGalleryItem[]) => void;
  label?: string;
}) {
  const blankItem = (): CustomGalleryItem => ({ src: "", alt: "" });

  const update = (index: number, next: CustomGalleryItem) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, blankItem()]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">
          {label}
        </label>
        <span className="text-[10px] font-semibold text-brand-gray">
          {items.length} {items.length === 1 ? "image" : "images"}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 bg-brand-light-gray/30 border border-brand-border rounded-xl"
          >
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="p-1 text-brand-gray hover:text-brand-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="p-1 text-brand-gray hover:text-brand-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDown size={13} />
              </button>
            </div>

            <div className="flex-1 min-w-0 space-y-2">
              <ImageUploader
                images={item.src ? [item.src] : []}
                onChange={(imgs) => update(index, { ...item, src: imgs[0] || "" })}
                multiple={false}
                label="Gallery Image"
              />
              <input
                type="text"
                value={item.alt}
                onChange={(e) => update(index, { ...item, alt: e.target.value })}
                placeholder="Image description (alt text), e.g. Pink Lily Bouquet"
                className="w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
              />
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove image"
              className="shrink-0 p-1.5 mt-0.5 text-brand-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-xs text-brand-gray italic px-1 py-2">
            No images yet — the site shows the built-in curated set.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-goat-primary hover:text-goat-hover border border-dashed border-goat-primary/40 hover:border-goat-primary rounded-lg px-3 py-2 transition-colors"
      >
        <Plus size={14} /> Add image
      </button>
    </div>
  );
}

/* ---------------- About "Behind Every Stitch" reels editor ----------------
 * Each reel: an uploaded video (MP4/WebM/MOV, max 50 MB), an optional poster
 * image shown before play, a title, and an optional duration label. */

export function ReelListEditor({
  items,
  onChange,
  label = "Reels",
}: {
  items: AboutReel[];
  onChange: (items: AboutReel[]) => void;
  label?: string;
}) {
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pendingIndex = useRef<number>(-1);
  /* Latest items, so an upload finishing doesn't clobber fields edited mid-upload */
  const itemsRef = useRef(items);
  itemsRef.current = items;

  const blankItem = (): AboutReel => ({ title: "", videoUrl: "", posterUrl: "", duration: "" });

  const update = (index: number, next: AboutReel) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, blankItem()]);

  const pickVideo = (index: number) => {
    pendingIndex.current = index;
    fileInputRef.current?.click();
  };

  const handleVideoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    const index = pendingIndex.current;
    if (!file || index < 0) return;

    if (file.size > 50 * 1024 * 1024) {
      setError("Video too large — maximum size is 50 MB.");
      return;
    }

    setUploadingIndex(index);
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Upload failed");
      const current = itemsRef.current;
      const copy = [...current];
      copy[index] = { ...current[index], videoUrl: data.url };
      onChange(copy);
    } catch (err: any) {
      setError(err.message || "Failed to upload video. Please try again.");
    } finally {
      setUploadingIndex(null);
      pendingIndex.current = -1;
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">{label}</label>
        <span className="text-[10px] font-semibold text-brand-gray">
          {items.length} {items.length === 1 ? "reel" : "reels"}
        </span>
      </div>

      {error && (
        <p className="text-xs text-red-600 font-medium bg-red-50 border border-red-100 p-2.5 rounded-xl">{error}</p>
      )}

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 bg-brand-light-gray/30 border border-brand-border rounded-xl"
          >
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="p-1 text-brand-gray hover:text-brand-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="p-1 text-brand-gray hover:text-brand-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDown size={13} />
              </button>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              {/* Video upload / preview */}
              {item.videoUrl ? (
                <div className="relative w-36 aspect-9/16 rounded-xl overflow-hidden border border-brand-border bg-black">
                  <video src={item.videoUrl} className="w-full h-full object-cover" muted playsInline preload="metadata" />
                  <button
                    type="button"
                    onClick={() => update(index, { ...item, videoUrl: "" })}
                    aria-label="Remove video"
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                  >
                    <X size={12} />
                  </button>
                </div>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => pickVideo(index)}
                    disabled={uploadingIndex !== null}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-red-300 hover:border-goat-primary text-brand-gray hover:text-goat-primary text-xs font-bold transition-colors disabled:opacity-60"
                  >
                    {uploadingIndex === index ? (
                      <>
                        <Loader2 size={15} className="animate-spin" /> Uploading video…
                      </>
                    ) : (
                      <>
                        <Video size={15} /> Upload video (MP4/WebM/MOV, max 50 MB)
                      </>
                    )}
                  </button>
                  <p className="text-[10px] font-bold text-red-500">
                    No video uploaded yet — this reel won&apos;t play on the site until one is added.
                  </p>
                </>
              )}

              {/* Poster image (shown before the video plays) */}
              <ImageUploader
                images={item.posterUrl ? [item.posterUrl] : []}
                onChange={(imgs) => update(index, { ...item, posterUrl: imgs[0] || "" })}
                multiple={false}
                label="Poster Image (optional)"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => update(index, { ...item, title: e.target.value })}
                  placeholder="Reel title, e.g. Making a Crochet Bouquet"
                  className="w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
                <input
                  type="text"
                  value={item.duration || ""}
                  onChange={(e) => update(index, { ...item, duration: e.target.value })}
                  placeholder="Duration label, e.g. 0:15 (optional)"
                  className="w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove reel"
              className="shrink-0 p-1.5 mt-0.5 text-brand-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-xs text-brand-gray italic px-1 py-2">
            No reels yet — the site shows the built-in placeholder set.
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-goat-primary hover:text-goat-hover border border-dashed border-goat-primary/40 hover:border-goat-primary rounded-lg px-3 py-2 transition-colors"
      >
        <Plus size={14} /> Add reel
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        onChange={handleVideoFile}
        className="hidden"
      />
    </div>
  );
}

/* ---------------- Promo Showcase card list editor ---------------- */

export function PromoCardListEditor({
  items,
  onChange,
}: {
  items: PromoCard[];
  onChange: (items: PromoCard[]) => void;
}) {
  const blankItem = (): PromoCard => ({
    imageUrl: "",
    title: "",
    buttonText: "Buy Now",
    buttonLink: "",
    bgColor: PROMO_CARD_COLORS[0].key,
  });

  const update = (index: number, next: PromoCard) => {
    const copy = [...items];
    copy[index] = next;
    onChange(copy);
  };

  const move = (index: number, dir: -1 | 1) => {
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const copy = [...items];
    [copy[index], copy[target]] = [copy[target], copy[index]];
    onChange(copy);
  };

  const remove = (index: number) => onChange(items.filter((_, i) => i !== index));
  const add = () => onChange([...items, blankItem()]);

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">
          Promo Cards
        </label>
        <span className="text-[10px] font-semibold text-brand-gray">
          {items.length} {items.length === 1 ? "card" : "cards"}
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="flex items-start gap-2 p-3 bg-brand-light-gray/30 border border-brand-border rounded-xl"
          >
            <div className="flex flex-col gap-1 pt-1">
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="Move up"
                className="p-1 text-brand-gray hover:text-brand-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === items.length - 1}
                aria-label="Move down"
                className="p-1 text-brand-gray hover:text-brand-black disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ArrowDown size={13} />
              </button>
            </div>

            <div className="flex-1 min-w-0 space-y-3">
              <ImageUploader
                images={item.imageUrl ? [item.imageUrl] : []}
                onChange={(imgs) => update(index, { ...item, imageUrl: imgs[0] || "" })}
                multiple={false}
                label="Card Image"
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => update(index, { ...item, title: e.target.value })}
                  placeholder="Card title, e.g. Crochet Flower Bouquets"
                  className="w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
                <input
                  type="text"
                  value={item.buttonText}
                  onChange={(e) => update(index, { ...item, buttonText: e.target.value })}
                  placeholder="Button text, e.g. Buy Now"
                  className="w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
                <input
                  type="text"
                  value={item.buttonLink}
                  onChange={(e) => update(index, { ...item, buttonLink: e.target.value })}
                  placeholder="Button link, e.g. /shop?category=bouquets"
                  className="lg:col-span-2 w-full h-10 px-3 bg-white border border-brand-border rounded-lg text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-bold text-brand-gray uppercase tracking-wider">
                  Background
                </span>
                {PROMO_CARD_COLORS.map((color) => (
                  <button
                    key={color.key}
                    type="button"
                    onClick={() => update(index, { ...item, bgColor: color.key })}
                    aria-label={color.label}
                    title={color.label}
                    className={`w-7 h-7 rounded-full ${color.className} border-2 transition-all ${
                      item.bgColor === color.key ? "border-brand-black scale-110" : "border-transparent"
                    }`}
                  />
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => remove(index)}
              aria-label="Remove card"
              className="shrink-0 p-1.5 mt-0.5 text-brand-gray hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}

        {items.length === 0 && (
          <p className="text-xs text-brand-gray italic px-1 py-2">No promo cards yet — add one below.</p>
        )}
      </div>

      <button
        type="button"
        onClick={add}
        className="inline-flex items-center gap-1.5 text-xs font-bold text-goat-primary hover:text-goat-hover border border-dashed border-goat-primary/40 hover:border-goat-primary rounded-lg px-3 py-2 transition-colors"
      >
        <Plus size={14} /> Add promo card
      </button>
    </div>
  );
}
