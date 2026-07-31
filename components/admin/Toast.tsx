"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";

type ToastVariant = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  title?: string;
  variant: ToastVariant;
}

interface ShowToastOptions {
  title?: string;
  variant?: ToastVariant;
  duration?: number;
}

interface ToastContextValue {
  showToast: (message: string, options?: ShowToastOptions) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}

const VARIANT_CONFIG: Record<
  ToastVariant,
  { icon: React.ReactNode; accent: string; ring: string; defaultTitle: string }
> = {
  success: {
    icon: <CheckCircle2 size={18} className="text-primary" />,
    accent: "bg-primary",
    ring: "border-primary/30",
    defaultTitle: "Success",
  },
  error: {
    icon: <AlertCircle size={18} className="text-red-600" />,
    accent: "bg-red-500",
    ring: "border-red-200",
    defaultTitle: "Something went wrong",
  },
  info: {
    icon: <Info size={18} className="text-blue-600" />,
    accent: "bg-blue-500",
    ring: "border-blue-200",
    defaultTitle: "Notice",
  },
};

function ToastCard({ toast, onDismiss }: { toast: ToastItem; onDismiss: (id: number) => void }) {
  const config = VARIANT_CONFIG[toast.variant];
  return (
    <div
      role="status"
      className={`relative flex items-start gap-3 w-full sm:w-80 bg-white border ${config.ring} rounded-xl shadow-hover overflow-hidden pl-4 pr-3 py-3 animate-in fade-in slide-in-from-right-4 duration-300`}
    >
      <span className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`} />
      <span className="shrink-0 mt-0.5">{config.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-brand-black">{toast.title || config.defaultTitle}</p>
        <p className="text-xs text-brand-gray mt-0.5 wrap-break-word">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="shrink-0 p-1 text-brand-gray hover:text-brand-black hover:bg-brand-light-gray rounded-md transition-colors"
      >
        <X size={15} />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, options?: ShowToastOptions) => {
    const id = Date.now() + Math.floor(Math.random() * 1000);
    const variant = options?.variant || "info";
    setToasts((prev) => [...prev, { id, message, title: options?.title, variant }]);

    const duration = options?.duration ?? 4000;
    if (duration > 0) {
      setTimeout(() => dismiss(id), duration);
    }
  }, [dismiss]);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  // Avoid rendering an empty fixed container.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2.5 w-[calc(100vw-2rem)] sm:w-auto pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastCard toast={toast} onDismiss={onDismiss} />
        </div>
      ))}
    </div>
  );
}
