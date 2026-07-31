"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Image as ImageIcon, X, Loader2 } from "lucide-react";

interface ImageUploadDropzoneProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  endpoint?: string;
}

export default function ImageUploadDropzone({
  value = [],
  onChange,
  maxFiles = 5,
  endpoint = "/api/admin/upload",
}: ImageUploadDropzoneProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (value.length + files.length > maxFiles) {
      setError(`You can only upload up to ${maxFiles} images.`);
      return;
    }

    setIsUploading(true);
    setError("");

    const uploadedUrls: string[] = [...value];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(endpoint, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (res.ok && data.url) {
          uploadedUrls.push(data.url);
        } else {
          setError(data.error || "Failed to upload image.");
        }
      } catch (err) {
        setError("Network error. Failed to upload image.");
      }
    }

    onChange(uploadedUrls);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeImage = (indexToRemove: number) => {
    const removedUrl = value[indexToRemove];
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);

    // Best-effort: also delete the file from ImageKit storage so removed
    // images don't keep taking up space. Never blocks the UI on failure.
    if (removedUrl) {
      fetch(endpoint, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: removedUrl }),
      }).catch(() => {});
    }
  };

  return (
    <div className="space-y-4">
      {/* Dropzone container */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed border-brand-border hover:border-primary rounded-xl p-3 md:p-8 text-center cursor-pointer transition-colors flex flex-col items-center justify-center bg-brand-light-gray/50 hover:bg-primary-tint/10 ${
          isUploading ? "pointer-events-none opacity-60" : ""
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
          accept="image/*"
          className="hidden"
        />

        {isUploading ? (
          <div className="space-y-2 flex flex-col items-center">
            <Loader2 size={36} className="animate-spin text-primary" />
            <p className="text-sm font-semibold text-brand-black">Uploading images...</p>
          </div>
        ) : (
          <div className="space-y-2 flex flex-col items-center">
            <UploadCloud size={36} className="text-brand-gray" />
            <p className="text-sm font-semibold text-brand-black">
              Click to upload or drag images here
            </p>
            <p className="text-xs text-brand-gray">
              PNG, JPG, JPEG up to 5MB (Max {maxFiles} files)
            </p>
          </div>
        )}
      </div>

      {/* Error alert */}
      {error && <p className="text-xs font-semibold text-red-600">{error}</p>}

      {/* Previews */}
      {value.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4">
          {value.map((url, idx) => (
            <div
              key={idx}
              className="relative aspect-square border border-brand-border rounded-xl overflow-hidden group bg-brand-light-gray"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt={`Preview ${idx + 1}`}
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  removeImage(idx);
                }}
                className="absolute top-1.5 right-1.5 bg-brand-black/75 hover:bg-red-600 text-white p-1 rounded-full opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
