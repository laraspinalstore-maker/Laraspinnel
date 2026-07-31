"use client";

import React, { useState, useEffect } from "react";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { Save, Loader2, AlertCircle, CheckCircle, RotateCcw, Info, Mail, PackageCheck } from "lucide-react";
import {
  DEFAULT_EMAIL_SUBJECT_TEMPLATE,
  DEFAULT_EMAIL_INTRO_TEMPLATE,
  DEFAULT_EMAIL_FOOTER_TEMPLATE,
  EMAIL_TEMPLATE_PLACEHOLDERS,
  DEFAULT_STATUS_EMAIL_SUBJECT_TEMPLATE,
  DEFAULT_STATUS_EMAIL_INTRO_TEMPLATE,
  DEFAULT_STATUS_EMAIL_FOOTER_TEMPLATE,
  STATUS_EMAIL_TEMPLATE_PLACEHOLDERS,
} from "@/lib/emailTemplate";
import { getOrderConfirmationEmail } from "@/lib/email/customerConfirmation";
import { getOrderStatusUpdateEmail } from "@/lib/email/customerStatusUpdate";

const SAMPLE_ORDER = {
  orderNumber: "LP-10234",
  customerName: "Priya",
  address: "12 Mettu Street, Therkunam",
  city: "Villupuram",
  pincode: "605602",
  totalAmount: 2698,
  items: [
    { name: "Crochet Tulip Desk Lamp", quantity: 1, price: 1499 },
    { name: "Daisy Flower Crochet Tote", quantity: 1, price: 1199, customText: "Change ribbon to pink" },
  ],
};

type Tab = "confirmation" | "status";

export default function AdminOrderEmailSettingsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("confirmation");
  const [shopName, setShopName] = useState("Laraspinnel");

  // Order confirmation template state
  const [confSubject, setConfSubject] = useState("");
  const [confIntro, setConfIntro] = useState("");
  const [confFooter, setConfFooter] = useState("");

  // Status update template state
  const [statusSubject, setStatusSubject] = useState("");
  const [statusIntro, setStatusIntro] = useState("");
  const [statusFooter, setStatusFooter] = useState("");

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
          setShopName(data.farm_name || "Laraspinnel");

          setConfSubject(data.email_order_subject || DEFAULT_EMAIL_SUBJECT_TEMPLATE);
          setConfIntro(data.email_order_intro || DEFAULT_EMAIL_INTRO_TEMPLATE);
          setConfFooter(data.email_order_footer || DEFAULT_EMAIL_FOOTER_TEMPLATE);

          setStatusSubject(data.email_status_subject || DEFAULT_STATUS_EMAIL_SUBJECT_TEMPLATE);
          setStatusIntro(data.email_status_intro || DEFAULT_STATUS_EMAIL_INTRO_TEMPLATE);
          setStatusFooter(data.email_status_footer || DEFAULT_STATUS_EMAIL_FOOTER_TEMPLATE);
        } else {
          setError("Failed to load settings.");
        }
      } catch (err) {
        setError("Failed to load settings.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleReset = () => {
    if (activeTab === "confirmation") {
      setConfSubject(DEFAULT_EMAIL_SUBJECT_TEMPLATE);
      setConfIntro(DEFAULT_EMAIL_INTRO_TEMPLATE);
      setConfFooter(DEFAULT_EMAIL_FOOTER_TEMPLATE);
    } else {
      setStatusSubject(DEFAULT_STATUS_EMAIL_SUBJECT_TEMPLATE);
      setStatusIntro(DEFAULT_STATUS_EMAIL_INTRO_TEMPLATE);
      setStatusFooter(DEFAULT_STATUS_EMAIL_FOOTER_TEMPLATE);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      const body =
        activeTab === "confirmation"
          ? {
              email_order_subject: confSubject,
              email_order_intro: confIntro,
              email_order_footer: confFooter,
            }
          : {
              email_status_subject: statusSubject,
              email_status_intro: statusIntro,
              email_status_footer: statusFooter,
            };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save the email template.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmationPreview = getOrderConfirmationEmail(SAMPLE_ORDER, {
    shopName,
    subjectTemplate: confSubject,
    introTemplate: confIntro,
    footerTemplate: confFooter,
  });

  const statusPreview = getOrderStatusUpdateEmail(
    { orderNumber: SAMPLE_ORDER.orderNumber, customerName: SAMPLE_ORDER.customerName, status: "confirmed" },
    {
      shopName,
      subjectTemplate: statusSubject,
      introTemplate: statusIntro,
      footerTemplate: statusFooter,
    }
  );

  const preview = activeTab === "confirmation" ? confirmationPreview : statusPreview;
  const placeholders = activeTab === "confirmation" ? EMAIL_TEMPLATE_PLACEHOLDERS : STATUS_EMAIL_TEMPLATE_PLACEHOLDERS;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminTopbar title="Order Email" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full max-w-none animate-in fade-in">
        <p className="text-sm text-brand-gray max-w-2xl">
          Customize the emails sent to customers who provide an email address at checkout. Only the text below is editable — the layout is generated automatically so it can't be broken by a typo.
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
            <span className="font-medium">Email template saved!</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-brand-border overflow-x-auto bg-white rounded-t-2xl border border-brand-border">
          <button
            onClick={() => setActiveTab("confirmation")}
            className={`flex items-center gap-2 px-4 md:px-6 py-4 text-sm font-semibold border-b-2 outline-none whitespace-nowrap transition-colors ${
              activeTab === "confirmation"
                ? "border-primary text-primary"
                : "border-transparent text-brand-gray hover:text-brand-black"
            }`}
          >
            <Mail size={16} />
            <span>Order Confirmation</span>
          </button>
          <button
            onClick={() => setActiveTab("status")}
            className={`flex items-center gap-2 px-4 md:px-6 py-4 text-sm font-semibold border-b-2 outline-none whitespace-nowrap transition-colors ${
              activeTab === "status"
                ? "border-primary text-primary"
                : "border-transparent text-brand-gray hover:text-brand-black"
            }`}
          >
            <PackageCheck size={16} />
            <span>Status Update</span>
          </button>
        </div>

        {isLoading ? (
          <div className="bg-white border border-brand-border rounded-2xl shadow-card p-12 text-center text-brand-gray flex flex-col items-center gap-3">
            <Loader2 className="animate-spin text-primary" size={40} />
            <p className="text-sm font-semibold">Loading...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Editor Column */}
            <div className="lg:col-span-6 bg-white border border-brand-border rounded-2xl shadow-card p-5 md:p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider">
                  {activeTab === "confirmation" ? "Confirmation Email Content" : "Status Update Email Content"}
                </h3>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gray hover:text-primary transition-colors"
                >
                  <RotateCcw size={13} /> Reset to Default
                </button>
              </div>

              {activeTab === "confirmation" ? (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Subject Line</label>
                    <input
                      type="text"
                      value={confSubject}
                      onChange={(e) => setConfSubject(e.target.value)}
                      className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Intro Message</label>
                    <textarea
                      rows={4}
                      value={confIntro}
                      onChange={(e) => setConfIntro(e.target.value)}
                      className="w-full p-3.5 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Footer / Payment Note</label>
                    <textarea
                      rows={5}
                      value={confFooter}
                      onChange={(e) => setConfFooter(e.target.value)}
                      className="w-full p-3.5 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Subject Line</label>
                    <input
                      type="text"
                      value={statusSubject}
                      onChange={(e) => setStatusSubject(e.target.value)}
                      className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Intro Message</label>
                    <textarea
                      rows={4}
                      value={statusIntro}
                      onChange={(e) => setStatusIntro(e.target.value)}
                      className="w-full p-3.5 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Footer Message</label>
                    <textarea
                      rows={5}
                      value={statusFooter}
                      onChange={(e) => setStatusFooter(e.target.value)}
                      className="w-full p-3.5 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                    />
                  </div>
                </>
              )}

              {/* Placeholder reference */}
              <div className="bg-primary-tint/40 border border-primary/20 rounded-xl p-4 space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-primary-text uppercase tracking-wide">
                  <Info size={13} /> Available Placeholders
                </p>
                <div className="space-y-1.5">
                  {placeholders.map((p) => (
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
            <div className="lg:col-span-6 lg:sticky lg:top-6 space-y-3">
              <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider flex items-center gap-2">
                <Mail size={16} className="text-primary" /> Live Preview
              </h3>
              <div className="bg-brand-light-gray/30 border border-brand-border rounded-2xl p-3 space-y-2">
                <div className="bg-white border border-brand-border rounded-lg px-3 py-2 text-xs">
                  <span className="text-brand-gray">Subject: </span>
                  <span className="font-semibold text-brand-black">{preview.subject}</span>
                </div>
                <div className="border border-brand-border rounded-xl overflow-hidden bg-white">
                  <iframe
                    title="Email preview"
                    srcDoc={preview.html}
                    className="w-full"
                    style={{ height: 640, border: "none" }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-brand-gray px-1">
                Preview uses sample order data and reflects exactly what the customer will receive.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
