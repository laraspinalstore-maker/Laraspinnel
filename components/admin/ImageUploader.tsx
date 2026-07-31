"use client";

import React, { useId, useState } from "react";
import { Upload, X, AlertCircle, Star, Plus, ImageIcon } from "lucide-react";

interface ImageUploaderProps {
  /** Current list of image URLs */
  images: string[];
  /** Called whenever the list changes (add / remove / reorder) */
  onChange: (images: string[]) => void;
  /** Allow more than one image (products) or just one (categories) */
  multiple?: boolean;
  /** Heading shown above the uploader */
  label?: string;
}

export default function ImageUploader({
  images,
  onChange,
  multiple = true,
  label = "Product Images",
}: ImageUploaderProps) {
  const inputId = useId();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [urlInput, setUrlInput] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadError("");

    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const body = new FormData();
        body.append("file", files[i]);

        const res = await fetch("/api/admin/upload", { method: "POST", body });
        const data = await res.json();
        if (res.ok) {
          uploadedUrls.push(data.url);
        } else {
          setUploadError(data.error || `Failed to upload ${files[i].name}`);
        }
      }

      if (uploadedUrls.length > 0) {
        // Single-image mode keeps only the most recent upload.
        onChange(multiple ? [...images, ...uploadedUrls] : [uploadedUrls[uploadedUrls.length - 1]]);
      }
    } catch (err) {
      setUploadError("Failed to upload image");
    } finally {
      setIsUploading(false);
      // Reset so selecting the same file again still fires onChange.
      e.target.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const removedUrl = images[index];
    onChange(images.filter((_, i) => i !== index));

    // Best-effort: also delete the file from ImageKit storage so removed
    // images don't keep taking up space. Never blocks the UI on failure.
    if (removedUrl) {
      fetch("/api/admin/upload", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: removedUrl }),
      }).catch(() => {});
    }
  };

  const handleMakeCover = (index: number) => {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    onChange([picked, ...next]);
  };

  const handleAddUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    onChange(multiple ? [...images, url] : [url]);
    setUrlInput("");
    setUploadError("");
  };

  const canAddMore = multiple || images.length === 0;

  return (
    <div className="space-y-4 p-4 bg-brand-light-gray/20 border border-brand-border rounded-2xl">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-brand-black uppercase block">{label}</span>
        <span className="text-[10px] font-semibold text-brand-gray">
          {images.length} {images.length === 1 ? "image" : "images"}
        </span>
      </div>

      {/* Thumbnail grid of already-added images */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 sm:gap-3">
          {images.map((img, index) => (
            <div
              key={`${img}-${index}`}
              className="group relative aspect-square rounded-xl overflow-hidden border border-brand-border bg-white shadow-xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Image ${index + 1}`} className="w-full h-full object-cover" />

              {/* Cover badge on the first image */}
              {index === 0 && (
                <span className="absolute top-1 left-1 flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-primary text-white text-[8px] font-bold uppercase tracking-wide shadow-sm">
                  <Star size={8} className="fill-white" /> Cover
                </span>
              )}

              {/* Remove button */}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                aria-label="Remove image"
                className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 text-red-600 border border-red-100 shadow-sm hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
              >
                <X size={13} strokeWidth={2.5} />
              </button>

              {/* Make cover (multi-image only, not on the first) */}
              {multiple && index !== 0 && (
                <button
                  type="button"
                  onClick={() => handleMakeCover(index)}
                  className="absolute bottom-0 inset-x-0 py-1 bg-black/55 text-white text-[9px] font-bold uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-all hover:bg-primary"
                >
                  Set as cover
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload dropzone */}
      {canAddMore && (
        <div className="flex flex-col gap-2">
          <input
            type="file"
            id={inputId}
            accept="image/*"
            multiple={multiple}
            onChange={handleFileUpload}
            className="hidden"
          />
          <label
            htmlFor={inputId}
            className="flex items-center justify-center gap-2 border border-dashed border-neutral-300 hover:border-primary hover:bg-primary-tint/40 bg-white rounded-xl py-5 px-4 cursor-pointer transition-all text-sm font-semibold text-brand-black"
          >
            <Upload size={18} className={isUploading ? "animate-bounce text-primary" : "text-brand-gray"} />
            {isUploading
              ? "Uploading..."
              : images.length > 0
              ? multiple
                ? "Add more images"
                : "Change image"
              : multiple
              ? "Upload from device (select multiple)"
              : "Upload from device"}
          </label>
          {uploadError && (
            <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
              <AlertCircle size={12} /> {uploadError}
            </p>
          )}
        </div>
      )}

      {/* Add by URL */}
      {canAddMore && (
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray pointer-events-none" />
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddUrl();
                }
              }}
              placeholder="Or paste an image URL..."
              className="w-full h-10 pl-9 pr-3 bg-white border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all"
            />
          </div>
          <button
            type="button"
            onClick={handleAddUrl}
            disabled={!urlInput.trim()}
            className="h-10 px-3.5 flex items-center gap-1 rounded-xl bg-brand-black hover:bg-primary text-white text-xs font-bold transition-all disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      )}

      <p className="text-[9px] text-brand-gray font-medium">
        {multiple
          ? "The first image is the main cover thumbnail. Hover an image to set cover or remove it."
          : "Hover the image to remove it, or upload a new one to replace."}
      </p>
    </div>
  );
}
