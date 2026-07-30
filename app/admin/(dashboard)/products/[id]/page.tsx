"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import AdminTopbar from "@/components/admin/AdminTopbar";
import Link from "next/link";
import CustomSelect from "@/components/shared/CustomSelect";
import ImageUploader from "@/components/admin/ImageUploader";
import TiptapEditor from "@/components/admin/TiptapEditor";
import { ArrowLeft, Save } from "lucide-react";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [formData, setFormData] = useState({
    name: "",
    category: "",
    price: "",
    discountPrice: "",
    stock: "10",
    images: "",
    description: "",
    isFeatured: false,
    isActive: true,
  });

  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const imageList = formData.images
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch(`/api/admin/products/${id}`),
          fetch("/api/admin/categories")
        ]);

        if (prodRes.ok && catRes.ok) {
          const prodData = await prodRes.json();
          const catData = await catRes.json();

          setCategories(catData.map((c: any) => ({ label: c.name, value: c._id })));
          
          setFormData({
            name: prodData.name,
            category: prodData.category?._id || "",
            price: prodData.price.toString(),
            discountPrice: prodData.discountPrice ? prodData.discountPrice.toString() : "",
            stock: prodData.stock.toString(),
            images: prodData.images ? prodData.images.join(", ") : "",
            description: prodData.description || "",
            isFeatured: prodData.isFeatured,
            isActive: prodData.isActive,
          });
        } else {
          setError("Failed to load product details");
        }
      } catch (err) {
        setError("Failed to load product details");
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchInitialData();
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Product Name is required");
      return;
    }
    if (!formData.category) {
      setError("Category is required");
      return;
    }
    if (!formData.price.trim()) {
      setError("Price is required");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const imagesArr = formData.images
        .split(",")
        .map((img) => img.trim())
        .filter((img) => img !== "");

      if (imagesArr.length === 0) {
        imagesArr.push("https://images.unsplash.com/photo-1596436889106-be35e843f974?w=800&auto=format&fit=crop&q=60");
      }

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        discountPrice: formData.discountPrice ? parseFloat(formData.discountPrice) : undefined,
        stock: parseInt(formData.stock, 10),
        images: imagesArr,
      };

      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        router.push("/admin/products");
      } else {
        setError(data.error || "Failed to update product");
      }
    } catch (err) {
      setError("Failed to update product");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminTopbar title="Edit Product" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full max-w-none animate-in fade-in">
        <div>
          <Link href="/admin/products" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black hover:text-goat-primary transition-colors">
            <ArrowLeft size={16} /> Back to Products
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white border border-brand-border rounded-2xl p-12 text-center text-brand-gray animate-pulse">
            Loading details...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white border border-brand-border rounded-2xl p-5 md:p-8 space-y-6 shadow-card w-full">
            <h2 className="text-lg font-bold text-brand-black uppercase tracking-wider border-b border-brand-border pb-3">
              Edit Product details
            </h2>

            {error && (
              <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-200 rounded-xl p-3">
                {error}
              </p>
            )}

            {/* Name */}
            <div className="space-y-1.5">
              <label htmlFor="name" className="text-xs font-bold text-brand-black uppercase">Product Name</label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Lavender Crochet Bouquet"
                className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Category selection */}
              <div className="space-y-1.5">
                <label htmlFor="category" className="text-xs font-bold text-brand-black uppercase">Category</label>
                {categories.length > 0 && (
                  <CustomSelect
                    options={categories}
                    value={formData.category}
                    onChange={(val) => setFormData({ ...formData, category: val })}
                    theme="goat"
                  />
                )}
              </div>

              {/* Stock quantity */}
              <div className="space-y-1.5">
                <label htmlFor="stock" className="text-xs font-bold text-brand-black uppercase">Stock Available</label>
                <input
                  type="number"
                  id="stock"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  placeholder="10"
                  min="0"
                  className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Price */}
              <div className="space-y-1.5">
                <label htmlFor="price" className="text-xs font-bold text-brand-black uppercase">Original Price (₹)</label>
                <input
                  type="number"
                  id="price"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  placeholder="1299"
                  min="0"
                  step="0.01"
                  className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
              </div>

              {/* Discount Price */}
              <div className="space-y-1.5">
                <label htmlFor="discountPrice" className="text-xs font-bold text-brand-black uppercase">Discounted Offer Price (₹)</label>
                <input
                  type="number"
                  id="discountPrice"
                  value={formData.discountPrice}
                  onChange={(e) => setFormData({ ...formData, discountPrice: e.target.value })}
                  placeholder="e.g. 999 (Leave blank if no discount)"
                  min="0"
                  step="0.01"
                  className="w-full h-11 px-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-goat-primary transition-all"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label htmlFor="description" className="text-xs font-bold text-brand-black uppercase">Description</label>
              <p className="text-[10px] text-brand-gray">
                Tell customers about the design, colors, yarn used, dimensions. Use bold, headings, and lists to make it easy to scan.
              </p>
              <TiptapEditor
                value={formData.description}
                onChange={(html) => setFormData({ ...formData, description: html })}
              />
            </div>

            {/* Image Upload + Preview Gallery */}
            <ImageUploader
              images={imageList}
              onChange={(imgs) => setFormData({ ...formData, images: imgs.join(", ") })}
              multiple
              label="Product Images"
            />

            {/* Featured & Active checkboxes */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                  className="w-4.5 h-4.5 text-goat-primary border-brand-border rounded focus:ring-goat-primary"
                />
                <label htmlFor="isFeatured" className="text-sm font-bold text-brand-black uppercase cursor-pointer">
                  Feature Product (Show on Homepage)
                </label>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4.5 h-4.5 text-goat-primary border-brand-border rounded focus:ring-goat-primary"
                />
                <label htmlFor="isActive" className="text-sm font-bold text-brand-black uppercase cursor-pointer">
                  Active & Published
                </label>
              </div>
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
                href="/admin/products"
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
