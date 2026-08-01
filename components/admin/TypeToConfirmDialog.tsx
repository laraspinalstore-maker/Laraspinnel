"use client";

import React, { useState } from "react";
import { AlertTriangle, X } from "lucide-react";

interface TypeToConfirmDialogProps {
  isOpen: boolean;
  title?: string;
  message: string;
  /** The exact text the admin must type before the confirm button unlocks. */
  confirmWord: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

// Same visual language as ConfirmDialog, but for irreversible/high-stakes
// deletes (orders, products) — the admin must type the exact confirmation
// word before the delete button unlocks, so a stray click can't destroy data.
export default function TypeToConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message,
  confirmWord,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  isLoading = false,
}: TypeToConfirmDialogProps) {
  const [typedValue, setTypedValue] = useState("");

  // Reset the typed value each time the dialog opens for a (potentially new)
  // target. Compared during render rather than in an effect: an effect resets
  // after the dialog has already painted with the previous target's text still in
  // the box, and it is what `react-hooks/set-state-in-effect` flags.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  const openKey = isOpen ? confirmWord : null;
  if (openedFor !== openKey) {
    setOpenedFor(openKey);
    if (typedValue !== "") setTypedValue("");
  }

  if (!isOpen) return null;

  const isMatch = typedValue.trim() === confirmWord.trim() && confirmWord.trim().length > 0;

  const handleConfirm = () => {
    if (isMatch && !isLoading) onConfirm();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-4" onClick={onCancel}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Dialog Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-brand-border w-full max-w-sm animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-brand-gray hover:text-brand-black hover:bg-brand-light-gray transition-colors"
        >
          <X size={16} />
        </button>

        <div className="p-3 md:p-6 space-y-4">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-red-50 text-red-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="font-display text-lg text-brand-black font-bold">{title}</h3>
              <p className="text-sm text-brand-gray mt-1 leading-relaxed">{message}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-semibold text-brand-black block">
              Type <span className="font-mono font-bold text-red-600 select-all">{confirmWord}</span> to confirm
            </label>
            <input
              type="text"
              value={typedValue}
              onChange={(e) => setTypedValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirm();
              }}
              autoFocus
              autoComplete="off"
              placeholder={confirmWord}
              className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-red-500 transition-all"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              onClick={onCancel}
              className="flex-1 h-11 border border-brand-border rounded-xl text-sm font-semibold text-brand-black hover:bg-brand-light-gray transition-colors"
            >
              {cancelLabel}
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isMatch || isLoading}
              className="flex-1 h-11 rounded-xl text-sm font-semibold text-white transition-colors bg-red-600 hover:bg-red-700 disabled:bg-neutral-300 disabled:cursor-not-allowed"
            >
              {isLoading ? "Deleting..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
