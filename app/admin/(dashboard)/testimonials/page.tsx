"use client";

import React, { useState, useEffect, useRef } from "react";
import AdminTopbar from "@/components/admin/AdminTopbar";
import { Plus, Loader2, Edit, Trash2, Image as ImageIcon, Upload, X, Star } from "lucide-react";
import Image from "next/image";
import ConfirmDialog from "@/components/admin/ConfirmDialog";

/**
 * A testimonial as this screen edits it.
 *
 * `_id` is absent while creating and present when editing, which is exactly what
 * `handleSave` branches on. The optional image fields are what separate the two
 * review kinds: an `imageUrl` review is a screenshot shown in the About gallery,
 * everything else is a text review shown in the Home page chat section.
 */
interface AdminTestimonial {
  _id?: string;
  name: string;
  location: string;
  goal: string;
  outcome: string;
  rating: number;
  imageUrl: string;
  refId: string;
  isActive: boolean;
  avatarUrl?: string;
  orderImageUrl?: string;
}

export default function AdminTestimonialsPage() {
  const [testimonials, setTestimonials] = useState<AdminTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  /* "text" reviews feed the Home page chat section; "image" reviews feed the About page gallery */
  const [reviewType, setReviewType] = useState<"text" | "image">("text");
  const [currentTestimonial, setCurrentTestimonial] = useState<AdminTestimonial>({
    name: "",
    location: "",
    goal: "",
    outcome: "",
    rating: 5,
    imageUrl: "",
    refId: "ADMIN-CREATED",
    isActive: true,
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * The network half, with no state in it — so the mount effect below can apply
   * results only after an `await`. Setting state synchronously inside an effect
   * costs a render pass before first paint (`react-hooks/set-state-in-effect`).
   */
  const loadTestimonials = async (): Promise<AdminTestimonial[] | null> => {
    try {
      const res = await fetch("/api/admin/testimonials");
      if (!res.ok) return null;
      return (await res.json()) as AdminTestimonial[];
    } catch (error) {
      console.error("Failed to load testimonials:", error);
      return null;
    }
  };

  /** Refetch after a create, edit or delete. */
  const fetchTestimonials = async () => {
    const data = await loadTestimonials();
    if (data) setTestimonials(data);
    setIsLoading(false);
  };

  useEffect(() => {
    let active = true;
    (async () => {
      const data = await loadTestimonials();
      // The admin can navigate away mid-request; without this the response would
      // update a component that is no longer mounted.
      if (!active) return;
      if (data) setTestimonials(data);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleOpenCreate = () => {
    setModalMode("create");
    setReviewType("text");
    setCurrentTestimonial({
      name: "",
      location: "",
      goal: "",
      outcome: "",
      rating: 5,
      imageUrl: "",
      refId: "ADMIN-CREATED",
      isActive: true,
    });
    setError("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (t: AdminTestimonial) => {
    setModalMode("edit");
    setReviewType(t.imageUrl ? "image" : "text");
    setCurrentTestimonial(t);
    setError("");
    setIsModalOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size must be less than 10MB");
      return;
    }

    setIsUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (res.ok && data.url) {
        setCurrentTestimonial((prev) => ({ ...prev, imageUrl: data.url }));
      } else {
        setError(data.error || "Failed to upload image");
      }
    } catch {
      setError("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reviewType === "image" && !currentTestimonial.imageUrl) {
      setError("Upload a review image or screenshot first.");
      return;
    }
    if (reviewType === "text" && !currentTestimonial.outcome?.trim()) {
      setError("The review text is required for a Home page review.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const url =
        modalMode === "create"
          ? "/api/admin/testimonials"
          : `/api/admin/testimonials/${currentTestimonial._id}`;
      const method = modalMode === "create" ? "POST" : "PUT";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...currentTestimonial,
          name: currentTestimonial.name.trim() || "Customer Review",
          // Keep the two sections cleanly separated: a text review never carries a
          // gallery image, an image review never carries chat text.
          ...(reviewType === "text"
            ? { imageUrl: "" }
            : { goal: "", outcome: "" }),
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchTestimonials();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save testimonial");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const res = await fetch(`/api/admin/testimonials/${deleteId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTestimonials();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen relative">
      <AdminTopbar title="Customer Reviews Manager" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full">
        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-display text-brand-black">Customer Reviews</h2>
          </div>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 bg-brand-black hover:bg-primary text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-colors shadow-xs"
          >
            <Plus size={18} />
            <span>Add Review</span>
          </button>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-primary" size={32} />
          </div>
        ) : testimonials.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-3xl p-12 text-center space-y-4 shadow-3xs">
            <div className="w-16 h-16 bg-rose-tint/50 text-rose-text rounded-full flex items-center justify-center mx-auto">
              <ImageIcon size={28} />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-brand-black">No Customer Reviews Yet</h3>
              <p className="text-brand-gray text-sm">Add a text review for the Home page chat section or upload a review screenshot for the About page.</p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div
                key={t._id}
                className={`bg-white rounded-3xl border ${
                  t.isActive ? "border-brand-border" : "border-red-200 opacity-60"
                } p-4 shadow-3xs flex flex-col relative group transition-all hover:shadow-card`}
              >
                {!t.isActive && (
                  <span className="absolute top-4 right-4 bg-orange-100 text-orange-700 text-[10px] font-bold px-2.5 py-1 rounded-full uppercase border border-orange-200 z-10">
                    Pending / Inactive
                  </span>
                )}

                {/* Which section of the site this review feeds */}
                <span className={`self-start text-[10px] font-bold px-2.5 py-1 rounded-full uppercase mb-2 border ${
                  t.imageUrl
                    ? "bg-rose-tint/60 text-rose-text border-rose-primary/20"
                    : "bg-primary-tint text-primary-text border-primary/20"
                }`}>
                  {t.imageUrl ? "About page · Image" : "Home page · Chat"}
                </span>

                {/* Display Review Image if present */}
                {t.imageUrl ? (
                  <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-brand-light-gray/40 border border-brand-border/60 mb-3">
                    <Image src={t.imageUrl} alt={t.name} fill sizes="360px" className="object-contain p-1" />
                  </div>
                ) : (
                  <div className="p-4 bg-rose-tint/30 rounded-2xl border border-brand-border/40 text-xs text-brand-black font-medium mb-3 space-y-2">
                    <div className="flex gap-px">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={12} className={i < (t.rating || 5) ? "text-gold-primary fill-gold-primary" : "text-brand-gray/30"} />
                      ))}
                    </div>
                    {t.goal && <p><strong>Ordered:</strong> {t.goal}</p>}
                    {t.outcome && <p><strong>Review:</strong> {t.outcome}</p>}
                    {t.orderImageUrl && (
                      <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-brand-border/60">
                        <Image src={t.orderImageUrl} alt="Customer's order photo" fill sizes="80px" className="object-cover" />
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Details */}
                <div className="mt-auto pt-3 border-t border-brand-border/40 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-rose-tint text-rose-text flex items-center justify-center text-xs font-bold border border-rose-primary/20">
                      {t.name ? t.name.charAt(0).toUpperCase() : "C"}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-brand-black leading-tight">{t.name || "Customer Review"}</p>
                      {t.location && <p className="text-xs text-brand-gray leading-tight">{t.location}</p>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenEdit(t)}
                      className="p-2 text-brand-gray hover:text-primary transition-colors bg-brand-light-gray rounded-xl hover:bg-white border border-brand-border/40"
                      title="Edit"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteId(t._id ?? null)}
                      className="p-2 text-brand-gray hover:text-red-500 transition-colors bg-brand-light-gray rounded-xl hover:bg-white border border-brand-border/40"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteId}
        title="Delete Customer Review"
        message="Are you sure you want to delete this review? This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />

      {/* Upload / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-brand-border bg-brand-light-gray/60 flex items-center justify-between">
              <h3 className="text-lg font-display font-bold text-brand-black">
                {modalMode === "create" ? "Add Customer Review" : "Edit Customer Review"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-brand-gray hover:text-brand-black">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-5">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-xl font-medium">
                  {error}
                </div>
              )}

              {/* Review type — decides which section of the site it appears in */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-brand-light-gray rounded-2xl">
                {(
                  [
                    { key: "text", label: "Text Review", hint: "Home page chat" },
                    { key: "image", label: "Image Review", hint: "About page gallery" },
                  ] as const
                ).map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setReviewType(opt.key)}
                    className={`rounded-xl py-2.5 px-3 text-center transition-colors ${
                      reviewType === opt.key
                        ? "bg-white shadow-3xs border border-brand-border"
                        : "hover:bg-white/50"
                    }`}
                  >
                    <span className={`block text-xs font-bold ${reviewType === opt.key ? "text-brand-black" : "text-brand-gray"}`}>
                      {opt.label}
                    </span>
                    <span className="block text-[10px] text-brand-gray mt-0.5">{opt.hint}</span>
                  </button>
                ))}
              </div>

              {/* Review Screenshot Upload — image reviews only */}
              {reviewType === "image" && (
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">
                  Customer Review Image / Screenshot *
                </label>

                {currentTestimonial.imageUrl ? (
                  <div className="relative w-full aspect-16/10 rounded-2xl overflow-hidden bg-brand-light-gray border border-brand-border">
                    <Image
                      src={currentTestimonial.imageUrl}
                      alt="Review screenshot"
                      fill
                      sizes="400px"
                      className="object-contain p-2"
                    />
                    <button
                      type="button"
                      onClick={() => setCurrentTestimonial({ ...currentTestimonial, imageUrl: "" })}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full bg-brand-black/80 text-white flex items-center justify-center hover:bg-red-600 transition-colors shadow-sm"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full aspect-video rounded-2xl border-2 border-dashed border-brand-border hover:border-primary bg-cream-bg/40 hover:bg-rose-tint/20 flex flex-col items-center justify-center p-6 cursor-pointer transition-colors text-center space-y-2"
                  >
                    {isUploading ? (
                      <Loader2 size={24} className="animate-spin text-primary" />
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-full bg-white text-rose-text flex items-center justify-center border border-brand-border shadow-3xs">
                          <Upload size={20} />
                        </div>
                        <p className="text-xs font-bold text-brand-black">Click to upload review screenshot</p>
                        <p className="text-[11px] text-brand-gray">PNG, JPG, WEBP up to 10MB</p>
                      </>
                    )}
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>
              )}

              {/* Text review fields — feed the Home page WhatsApp-style chat cards */}
              {reviewType === "text" && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">What They Ordered</label>
                    <textarea
                      rows={2}
                      value={currentTestimonial.goal}
                      onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, goal: e.target.value })}
                      className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-black outline-none resize-none"
                      placeholder="e.g. A custom crochet flower bouquet"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Their Review *</label>
                    <textarea
                      rows={3}
                      value={currentTestimonial.outcome}
                      onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, outcome: e.target.value })}
                      className="w-full border border-brand-border rounded-xl px-4 py-2.5 text-sm focus:border-brand-black outline-none resize-none"
                      placeholder="The customer's experience in their own words…"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Rating</label>
                    <div className="flex gap-1.5">
                      {[...Array(5)].map((_, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setCurrentTestimonial({ ...currentTestimonial, rating: i + 1 })}
                          aria-label={`${i + 1} star${i ? "s" : ""}`}
                          className="focus:outline-none transition-transform active:scale-90"
                        >
                          <Star
                            size={26}
                            className={i < (currentTestimonial.rating || 5) ? "text-gold-primary fill-gold-primary" : "text-brand-gray/30"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Customer Name / Label */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Customer Name / Label</label>
                <input
                  type="text"
                  value={currentTestimonial.name}
                  onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, name: e.target.value })}
                  className="w-full h-11 border border-brand-border rounded-xl px-4 text-sm focus:border-brand-black outline-none"
                  placeholder="e.g. Ananya S. or WhatsApp Feedback"
                />
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">Location / City (Optional)</label>
                <input
                  type="text"
                  value={currentTestimonial.location}
                  onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, location: e.target.value })}
                  className="w-full h-11 border border-brand-border rounded-xl px-4 text-sm focus:border-brand-black outline-none"
                  placeholder="e.g. Chennai, TN"
                />
              </div>

              {/* Active Toggle */}
              <label className="flex items-center gap-3 cursor-pointer p-3.5 border border-brand-border rounded-2xl bg-brand-light-gray/30 hover:bg-brand-light-gray transition-colors">
                <div className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={currentTestimonial.isActive}
                    onChange={(e) => setCurrentTestimonial({ ...currentTestimonial, isActive: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-black">Visible on Website</p>
                  <p className="text-xs text-brand-gray">Approved reviews show on the Home or About page</p>
                </div>
              </label>

              <div className="pt-3 border-t border-brand-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 h-11 rounded-full text-xs font-bold uppercase tracking-wider text-brand-gray hover:bg-brand-light-gray transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving || isUploading}
                  className="flex items-center gap-2 bg-brand-black hover:bg-primary text-white px-7 h-11 rounded-full text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-70 shadow-xs"
                >
                  {isSaving && <Loader2 size={16} className="animate-spin" />}
                  <span>{isSaving ? "Saving..." : "Save Review"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
