"use client";

import React, { useState, useEffect } from "react";
import AdminTopbar from "@/components/admin/AdminTopbar";
import ImageUploadDropzone from "@/components/admin/ImageUploadDropzone";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Plus, Pencil, Trash2, Megaphone, Save, X, Loader2 } from "lucide-react";

interface Banner {
  _id: string;
  imageUrl: string;
  headline: string;
  subtext?: string;
  buttonText?: string;
  buttonLink?: string;
  buttonTheme: "green" | "red";
  order: number;
  isActive: boolean;
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Edit / Form state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string[]>([]);
  const [headline, setHeadline] = useState("");
  const [subtext, setSubtext] = useState("");
  const [buttonText, setButtonText] = useState("");
  const [buttonLink, setButtonLink] = useState("");
  const [buttonTheme, setButtonTheme] = useState<"green" | "red">("green");
  const [order, setOrder] = useState(0);
  const [isActive, setIsActive] = useState(true);

  const fetchBanners = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/banners");
      if (res.ok) {
        const data = await res.json();
        setBanners(data);
      } else {
        setError("Failed to fetch banners");
      }
    } catch (err) {
      setError("Failed to fetch banners");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const openAddForm = () => {
    setEditingBannerId(null);
    setImageUrl([]);
    setHeadline("");
    setSubtext("");
    setButtonText("");
    setButtonLink("");
    setButtonTheme("green");
    setOrder(banners.length);
    setIsActive(true);
    setError("");
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const openEditForm = (banner: Banner) => {
    setEditingBannerId(banner._id);
    setImageUrl([banner.imageUrl]);
    setHeadline(banner.headline);
    setSubtext(banner.subtext || "");
    setButtonText(banner.buttonText || "");
    setButtonLink(banner.buttonLink || "");
    setButtonTheme(banner.buttonTheme);
    setOrder(banner.order);
    setIsActive(banner.isActive);
    setError("");
    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const doDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/admin/banners/${id}`, { method: "DELETE" });
      if (res.ok) {
        setBanners(banners.filter((b) => b._id !== id));
      } else {
        setError("Failed to delete banner");
      }
    } catch (err) {
      setError("Failed to delete banner");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (imageUrl.length === 0) {
      setError("Please upload a banner image.");
      return;
    }

    setIsSaving(true);
    setError("");

    const payload = {
      imageUrl: imageUrl[0],
      headline,
      subtext,
      buttonText,
      buttonLink,
      buttonTheme,
      order: Number(order),
      isActive,
    };

    const url = editingBannerId ? `/api/admin/banners/${editingBannerId}` : "/api/admin/banners";
    const method = editingBannerId ? "PUT" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsFormOpen(false);
        fetchBanners();
      } else {
        const data = await res.json();
        setError(data.error || "Failed to save banner.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Banner"
        message="Are you sure you want to delete this banner? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={doDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <AdminTopbar title="Hero Banners" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-brand-gray">
            Manage auto-playing slides shown on the public homepage hero banner slider.
          </p>
          {!isFormOpen && (
            <button
              onClick={openAddForm}
              className="inline-flex items-center justify-center gap-2 bg-brand-black hover:bg-goat-primary text-white font-semibold text-sm h-10 px-4 rounded-xl transition-colors duration-200 shadow-sm shrink-0"
            >
              <Plus size={16} />
              <span>Add Banner</span>
            </button>
          )}
        </div>

        {/* Modal / Form Inline */}
        {isFormOpen && (
          <div className="bg-white border border-brand-border rounded-2xl shadow-card p-3 md:p-6 space-y-6 animate-in slide-in-from-top duration-200">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <h3 className="font-display text-lg text-brand-black tracking-wide">
                {editingBannerId ? "Edit Banner Slide" : "Add Banner Slide"}
              </h3>
              <button
                onClick={() => setIsFormOpen(false)}
                className="text-brand-gray hover:text-brand-black"
              >
                <X size={18} />
              </button>
            </div>

            {error && <p className="text-sm font-semibold text-red-600">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Headline */}
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
                    Headline / Title (Anton Font)
                  </label>
                  <input
                    type="text"
                    required
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. Handmade Crochet Gifts, Delivered Across Tamil Nadu"
                    className="w-full h-11 bg-white border border-brand-border rounded-xl px-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary"
                  />
                </div>

                {/* Subtext */}
                <div className="space-y-1.5 lg:col-span-2">
                  <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
                    Subtext / Subtitle
                  </label>
                  <input
                    type="text"
                    value={subtext}
                    onChange={(e) => setSubtext(e.target.value)}
                    placeholder="e.g. Bouquets, amigurumi, and custom gifts. Order now for home delivery."
                    className="w-full h-11 bg-white border border-brand-border rounded-xl px-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary"
                  />
                </div>

                {/* Button Text */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
                    Button Label
                  </label>
                  <input
                    type="text"
                    value={buttonText}
                    onChange={(e) => setButtonText(e.target.value)}
                    placeholder="e.g. Shop Crochet Gifts"
                    className="w-full h-11 bg-white border border-brand-border rounded-xl px-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary"
                  />
                </div>

                {/* Button Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
                    Button Link Destination
                  </label>
                  <input
                    type="text"
                    value={buttonLink}
                    onChange={(e) => setButtonLink(e.target.value)}
                    placeholder="e.g. /shop"
                    className="w-full h-11 bg-white border border-brand-border rounded-xl px-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary"
                  />
                </div>

                {/* Button Theme */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
                    Button Theme Accent
                  </label>
                  <select
                    value={buttonTheme}
                    onChange={(e) => setButtonTheme(e.target.value as "green" | "red")}
                    className="w-full h-11 bg-white border border-brand-border rounded-xl px-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary"
                  >
                    <option value="green">Green Button</option>
                    <option value="red">Red Button</option>
                  </select>
                </div>

                {/* Order */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
                    Slide Sort Order
                  </label>
                  <input
                    type="number"
                    value={order}
                    onChange={(e) => setOrder(Number(e.target.value))}
                    className="w-full h-11 bg-white border border-brand-border rounded-xl px-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-goat-primary"
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
                  Banner Image (Landscape high resolution landscape layout)
                </label>
                <ImageUploadDropzone value={imageUrl} onChange={setImageUrl} maxFiles={1} />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-6 pt-4 border-t border-brand-border">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-goat-primary focus:ring-goat-primary border-brand-border"
                  />
                  <span className="text-sm font-semibold text-brand-black">Visible / Active slide</span>
                </label>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 border-t border-brand-border pt-4">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="h-10 px-5 text-sm font-semibold border border-brand-border rounded-xl text-brand-black hover:bg-brand-light-gray"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 h-10 px-5 text-sm font-semibold bg-brand-black hover:bg-goat-primary text-white rounded-xl transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save Slide</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Existing Banners Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full p-12 text-center text-brand-gray flex flex-col items-center gap-3">
              <Loader2 size={36} className="animate-spin text-goat-primary" />
              <p className="text-sm font-semibold">Loading banner slides...</p>
            </div>
          ) : banners.length === 0 ? (
            <div className="col-span-full p-12 text-center text-brand-gray border border-brand-border rounded-2xl bg-white">
              <Megaphone size={40} className="mx-auto mb-3 text-neutral-300" />
              <p className="text-sm font-semibold">No banners set up</p>
              <p className="text-xs mt-1">Create banner slides to show on the homepage hero slider.</p>
            </div>
          ) : (
            banners.map((banner) => (
              <div
                key={banner._id}
                className="bg-white border border-brand-border rounded-2xl shadow-card overflow-hidden flex flex-col justify-between"
              >
                {/* Banner Preview */}
                <div className="relative aspect-[16/7] bg-brand-light-gray">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.headline}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3 flex gap-2">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                        banner.isActive
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-gray-50 text-gray-800 border-gray-200"
                      }`}
                    >
                      {banner.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="bg-neutral-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">
                      Order: {banner.order}
                    </span>
                  </div>
                </div>

                {/* Banner Content */}
                <div className="p-3 md:p-5 flex-1 flex flex-col justify-between gap-4">
                  <div className="space-y-1">
                    <h4 className="font-semibold text-brand-black text-base line-clamp-1">
                      {banner.headline}
                    </h4>
                    {banner.subtext && (
                      <p className="text-xs text-brand-gray line-clamp-2">{banner.subtext}</p>
                    )}
                    {banner.buttonText && (
                      <div className="pt-2">
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                            banner.buttonTheme === "red"
                              ? "bg-mutton-tint text-mutton-text border-mutton-primary/20"
                              : "bg-goat-tint text-goat-text border-goat-primary/20"
                          }`}
                        >
                          Btn: {banner.buttonText} → {banner.buttonLink}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex justify-end gap-2 border-t border-brand-border pt-4">
                    <button
                      onClick={() => openEditForm(banner)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold border border-brand-border rounded-lg text-brand-black hover:bg-brand-light-gray transition-colors"
                    >
                      <Pencil size={12} />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(banner._id)}
                      className="inline-flex items-center gap-1.5 h-8 px-3 text-xs font-semibold bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition-colors"
                    >
                      <Trash2 size={12} />
                      <span>Delete</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
