"use client";

import React, { useState } from "react";
import { Link2, X } from "lucide-react";

interface ImageUrlDialogProps {
  isOpen: boolean;
  onConfirm: (url: string) => void;
  onCancel: () => void;
}

export default function ImageUrlDialog({
  isOpen,
  onConfirm,
  onCancel,
}: ImageUrlDialogProps) {
  const [url, setUrl] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onConfirm(url.trim());
      setUrl("");
    }
  };

  const handleCancel = () => {
    setUrl("");
    onCancel();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4"
      onClick={handleCancel}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-md animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-gray hover:text-brand-black hover:bg-brand-light-gray transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-3 md:p-6 space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary-tint text-primary flex items-center justify-center shrink-0">
              <Link2 size={20} />
            </div>
            <div>
              <h3 className="font-display text-lg text-brand-black font-bold">
                Insert Image
              </h3>
              <p className="text-xs text-brand-gray mt-0.5">
                Paste a public image URL to embed in the editor
              </p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
                Image URL
              </label>
              <input
                type="url"
                autoFocus
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full h-11 bg-white border border-brand-border rounded-xl px-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={handleCancel}
                className="flex-1 h-11 border border-brand-border rounded-xl text-sm font-semibold text-brand-black hover:bg-brand-light-gray transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!url.trim()}
                className="flex-1 h-11 rounded-xl text-sm font-semibold text-white bg-brand-black hover:bg-primary transition-colors disabled:opacity-40"
              >
                Insert Image
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
