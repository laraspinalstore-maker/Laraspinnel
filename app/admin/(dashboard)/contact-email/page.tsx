"use client";

import React, { useState, useEffect } from "react";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { Save, Loader2, AlertCircle, CheckCircle, RotateCcw, Info, Mail } from "lucide-react";
import {
  DEFAULT_CONTACT_CONFIRMATION_SUBJECT_TEMPLATE,
  DEFAULT_CONTACT_CONFIRMATION_INTRO_TEMPLATE,
  DEFAULT_CONTACT_CONFIRMATION_FOOTER_TEMPLATE,
  CONTACT_CONFIRMATION_PLACEHOLDERS,
} from "@/lib/emailTemplate";
import { getContactConfirmationEmail } from "@/lib/email/customerContactConfirmation";

const SAMPLE_CONTACT = {
  name: "Priya",
  subject: "Question about custom bouquet colors",
  message: "Hi, I wanted to ask if the tulip bouquet can be made in a darker shade of red. Thank you!",
};

export default function AdminContactEmailSettingsPage() {
  const [subjectTemplate, setSubjectTemplate] = useState("");
  const [introTemplate, setIntroTemplate] = useState("");
  const [footerTemplate, setFooterTemplate] = useState("");
  const [shopName, setShopName] = useState("Laraspinnel");
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
          setSubjectTemplate(data.email_contact_subject || DEFAULT_CONTACT_CONFIRMATION_SUBJECT_TEMPLATE);
          setIntroTemplate(data.email_contact_intro || DEFAULT_CONTACT_CONFIRMATION_INTRO_TEMPLATE);
          setFooterTemplate(data.email_contact_footer || DEFAULT_CONTACT_CONFIRMATION_FOOTER_TEMPLATE);
          setShopName(data.farm_name || "Laraspinnel");
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

  const handleReset = () => {
    setSubjectTemplate(DEFAULT_CONTACT_CONFIRMATION_SUBJECT_TEMPLATE);
    setIntroTemplate(DEFAULT_CONTACT_CONFIRMATION_INTRO_TEMPLATE);
    setFooterTemplate(DEFAULT_CONTACT_CONFIRMATION_FOOTER_TEMPLATE);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_contact_subject: subjectTemplate,
          email_contact_intro: introTemplate,
          email_contact_footer: footerTemplate,
        }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save the email template.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const preview = getContactConfirmationEmail(SAMPLE_CONTACT, {
    shopName,
    subjectTemplate,
    introTemplate,
    footerTemplate,
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminTopbar title="Contact Email" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full max-w-none animate-in fade-in">
        <p className="text-sm text-brand-gray max-w-2xl">
          Customize the confirmation email sent to anyone who submits the public Contact Us form and provides an email address. Only the text below is editable — the layout is generated automatically.
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
                <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider">Email Content</h3>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-gray hover:text-primary transition-colors"
                >
                  <RotateCcw size={13} /> Reset to Default
                </button>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Subject Line</label>
                <input
                  type="text"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Intro Message</label>
                <textarea
                  rows={4}
                  value={introTemplate}
                  onChange={(e) => setIntroTemplate(e.target.value)}
                  className="w-full p-3.5 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Footer Message</label>
                <textarea
                  rows={5}
                  value={footerTemplate}
                  onChange={(e) => setFooterTemplate(e.target.value)}
                  className="w-full p-3.5 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm font-mono outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>

              {/* Placeholder reference */}
              <div className="bg-primary-tint/40 border border-primary/20 rounded-xl p-4 space-y-2">
                <p className="flex items-center gap-1.5 text-xs font-bold text-primary-text uppercase tracking-wide">
                  <Info size={13} /> Available Placeholders
                </p>
                <div className="space-y-1.5">
                  {CONTACT_CONFIRMATION_PLACEHOLDERS.map((p) => (
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
                    style={{ height: 500, border: "none" }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-brand-gray px-1">
                Preview uses sample submission data and reflects exactly what the sender will receive.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
