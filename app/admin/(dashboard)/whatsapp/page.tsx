"use client";

import React, { useState, useEffect } from "react";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { Save, Loader2, AlertCircle, CheckCircle, RotateCcw, Info } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import {
  DEFAULT_WHATSAPP_ORDER_TEMPLATE,
  WHATSAPP_TEMPLATE_PLACEHOLDERS,
  renderWhatsAppTemplate,
} from "@/lib/whatsappTemplate";

const SAMPLE_DATA = {
  customerName: "Priya",
  shopName: "Lara's Pinnal",
  orderNumber: "LP-10234",
  items: [
    { name: "Crochet Tulip Desk Lamp", quantity: 1, price: 1499 },
    { name: "Daisy Flower Crochet Tote", quantity: 1, price: 1199, customText: "Change ribbon to pink" },
  ],
  totalAmount: 2698,
};

export default function AdminWhatsAppSettingsPage() {
  const [template, setTemplate] = useState("");
  const [shopName, setShopName] = useState("Lara's Pinnal");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/admin/settings");
        if (res.ok) {
          const data = await res.json();
          setTemplate(data.whatsapp_order_template || DEFAULT_WHATSAPP_ORDER_TEMPLATE);
          setShopName(data.farm_name || "Lara's Pinnal");
        } else {
          setError("Failed to load settings.");
        }
      } catch {
        setError("Failed to load settings.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ whatsapp_order_template: template }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save the message template.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const previewText = renderWhatsAppTemplate(template || DEFAULT_WHATSAPP_ORDER_TEMPLATE, {
    ...SAMPLE_DATA,
    shopName,
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminTopbar title="WhatsApp Message" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full max-w-none animate-in fade-in">
        <p className="text-sm text-brand-gray max-w-2xl">
          Customize the message sent to customers when you tap <span className="font-semibold text-brand-black">&quot;Message on WhatsApp&quot;</span> on an order&apos;s detail page — used to confirm payment before dispatch.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 md:p-4 rounded-xl flex items-start gap-3">
            <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-3 md:p-4 rounded-xl flex items-start gap-3">
            <CheckCircle size={18} className="shrink-0 text-green-600 mt-0.5" />
            <span className="font-medium">WhatsApp message template saved!</span>
          </div>
        )}

        {isLoading ? (
          <div className="bg-white border border-brand-border rounded-2xl shadow-card p-12 text-center text-brand-gray flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-sm font-semibold">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Editor Column */}
            <div className="lg:col-span-7 bg-white border border-brand-border rounded-2xl shadow-card p-5 md:p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider">Message Template</h3>
                <button
                  type="button"
                  onClick={() => setTemplate(DEFAULT_WHATSAPP_ORDER_TEMPLATE)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gray hover:text-primary transition-colors"
                >
                  <RotateCcw size={13} /> Reset to Default
                </button>
              </div>

              <textarea
                rows={16}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className="w-full p-3.5 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
              />

              {/* Placeholder reference */}
              <div className="bg-primary-tint/40 border border-primary/20 rounded-xl p-4 space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-primary-text uppercase tracking-wide">
                  <Info size={13} /> Available Placeholders
                </p>
                <div className="space-y-1.5">
                  {WHATSAPP_TEMPLATE_PLACEHOLDERS.map((p) => (
                    <div key={p.token} className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-2 text-xs">
                      <code className="font-mono font-bold text-primary-text bg-white/70 px-1.5 py-0.5 rounded border border-primary/20 w-fit">
                        {p.token}
                      </code>
                      <span className="text-brand-gray">{p.description}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="w-full inline-flex items-center justify-center gap-2 h-11 px-4 font-semibold text-sm rounded-xl bg-brand-black hover:bg-primary text-white transition-colors disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save size={16} /> Save Template
                  </>
                )}
              </button>
            </div>

            {/* Live Preview Column */}
            <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-3">
              <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider flex items-center gap-2">
                <FaWhatsapp className="text-[#25D366]" size={18} /> Live Preview
              </h3>
              <div className="bg-[#e5ddd5] rounded-2xl p-4 shadow-card">
                <div className="bg-white rounded-2xl rounded-tl-sm p-4 shadow-sm max-w-full">
                  <p className="text-sm text-brand-black whitespace-pre-wrap wrap-break-word leading-relaxed">
                    {previewText.split(/(\*[^*]+\*)/g).map((part, idx) =>
                      part.startsWith("*") && part.endsWith("*") && part.length > 1 ? (
                        <strong key={idx}>{part.slice(1, -1)}</strong>
                      ) : (
                        <React.Fragment key={idx}>{part}</React.Fragment>
                      )
                    )}
                  </p>
                </div>
              </div>
              <p className="text-[11px] text-brand-gray px-1">
                Preview uses sample order data. Text wrapped in *asterisks* renders bold on WhatsApp.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
