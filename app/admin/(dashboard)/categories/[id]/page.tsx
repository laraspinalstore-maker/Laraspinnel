"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminTopbar from "@/components/admin/AdminTopbar";
import Link from "next/link";
import ImageUploader from "@/components/admin/ImageUploader";
import { ArrowLeft, Save } from "lucide-react";

export default function EditCategoryPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    image: "",
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchCategoryDetails = async () => {
      try {
        const res = await fetch(`/api/admin/categories/${id}`);
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name,
            description: data.description || "",
            image: data.image || "",
            isActive: data.isActive,
          });
        } else {
          setError("Failed to load category details");
        }
      } catch (err) {
        setError("Failed to load category details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchCategoryDetails();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Name is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/admin/categories");
      } else {
        setError(data.error || "Failed to update category");
      }
    } catch (err) {
      setError("Failed to update category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminTopbar title="Edit Category" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full max-w-none animate-in fade-in">
        <div>
          <Link href="/admin/categories" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black hover:text-goat-primary transition-colors">
            <ArrowLeft size={16} /> Back to Categories
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white border border-brand-border rounded-2xl p-12 text-center text-brand-gray animate-pulse">
            Loading details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-brand-border rounded-2xl p-5 md:p-8 space-y-6 shadow-card w-full">
            <h2 className="text-lg font-bold text-brand-black uppercase tracking-wider border-b border-brand-border pb-3">
              Edit Category details
            </h2>

            {error && (
              <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold text-brand-black uppercase">Category Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Crochet Bouquets"
                className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-bold text-brand-black uppercase">Description</label>
              <textarea
                id="description"
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide a brief summary of what this category contains..."
                className="w-full p-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all resize-none"
              />
            </div>

            {/* Image Upload + Preview */}
            <ImageUploader
              images={formData.image ? [formData.image] : []}
              onChange={(imgs) => setFormData({ ...formData, image: imgs[0] || "" })}
              multiple={false}
              label="Category Image"
            />

            {/* Is Active */}
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4.5 h-4.5 text-goat-primary border-brand-border rounded focus:ring-goat-primary"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-brand-black uppercase cursor-pointer">
                Active & Published (Visible on Public Website)
              </label>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-brand-border flex gap-3">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-brand-black hover:bg-goat-primary text-white font-bold py-2.5 px-6 rounded-xl transition-all flex items-center gap-2 shadow-sm text-sm disabled:bg-neutral-400"
              >
                {isSubmitting ? "Saving..." : <><Save size={16} /> Save Changes</>}
              </button>
              <Link
                href="/admin/categories"
                className="bg-white hover:bg-brand-light-gray text-brand-black border border-brand-border font-bold py-2.5 px-6 rounded-xl transition-all text-sm"
              >
                Cancel
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
