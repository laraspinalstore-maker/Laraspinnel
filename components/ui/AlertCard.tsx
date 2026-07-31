"use client";

import React, { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";

interface AlertCardProps {
  title?: string;
  message: string;
  onClose: () => void;
  /** Label for the dismiss button. */
  actionLabel?: string;
}

/**
 * Branded replacement for the native `alert()` dialog — same blocking,
 * acknowledge-to-dismiss contract, but styled like the rest of the store.
 * Renders nothing when `message` is empty, so callers can keep it mounted
 * and drive it with a `string | null` state value.
 */
export default function AlertCard({
  title = "Oops!",
  message,
  onClose,
  actionLabel = "Okay, got it",
}: AlertCardProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!message) return;
    // Mirror the native dialog: focus lands on the acknowledge button and
    // Escape dismisses.
    buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className="fixed inset-0 z-100 flex items-center justify-center p-4 animate-in fade-in duration-200"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="alert-card-title"
      aria-describedby="alert-card-message"
    >
      {/* Backdrop — click to dismiss, same as pressing OK */}
      <button
        type="button"
        aria-label="Dismiss alert"
        onClick={onClose}
        className="absolute inset-0 bg-brand-black/40 backdrop-blur-[2px] cursor-default"
        tabIndex={-1}
      />

      <div className="relative w-full max-w-sm bg-white rounded-2xl border border-brand-border shadow-xl p-6 space-y-4 animate-in zoom-in-95 fade-in duration-200">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-1.5 rounded-full text-brand-gray hover:text-brand-black hover:bg-brand-light-gray transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black"
        >
          <X size={16} />
        </button>

        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-rose-text/10 border border-rose-text/20 flex items-center justify-center">
            <AlertTriangle size={22} className="text-rose-text" />
          </div>
          <h2
            id="alert-card-title"
            className="font-display text-xl text-brand-black uppercase tracking-wide"
          >
            {title}
          </h2>
          <p id="alert-card-message" className="text-sm text-brand-gray leading-relaxed">
            {message}
          </p>
        </div>

        <button
          ref={buttonRef}
          type="button"
          onClick={onClose}
          className="w-full bg-brand-black hover:bg-primary text-white text-sm font-bold py-3 rounded-full transition-all duration-200 shadow-sm hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black focus-visible:ring-offset-2"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  );
}
