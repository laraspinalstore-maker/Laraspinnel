"use client";

import React, { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Star, BadgeCheck, CheckCheck, ArrowRight, MoreVertical, ShoppingBag, X, Send, Loader2, CheckCircle2, PenLine, Camera } from "lucide-react";
import useSWR from "swr";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type Bubble =
  | { kind: "in"; text: string; time: string }
  | { kind: "out"; text: string; time: string }
  | { kind: "photo"; src: string; alt: string; time: string };

type ChatReview = {
  id: string;
  name: string;
  location: string;
  rating: number;
  bubbles: Bubble[];
  product?: { name: string; image?: string };
  avatarUrl?: string;
  isDemo?: boolean;
};

/* Privacy: first name + last initial only ("Ramesh Kumar" -> "Ramesh K.") */
const displayName = (full: string) => {
  const parts = (full || "").trim().split(/\s+/);
  if (parts.length <= 1) return parts[0] || "Customer";
  return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
};

/* Bubble timestamps are staggered a few minutes apart from the review's real createdAt */
const timeAt = (iso: string | undefined, offsetMin: number) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  d.setMinutes(d.getMinutes() + offsetMin);
  return d.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" }).toUpperCase();
};

/* Replies come from the shop side, so they are ours to write — rotated per card */
const SHOP_REPLIES = [
  "We're so happy you loved it! ❤️ Thank you for your kind words and support ✨",
  "Thank you so much! 🥰 Every piece is made with lots of love — so glad it made you smile!",
  "This made our day! 🧶 Thank you for trusting Lara's Pinnal ✨",
];

const DEMO_PHOTO =
  "https://images.unsplash.com/photo-1596436889106-be35e843f974?w=600&auto=format&fit=crop&q=80";

/* Placeholder content shown ONLY while no approved reviews exist in the database.
   Clearly marked as sample stories in the UI — never shipped as real feedback. */
const DEMO_REVIEWS: ChatReview[] = [
  {
    id: "demo-1",
    name: "Ananya R.",
    location: "Chennai, TN",
    rating: 5,
    bubbles: [
      { kind: "in", text: "Hii! I received the bouquet today 😍 It's so pretty and delicate.", time: "10:42 AM" },
      { kind: "out", text: SHOP_REPLIES[0], time: "10:45 AM" },
      { kind: "photo", src: DEMO_PHOTO, alt: "Customer photo of a crochet rose bouquet", time: "10:46 AM" },
      { kind: "in", text: "It made my day extra special 🥹💖", time: "10:47 AM" },
    ],
    product: { name: "Crochet Rose Bouquet", image: DEMO_PHOTO },
    isDemo: true,
  },
  {
    id: "demo-2",
    name: "Priya M.",
    location: "Coimbatore, TN",
    rating: 5,
    bubbles: [
      { kind: "in", text: "The baby set arrived just in time for the shower 🥰", time: "4:38 PM" },
      { kind: "out", text: SHOP_REPLIES[1], time: "4:41 PM" },
      { kind: "in", text: "Everyone kept asking where I got it! So soft, and the packing was lovely 💛", time: "4:44 PM" },
    ],
    product: { name: "Baby Amigurumi Set" },
    isDemo: true,
  },
  {
    id: "demo-3",
    name: "Divya K.",
    location: "Madurai, TN",
    rating: 5,
    bubbles: [
      { kind: "in", text: "Got the keychains for my bridesmaids today!", time: "9:15 AM" },
      { kind: "out", text: SHOP_REPLIES[2], time: "9:18 AM" },
      { kind: "in", text: "Cutest return gifts ever 😍 Thank you for the quick delivery!", time: "9:20 AM" },
    ],
    product: { name: "Custom Crochet Keychains" },
    isDemo: true,
  },
];

/* Prompt from the shop side of the conversation */
const AskBubble = ({ children }: { children: React.ReactNode }) => (
  <div className="ml-auto max-w-[85%] bg-[#E8F4D8] rounded-2xl rounded-tr-sm px-3.5 py-2.5 shadow-xs">
    <p className="text-[13px] text-[#211A16] leading-relaxed">{children}</p>
  </div>
);

/* The customer's answer, typed inside a white incoming-style bubble */
const AnswerBubble = ({ children }: { children: React.ReactNode }) => (
  <div className="max-w-[85%] bg-white rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-xs space-y-1">
    {children}
  </div>
);

const fieldClass =
  "w-full bg-transparent text-[13px] text-[#211A16] placeholder-[#9A9188] outline-none py-1.5 border-b border-[#E8DED0] focus:border-[#147A52] transition-colors";

const AddReviewChatModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const [formData, setFormData] = useState({ name: "", location: "", goal: "", outcome: "", rating: 5, refId: "", avatarUrl: "", orderImageUrl: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [orderPhotoUploading, setOrderPhotoUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const orderPhotoInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const removeAvatar = (url: string) => {
    // Best-effort cleanup of the ImageKit file; UI never blocks on it
    fetch("/api/customer-upload", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    }).catch(() => {});
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Photo too large — maximum size is 5 MB.");
      setStatus("error");
      return;
    }
    setAvatarUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/customer-upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (formData.avatarUrl) removeAvatar(formData.avatarUrl);
      setFormData((prev) => ({ ...prev, avatarUrl: data.url }));
      if (status === "error") setStatus("idle");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload photo. Please try again.");
      setStatus("error");
    } finally {
      setAvatarUploading(false);
    }
  };

  /* Same upload flow as the avatar, but for the customer's photo of their order */
  const handleOrderPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage("Photo too large — maximum size is 5 MB.");
      setStatus("error");
      return;
    }
    setOrderPhotoUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/customer-upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      if (formData.orderImageUrl) removeAvatar(formData.orderImageUrl);
      setFormData((prev) => ({ ...prev, orderImageUrl: data.url }));
      if (status === "error") setStatus("idle");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload photo. Please try again.");
      setStatus("error");
    } finally {
      setOrderPhotoUploading(false);
    }
  };

  const handleClose = () => {
    // Don't leave orphaned uploads behind if the review was never sent
    if (status !== "success") {
      if (formData.avatarUrl) removeAvatar(formData.avatarUrl);
      if (formData.orderImageUrl) removeAvatar(formData.orderImageUrl);
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/testimonials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus("success");
      } else {
        setErrorMessage(data.error || "Failed to submit review");
        setStatus("error");
      }
    } catch {
      setErrorMessage("Network error. Please try again.");
      setStatus("error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md max-h-[90vh] flex flex-col bg-[#FBF7F0] rounded-3xl border border-[#E8DED0] shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {status === "success" ? (
          <div className="text-center px-8 py-12 space-y-4">
            <div className="w-16 h-16 bg-[#E8F4D8] text-[#147A52] rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-2xl font-display uppercase tracking-wide text-[#211A16]">Thank You!</h3>
            <p className="text-sm text-[#9A9188]">
              Your review has been sent and will appear here once it&apos;s approved.
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-8 h-11 bg-[#147A52] text-white rounded-full font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-opacity"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col min-h-0">
            {/* Header — mirrors the review card header; avatar doubles as an optional photo picker */}
            <div className="flex items-center gap-3 px-5 py-4 bg-[#FFFDF9] border-b border-[#E8DED0]/60 shrink-0">
              <div className="relative shrink-0">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  title="Add your photo (optional)"
                  aria-label="Add your photo (optional)"
                  className="relative w-11 h-11 rounded-full overflow-hidden bg-[#E8F4D8] text-[#147A52] font-bold text-base flex items-center justify-center border border-[#147A52]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#147A52]"
                >
                  {avatarUploading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : formData.avatarUrl ? (
                    <Image src={formData.avatarUrl} alt="Your photo" fill sizes="44px" className="object-cover" />
                  ) : formData.name.trim() ? (
                    formData.name.trim().charAt(0).toUpperCase()
                  ) : (
                    <PenLine size={16} />
                  )}
                </button>
                <span className="absolute -bottom-0.5 -right-0.5 w-4.5 h-4.5 rounded-full bg-[#147A52] text-white flex items-center justify-center border-2 border-[#FFFDF9] pointer-events-none">
                  <Camera size={9} />
                </span>
                {formData.avatarUrl && !avatarUploading && (
                  <button
                    type="button"
                    onClick={() => {
                      removeAvatar(formData.avatarUrl);
                      setFormData((prev) => ({ ...prev, avatarUrl: "" }));
                    }}
                    aria-label="Remove photo"
                    className="absolute -top-1 -right-1 w-4.5 h-4.5 rounded-full bg-[#211A16] text-white flex items-center justify-center border-2 border-[#FFFDF9]"
                  >
                    <X size={9} />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-[#211A16] text-sm truncate">
                  {formData.name.trim() || "Write a Review"}
                </h3>
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#147A52]">
                  Verified via Order Ref ID
                  <BadgeCheck size={13} className="fill-[#147A52] text-white" />
                </span>
              </div>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Close"
                className="ml-auto p-2 rounded-full text-[#9A9188] hover:text-[#211A16] hover:bg-[#F7F2E9] transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>

            {/* Conversation body — the form as a chat */}
            <div
              className="flex-1 min-h-0 overflow-y-auto paper-texture px-4 py-5 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none"
              style={{ backgroundColor: "#F7F2E9" }}
            >
              <AskBubble>Hi! 👋 How was your experience with Lara&apos;s Pinnal?</AskBubble>
              <AnswerBubble>
                <div className="flex gap-1.5 py-1" role="radiogroup" aria-label="Rating">
                  {[...Array(5)].map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: i + 1 })}
                      aria-label={`${i + 1} star${i ? "s" : ""}`}
                      className="focus:outline-none transition-transform active:scale-90"
                    >
                      <Star size={24} className={i < formData.rating ? "text-[#D99A27] fill-[#D99A27]" : "text-[#9A9188]/40"} />
                    </button>
                  ))}
                </div>
              </AnswerBubble>

              <AskBubble>Lovely! May we know your name &amp; city?</AskBubble>
              <AnswerBubble>
                <input
                  required
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className={fieldClass}
                  placeholder="Your name"
                  aria-label="Name"
                />
                <input
                  required
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className={fieldClass}
                  placeholder="City (e.g. Villupuram, TN)"
                  aria-label="Location"
                />
              </AnswerBubble>

              <AskBubble>Your Order Ref ID, please? It&apos;s in your booking SMS/email 📦</AskBubble>
              <AnswerBubble>
                <input
                  required
                  type="text"
                  value={formData.refId}
                  onChange={(e) => setFormData({ ...formData, refId: e.target.value })}
                  className={`${fieldClass} uppercase`}
                  placeholder="e.g. BKG-12345"
                  aria-label="Order Ref ID"
                />
              </AnswerBubble>

              <AskBubble>What did you order from us?</AskBubble>
              <AnswerBubble>
                <textarea
                  required
                  rows={2}
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  className={`${fieldClass} resize-none`}
                  placeholder="e.g. A custom crochet flower bouquet"
                  aria-label="What you ordered"
                />
              </AnswerBubble>

              <AskBubble>And how did it turn out? Tell us everything 😍</AskBubble>
              <AnswerBubble>
                <textarea
                  required
                  rows={3}
                  value={formData.outcome}
                  onChange={(e) => setFormData({ ...formData, outcome: e.target.value })}
                  className={`${fieldClass} resize-none`}
                  placeholder="Your experience with the result…"
                  aria-label="Your experience"
                />
              </AnswerBubble>

              <AskBubble>Got a photo of your order? We&apos;d love to see it! 📸 (optional)</AskBubble>
              <AnswerBubble>
                {formData.orderImageUrl ? (
                  <div className="relative rounded-xl overflow-hidden">
                    <div className="relative aspect-4/3">
                      <Image
                        src={formData.orderImageUrl}
                        alt="Your order photo"
                        fill
                        sizes="320px"
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        removeAvatar(formData.orderImageUrl);
                        setFormData((prev) => ({ ...prev, orderImageUrl: "" }));
                      }}
                      aria-label="Remove order photo"
                      className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-[#211A16]/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => orderPhotoInputRef.current?.click()}
                    disabled={orderPhotoUploading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[#147A52]/40 text-[#147A52] text-xs font-semibold hover:bg-[#E8F4D8]/50 transition-colors disabled:opacity-60"
                  >
                    {orderPhotoUploading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Uploading…
                      </>
                    ) : (
                      <>
                        <Camera size={14} /> Add a photo of your order
                      </>
                    )}
                  </button>
                )}
                <input
                  ref={orderPhotoInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleOrderPhotoChange}
                  className="hidden"
                />
              </AnswerBubble>

              {status === "error" && (
                <p className="text-red-600 text-xs font-medium text-center bg-red-50 border border-red-100 p-2 rounded-xl">
                  {errorMessage}
                </p>
              )}
            </div>

            {/* Composer-style footer */}
            <div className="px-4 py-3 bg-[#FFFDF9] border-t border-[#E8DED0]/60 shrink-0">
              <button
                type="submit"
                disabled={status === "loading" || orderPhotoUploading || avatarUploading}
                className="w-full h-12 bg-[#147A52] text-white font-bold uppercase tracking-wider text-xs rounded-full hover:opacity-90 disabled:opacity-60 transition-opacity flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Sending…
                  </>
                ) : (
                  <>
                    Send Review <Send size={15} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

const ChatBubble = ({ bubble }: { bubble: Bubble }) => {
  if (bubble.kind === "photo") {
    return (
      <div className="relative max-w-[80%] bg-white rounded-2xl p-1.5 shadow-xs">
        <div className="relative aspect-4/3 rounded-xl overflow-hidden">
          <Image
            src={bubble.src}
            alt={bubble.alt}
            fill
            sizes="(max-width: 768px) 70vw, 320px"
            className="object-cover"
          />
          <div className="absolute inset-x-0 bottom-0 h-10 bg-linear-to-t from-black/45 to-transparent" />
          <span className="absolute bottom-1.5 right-2.5 text-[9px] font-medium text-white/90">
            {bubble.time}
          </span>
        </div>
      </div>
    );
  }

  const isOut = bubble.kind === "out";
  return (
    <div
      className={`max-w-[85%] px-3.5 pt-2.5 pb-1.5 rounded-2xl shadow-xs ${
        isOut ? "ml-auto bg-[#E8F4D8] rounded-tr-sm" : "bg-white rounded-tl-sm"
      }`}
    >
      <p className="text-[13px] text-[#211A16] leading-relaxed">{bubble.text}</p>
      <div className="flex items-center justify-end gap-1 mt-0.5">
        <span className="text-[9px] text-[#9A9188] font-medium">{bubble.time}</span>
        {isOut && <CheckCheck size={13} className="text-sky-400" />}
      </div>
    </div>
  );
};

const ChatCard = ({ rev }: { rev: ChatReview }) => (
  <article className="h-full flex flex-col bg-[#FBF7F0] rounded-3xl border border-[#E8DED0] shadow-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-hover">
    {/* Customer header */}
    <div className="flex items-center gap-3 px-5 py-4 bg-[#FFFDF9] border-b border-[#E8DED0]/60">
      {rev.avatarUrl ? (
        <div className="relative w-11 h-11 rounded-full overflow-hidden border border-[#E8DED0] shrink-0">
          <Image src={rev.avatarUrl} alt={rev.name} fill sizes="44px" className="object-cover" />
        </div>
      ) : (
        <div className="w-11 h-11 rounded-full bg-[#E8F4D8] text-[#147A52] font-bold text-base flex items-center justify-center border border-[#147A52]/10 shrink-0">
          {rev.name.charAt(0)}
        </div>
      )}
      <div className="min-w-0">
        <h3 className="font-bold text-[#211A16] text-sm truncate">{rev.name}</h3>
        <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 mt-1">
          <div className="flex gap-px shrink-0">
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={12} className={i < rev.rating ? "text-[#D99A27] fill-[#D99A27]" : "text-[#9A9188]/40"} />
            ))}
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#147A52] whitespace-nowrap">
            Verified Customer
            <BadgeCheck size={13} className="fill-[#147A52] text-white shrink-0" />
          </span>
        </div>
      </div>
      <MoreVertical size={16} className="ml-auto text-[#9A9188] shrink-0" aria-hidden />
    </div>

    {/* Conversation — paper-texture dots over the light-cream chat wallpaper */}
    <div className="flex-1 paper-texture px-4 py-5 space-y-3" style={{ backgroundColor: "#F7F2E9" }}>
      {rev.bubbles.map((b, i) => (
        <ChatBubble key={i} bubble={b} />
      ))}
    </div>

    {/* Product footer */}
    <div className="flex items-center gap-3 px-4 py-3 border-t border-[#E8DED0]/60 bg-[#FFFDF9]">
      {rev.product?.image ? (
        <div className="relative w-10 h-10 rounded-full overflow-hidden border border-[#E8DED0] shrink-0">
          <Image src={rev.product.image} alt={rev.product.name} fill sizes="40px" className="object-cover" />
        </div>
      ) : (
        <div className="w-10 h-10 rounded-full bg-[#E8F4D8] flex items-center justify-center shrink-0">
          <ShoppingBag size={16} className="text-[#147A52]" />
        </div>
      )}
      <div className="min-w-0">
        <p className="text-sm font-bold text-[#211A16] truncate">
          {rev.product?.name || rev.location}
        </p>
        <p className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#147A52] whitespace-nowrap">
          Verified Purchase
          <BadgeCheck size={13} className="fill-[#147A52] text-white shrink-0" />
        </p>
      </div>
      <span className="ml-auto text-[10px] font-medium text-[#9A9188] shrink-0 pl-2">
        {rev.isDemo ? "Sample story" : rev.product ? rev.location : ""}
      </span>
    </div>
  </article>
);

export default function CustomerLove() {
  const { data: testimonials } = useSWR("/api/admin/testimonials?activeOnly=true", fetcher);
  /* Section heading is admin-editable under Admin → Content → Customer Reviews */
  const { data: settings = {} } = useSWR("/api/settings", fetcher);

  /* Real reviews: goal + outcome are the customer's own words (kept verbatim);
     only the shop's reply in between is authored by us.
     Image-only reviews (screenshot uploads) belong to the About page section, not here. */
  const real: ChatReview[] = Array.isArray(testimonials)
    ? testimonials
        .filter((t: any) => t.goal || t.outcome)
        .map((t: any, i: number) => ({
        id: String(t._id ?? `${t.name}-${i}`),
        name: displayName(t.name),
        location: t.location || "",
        rating: t.rating || 5,
        bubbles: (
          [
            { kind: "in" as const, text: t.goal, time: timeAt(t.createdAt, 0) },
            { kind: "out" as const, text: SHOP_REPLIES[i % SHOP_REPLIES.length], time: timeAt(t.createdAt, 3) },
            ...(typeof t.orderImageUrl === "string" && t.orderImageUrl
              ? [{ kind: "photo" as const, src: t.orderImageUrl, alt: `${t.name}'s order photo`, time: timeAt(t.createdAt, 5) }]
              : []),
            { kind: "in" as const, text: t.outcome, time: timeAt(t.createdAt, 6) },
          ] as Bubble[]
        ).filter((b) => b.kind === "photo" || b.text),
        avatarUrl: typeof t.avatarUrl === "string" ? t.avatarUrl : "",
        }))
    : [];

  const isDemo = real.length === 0;
  const reviews = isDemo ? DEMO_REVIEWS : real;

  const [showAll, setShowAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const visible = showAll ? reviews : reviews.slice(0, 3);
  const hasMore = reviews.length > 3 && !showAll;

  /* Mobile carousel: gentle auto-advance, paused while the user is interacting */
  const trackRef = useRef<HTMLDivElement>(null);
  const pausedUntil = useRef(0);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    const pause = () => { pausedUntil.current = Date.now() + 7000; };
    el.addEventListener("pointerdown", pause);
    el.addEventListener("touchstart", pause, { passive: true });
    el.addEventListener("wheel", pause, { passive: true });

    const timer = setInterval(() => {
      // clientWidth is 0 when the carousel is display:none (md and up)
      if (!el.clientWidth || Date.now() < pausedUntil.current) return;
      const max = el.scrollWidth - el.clientWidth;
      // Advance one card at a time — measure the real card width (it varies by breakpoint)
      const firstCard = el.firstElementChild as HTMLElement | null;
      const step = firstCard ? firstCard.offsetWidth + 16 : el.clientWidth * 0.87;
      const next = el.scrollLeft + step > max - 8 ? 0 : el.scrollLeft + step;
      el.scrollTo({ left: next, behavior: "smooth" });
    }, 4500);

    return () => {
      clearInterval(timer);
      el.removeEventListener("pointerdown", pause);
      el.removeEventListener("touchstart", pause);
      el.removeEventListener("wheel", pause);
    };
  }, [visible.length]);

  return (
    <section className="py-20 bg-cream-bg">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-12">
        {/* Header */}
        <div className="max-w-2xl mx-auto text-center space-y-3">
          <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-[0.24em] text-goat-primary">
            {settings.home_testimonials_eyebrow || "Customer Love"}
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-brand-black tracking-wide uppercase">
            {settings.home_testimonials_title || "Kind Words From Happy Customers"}
          </h2>
          <p className="text-sm font-medium text-brand-gray">
            {settings.home_testimonials_subtitle ||
              "Real messages from customers who made their special moments a little more memorable with Lara's Pinnal."}
          </p>
          {isDemo && (
            <p className="text-[10px] text-brand-gray/70">
              Showing sample stories — approved customer reviews appear here automatically.
            </p>
          )}
        </div>

        {/* Desktop grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-6 items-stretch">
          {visible.map((rev) => (
            <ChatCard key={rev.id} rev={rev} />
          ))}
        </div>

        {/* Mobile & tablet swipe carousel — next card peeks in to invite a swipe */}
        <div
          ref={trackRef}
          className="lg:hidden flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 scroll-px-4 md:-mx-6 md:px-6 md:scroll-px-6 pb-2 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none"
        >
          {visible.map((rev) => (
            <div key={rev.id} className="w-[87%] sm:w-[58%] md:w-[46%] shrink-0 snap-center md:snap-start">
              <ChatCard rev={rev} />
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center space-y-4">
          {hasMore && (
            <button
              onClick={() => setShowAll(true)}
              className="group inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-goat-text hover:text-goat-hover transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-black rounded-md px-2 py-1"
            >
              See More Customer Stories
              <ArrowRight size={14} className="transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          )}
          <p className="text-xs text-brand-gray">
            Bought from us?{" "}
            <button
              onClick={() => setIsModalOpen(true)}
              className="font-bold text-brand-black underline underline-offset-2 hover:text-goat-hover transition-colors"
            >
              Add your review
            </button>
          </p>
        </div>

      </div>

      <AddReviewChatModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}
