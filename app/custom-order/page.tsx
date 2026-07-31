"use client";

import React, { useState } from "react";
import Image from "next/image";
import useSWR from "swr";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import CustomSelect from "@/components/shared/CustomSelect";
import { useSettings } from "@/hooks/useSettings";
import { FaWhatsapp } from "react-icons/fa6";
import {
  Heart,
  UploadCloud,
  Plus,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  ShieldCheck,
  Package,
  ArrowRight,
} from "lucide-react";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const OCCASIONS = ["Birthday", "Anniversary", "Wedding", "Baby Shower", "Festival", "Just Because", "Other"];
const SIZES = ["Small", "Medium", "Large", "Not sure — suggest for me"];
const QUANTITIES = ["1", "2", "3", "4", "5", "More than 5"];

const COLOR_PRESETS = [
  { name: "Blush Pink", hex: "#EFB8C0" },
  { name: "Peach", hex: "#F5C9A4" },
  { name: "Butter", hex: "#F3DFA8" },
  { name: "Sage", hex: "#A9C79B" },
  { name: "Lavender", hex: "#B9A5D8" },
];

const MAX_IMAGES = 4;

const inputClass =
  "w-full h-11 bg-brand-light-gray/40 border border-brand-border rounded-xl px-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary transition-shadow";
const textareaClass =
  "w-full bg-brand-light-gray/40 border border-brand-border rounded-xl p-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary transition-shadow resize-none";
const labelClass = "text-[11px] font-bold text-brand-black uppercase tracking-wider block";

/* Section title in the reference style: "TELL US YOUR IDEA ♡" */
const PanelTitle = ({ children }: { children: React.ReactNode }) => (
  <h2 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-primary-text">
    {children}
    <Heart size={13} className="text-primary fill-primary/40" aria-hidden />
  </h2>
);

/* Numbered step with the connecting timeline rail */
const Step = ({
  number,
  title,
  isLast = false,
  children,
}: {
  number: string;
  title: string;
  isLast?: boolean;
  children: React.ReactNode;
}) => (
  <div className="relative flex gap-4">
    {!isLast && <span className="absolute left-4 top-9 bottom-0 w-px bg-primary/20" aria-hidden />}
    <div className="relative z-10 w-8 h-8 rounded-full bg-primary-tint border border-primary/40 text-primary-text text-[11px] font-bold flex items-center justify-center shrink-0">
      {number}
    </div>
    <div className={`flex-1 min-w-0 ${isLast ? "" : "pb-8"}`}>
      <h3 className="font-semibold text-brand-black text-sm pt-1.5 mb-4">{title}</h3>
      {children}
    </div>
  </div>
);

type Cat = { _id: string; name: string; image?: string };

export default function CustomOrderPage() {
  const { settings } = useSettings();
  const { data: categoriesData } = useSWR("/api/categories", fetcher);
  const categories: Cat[] = Array.isArray(categoriesData) ? categoriesData : [];

  const whatsapp = (settings.contact_whatsapp || "+91 9442379832").replace(/[^\d+]/g, "");
  const whatsappUrl = `https://wa.me/${whatsapp}?text=${encodeURIComponent(
    "Hi Lara's Pinnal! I'd like to place a custom order."
  )}`;

  const [form, setForm] = useState({
    category: "",
    occasion: "",
    size: "",
    quantity: "1",
    personalization: "",
    requirements: "",
    date: "",
    cityPin: "",
    notes: "",
    name: "",
    phone: "",
    email: "",
  });
  const [colors, setColors] = useState<string[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  /* For CustomSelect, which passes the value directly instead of an event */
  const setValue = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const selectedCategory = categories.find((c) => c.name === form.category);

  const toggleColor = (name: string) =>
    setColors((prev) => (prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]));

  const addCustomColor = (hex: string) => {
    const label = `Custom ${hex.toUpperCase()}`;
    setColors((prev) => (prev.includes(label) ? prev : [...prev, label]));
  };

  const uploadFiles = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, MAX_IMAGES - images.length);
    if (list.length === 0) return;
    setUploading(true);
    try {
      for (const file of list) {
        if (!file.type.startsWith("image/")) continue;
        if (file.size > 5 * 1024 * 1024) {
          setErrorMessage("Each image must be under 5 MB.");
          setStatus("error");
          continue;
        }
        const body = new FormData();
        body.append("file", file);
        const res = await fetch("/api/customer-upload", { method: "POST", body });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Upload failed");
        setImages((prev) => (prev.length < MAX_IMAGES ? [...prev, data.url] : prev));
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload image. Please try again.");
      setStatus("error");
    } finally {
      setUploading(false);
    }
  };

  const removeImage = (url: string) => {
    setImages((prev) => prev.filter((u) => u !== url));
    // Best-effort ImageKit cleanup — UI never blocks on it
    fetch("/api/customer-upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).catch(() => {});
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // CustomSelect has no native `required`, so validate the category here
    if (!form.category) {
      setErrorMessage("Please select a product / category for your custom order.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    try {
      const res = await fetch("/api/custom-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          category: form.category,
          categoryImage: selectedCategory?.image || "",
          occasion: form.occasion,
          colors,
          size: form.size,
          quantity: form.quantity,
          personalization: form.personalization,
          requirements: form.requirements,
          date: form.date,
          cityPin: form.cityPin,
          notes: form.notes,
          images,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else {
        setErrorMessage(data.error || "Failed to send your request. Please try again.");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 md:py-16">
          {/* Page intro */}
          <div className="max-w-2xl mx-auto text-center mb-10">
            <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-primary">
              Custom Made · Just For You
            </p>
            <h1 className="font-display text-3xl md:text-4xl text-brand-black tracking-wide uppercase mt-3">
              Design Your Custom Order
            </h1>
            <p className="text-sm font-medium text-brand-gray mt-2">
              Tell us your idea and we&apos;ll handcraft something uniquely yours.
            </p>
          </div>

          {status === "success" ? (
            <div className="max-w-lg mx-auto bg-white rounded-3xl border border-brand-border shadow-card p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-primary-tint text-primary rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 size={32} />
              </div>
              <h3 className="text-2xl font-display uppercase tracking-wide text-brand-black">Request Received!</h3>
              <p className="text-sm text-brand-gray">
                Thank you! We&apos;ll review your idea and get back to you within 24 hours with a design plan and price.
              </p>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[#25D366] text-white font-bold uppercase tracking-wider text-xs rounded-xl hover:opacity-90 transition-opacity"
              >
                <FaWhatsapp size={16} /> Continue on WhatsApp
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 items-start">
              {/* ============ LEFT — THE FORM ============ */}
              <div className="bg-white rounded-3xl border border-brand-border shadow-card p-5 sm:p-8">
                <PanelTitle>Tell Us Your Idea</PanelTitle>

                <form id="custom-order-form" onSubmit={handleSubmit} className="mt-8">
                  <Step number="01" title="What would you like?">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={labelClass}>
                          Product / Category <span className="text-secondary">*</span>
                        </label>
                        <CustomSelect
                          value={form.category}
                          onChange={setValue("category")}
                          placeholder="Select a category"
                          options={[
                            ...categories.map((c) => ({ label: c.name, value: c.name })),
                            { label: "Something else", value: "Something else" },
                          ]}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>Occasion</label>
                        <CustomSelect
                          value={form.occasion}
                          onChange={setValue("occasion")}
                          placeholder="Select occasion"
                          options={OCCASIONS.map((o) => ({ label: o, value: o }))}
                        />
                      </div>
                    </div>
                  </Step>

                  <Step number="02" title="Make it yours">
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className={labelClass}>Preferred Colors</label>
                          <div className="flex items-center gap-2 pt-1 flex-wrap">
                            {COLOR_PRESETS.map((c) => (
                              <button
                                key={c.name}
                                type="button"
                                onClick={() => toggleColor(c.name)}
                                title={c.name}
                                aria-label={c.name}
                                aria-pressed={colors.includes(c.name)}
                                className={`w-7 h-7 rounded-full border-2 transition-all ${
                                  colors.includes(c.name)
                                    ? "border-primary scale-110 shadow-sm"
                                    : "border-white hover:scale-105"
                                }`}
                                style={{ backgroundColor: c.hex }}
                              />
                            ))}
                            <label
                              className="w-7 h-7 rounded-full border border-dashed border-brand-gray/50 bg-white flex items-center justify-center text-brand-gray cursor-pointer hover:border-primary hover:text-primary transition-colors"
                              title="Add a custom color"
                            >
                              <Plus size={13} />
                              <input
                                type="color"
                                onChange={(e) => addCustomColor(e.target.value)}
                                className="sr-only"
                                aria-label="Pick a custom color"
                              />
                            </label>
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Size</label>
                          <CustomSelect
                            value={form.size}
                            onChange={setValue("size")}
                            placeholder="Select size"
                            options={SIZES.map((s) => ({ label: s, value: s }))}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Quantity</label>
                          <CustomSelect
                            value={form.quantity}
                            onChange={setValue("quantity")}
                            options={QUANTITIES.map((q) => ({ label: q, value: q }))}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className={labelClass}>Personalization (Name / Text)</label>
                          <textarea
                            rows={2}
                            value={form.personalization}
                            onChange={set("personalization")}
                            placeholder="e.g. Happy Birthday, Best Mom, Anbu ❤️"
                            className={textareaClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Special Requirements</label>
                          <textarea
                            rows={2}
                            value={form.requirements}
                            onChange={set("requirements")}
                            placeholder="Tell us any special requests…"
                            className={textareaClass}
                          />
                        </div>
                      </div>
                    </div>
                  </Step>

                  <Step number="03" title="Show us your idea (Upload Inspiration)">
                    <div className="flex flex-wrap gap-3">
                      <div
                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                        onDragLeave={() => setDragOver(false)}
                        onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files); }}
                        className={`relative flex-1 min-w-52 min-h-28 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 px-4 py-5 text-center transition-colors ${
                          dragOver ? "border-primary bg-primary-tint/60" : "border-brand-border bg-brand-light-gray/40"
                        }`}
                      >
                        <UploadCloud size={22} className="text-brand-gray" />
                        <p className="text-xs font-semibold text-brand-black">Drag &amp; drop images here</p>
                        <p className="text-[11px] text-brand-gray">or click to browse · up to {MAX_IMAGES} images</p>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/avif"
                          multiple
                          disabled={uploading || images.length >= MAX_IMAGES}
                          onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ""; }}
                          className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          aria-label="Upload inspiration images"
                        />
                        {uploading && (
                          <span className="absolute inset-0 bg-white/70 rounded-2xl flex items-center justify-center">
                            <Loader2 size={20} className="animate-spin text-primary" />
                          </span>
                        )}
                      </div>

                      {images.map((url) => (
                        <div key={url} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-brand-border bg-white">
                          <Image src={url} alt="Inspiration reference" fill sizes="96px" className="object-cover" />
                          <button
                            type="button"
                            onClick={() => removeImage(url)}
                            aria-label="Remove image"
                            className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80 transition-colors"
                          >
                            <X size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </Step>

                  <Step number="04" title="When do you need it?">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className={labelClass}>Preferred Delivery Date</label>
                        <input
                          type="date"
                          value={form.date}
                          onChange={set("date")}
                          min={new Date().toISOString().split("T")[0]}
                          className={inputClass}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className={labelClass}>City / PIN Code</label>
                        <input
                          type="text"
                          value={form.cityPin}
                          onChange={set("cityPin")}
                          placeholder="Enter your city or PIN code"
                          className={inputClass}
                        />
                      </div>
                    </div>
                  </Step>

                  <Step number="05" title="Tell us more" isLast>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className={labelClass}>Additional Notes</label>
                        <textarea
                          rows={3}
                          value={form.notes}
                          onChange={set("notes")}
                          placeholder="Any other details you'd like to add…"
                          className={textareaClass}
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-1.5">
                          <label className={labelClass}>
                            Your Name <span className="text-secondary">*</span>
                          </label>
                          <input required type="text" value={form.name} onChange={set("name")} placeholder="Enter your name" className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>
                            Phone / WhatsApp <span className="text-secondary">*</span>
                          </label>
                          <input required type="tel" value={form.phone} onChange={set("phone")} placeholder="Enter your number" className={inputClass} />
                        </div>
                        <div className="space-y-1.5">
                          <label className={labelClass}>Email</label>
                          <input type="email" value={form.email} onChange={set("email")} placeholder="Enter your email" className={inputClass} />
                        </div>
                      </div>

                      {status === "error" && (
                        <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 rounded-xl flex items-start gap-3">
                          <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                          <span className="font-medium">{errorMessage}</span>
                        </div>
                      )}

                      {/* Mobile-only submit — the summary panel holds it on desktop */}
                      <button
                        type="submit"
                        disabled={status === "loading" || uploading}
                        className="lg:hidden w-full h-12 bg-primary text-white font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-primary-hover disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
                      >
                        {status === "loading" ? (
                          <><Loader2 size={16} className="animate-spin" /> Sending…</>
                        ) : (
                          <>Submit Custom Request <ArrowRight size={15} /></>
                        )}
                      </button>
                    </div>
                  </Step>
                </form>
              </div>

              {/* ============ RIGHT — LIVE SUMMARY ============ */}
              <aside className="bg-white rounded-3xl border border-brand-border shadow-card p-5 sm:p-6 lg:sticky lg:top-24">
                <PanelTitle>Your Custom Creation</PanelTitle>

                <div className="mt-6 space-y-5">
                  {/* Product */}
                  <div className="flex items-center gap-3">
                    {selectedCategory?.image ? (
                      <div className="relative w-16 h-16 rounded-2xl overflow-hidden border border-brand-border shrink-0">
                        <Image src={selectedCategory.image} alt={selectedCategory.name} fill sizes="64px" className="object-cover" />
                      </div>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-primary-tint text-primary-text flex items-center justify-center shrink-0">
                        <Package size={22} />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-brand-black text-sm truncate">
                        {form.category || "Pick a product to begin"}
                      </p>
                      {form.occasion && <p className="text-xs text-brand-gray mt-0.5">{form.occasion}</p>}
                    </div>
                  </div>

                  {/* Colors */}
                  {colors.length > 0 && (
                    <div className="space-y-1.5">
                      <p className={labelClass}>Colors</p>
                      <div className="flex items-center gap-2 flex-wrap">
                        {colors.map((name) => {
                          const preset = COLOR_PRESETS.find((c) => c.name === name);
                          const hex = preset?.hex || name.replace("Custom ", "");
                          return <span key={name} className="w-5 h-5 rounded-full border border-white shadow-xs" style={{ backgroundColor: hex }} title={name} />;
                        })}
                        <span className="text-xs text-brand-gray">{colors.join(" · ")}</span>
                      </div>
                    </div>
                  )}

                  {/* Size & quantity */}
                  <div className="space-y-1.5">
                    <p className={labelClass}>Quantity</p>
                    <p className="text-sm text-brand-black">{form.quantity}{form.size ? ` · ${form.size}` : ""}</p>
                  </div>

                  {/* Personalization */}
                  {form.personalization && (
                    <div className="space-y-1.5">
                      <p className={labelClass}>Personalization</p>
                      <p className="text-sm text-brand-black wrap-break-word">{form.personalization}</p>
                    </div>
                  )}

                  {/* Reference images */}
                  {images.length > 0 && (
                    <div className="space-y-1.5">
                      <p className={labelClass}>Reference Images</p>
                      <div className="flex gap-2 flex-wrap">
                        {images.map((url) => (
                          <div key={url} className="relative w-14 h-14 rounded-xl overflow-hidden border border-brand-border">
                            <Image src={url} alt="Reference" fill sizes="56px" className="object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Date */}
                  {form.date && (
                    <div className="space-y-1.5">
                      <p className={labelClass}>Preferred Date</p>
                      <p className="text-sm text-brand-black flex items-center gap-1.5">
                        <CalendarDays size={14} className="text-brand-gray" />
                        {new Date(form.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  )}

                  <div className="border-t border-brand-border/70 pt-4 space-y-1">
                    <p className="font-bold text-brand-black text-sm">Estimated Price</p>
                    <p className="text-xs text-brand-gray">Confirmed after reviewing your request</p>
                  </div>

                  <button
                    type="submit"
                    form="custom-order-form"
                    disabled={status === "loading" || uploading}
                    className="hidden lg:flex w-full h-12 bg-primary text-white font-bold uppercase tracking-wider text-xs rounded-xl hover:bg-primary-hover disabled:opacity-60 transition-colors items-center justify-center gap-2"
                  >
                    {status === "loading" ? (
                      <><Loader2 size={16} className="animate-spin" /> Sending…</>
                    ) : (
                      <>Submit Custom Request <ArrowRight size={15} /></>
                    )}
                  </button>

                  <p className="flex items-center justify-center gap-1.5 text-xs text-brand-gray">
                    <ShieldCheck size={14} className="text-primary" />
                    We&apos;ll get back to you within 24 hours
                  </p>
                </div>
              </aside>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
