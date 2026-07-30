"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import AdminTopbar from "@/components/admin/AdminTopbar";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import { Plus, Search, Pencil, Trash2, FolderHeart } from "lucide-react";

interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/categories");
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
        setFilteredCategories(data);
      } else {
        setError("Failed to fetch categories");
      }
    } catch (err) {
      setError("Failed to fetch categories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    const results = categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        cat.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredCategories(results);
  }, [searchTerm, categories]);

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  const doDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/admin/categories/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setCategories(categories.filter((c) => c._id !== id));
        showToast("Category deleted successfully.", { variant: "success" });
      } else {
        showToast(data.error || "Failed to delete category", { variant: "error" });
      }
    } catch (err) {
      showToast("Failed to delete category", { variant: "error" });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone and will fail if any products are associated with it."
        confirmLabel="Delete"
        onConfirm={doDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
      
      <AdminTopbar title="Gift Categories" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full animate-in fade-in">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Search */}
          <div className="relative w-full sm:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gray">
              <Search size={16} />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search categories by name or info..."
              className="w-full h-10 pl-9 pr-4 bg-white border border-brand-border rounded-xl text-sm text-brand-black focus:ring-2 focus:ring-goat-primary outline-none transition-all"
            />
          </div>

          {/* Add New Button */}
          <Link
            href="/admin/categories/new"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-brand-black hover:bg-goat-primary text-white font-semibold text-sm h-10 px-4 rounded-xl transition-colors duration-200 shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add Category</span>
          </Link>
        </div>

        {/* List / Table */}
        <div className="bg-white border border-brand-border rounded-2xl shadow-card overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-brand-gray flex flex-col items-center gap-3">
              <div className="animate-spin text-goat-primary">
                <FolderHeart size={40} />
              </div>
              <p className="text-sm font-semibold">Loading categories...</p>
            </div>
          ) : error ? (
            <div className="p-12 text-center text-red-600">
              <p className="text-sm font-semibold">{error}</p>
              <button
                onClick={fetchCategories}
                className="mt-2 text-xs font-semibold underline text-brand-black"
              >
                Try Again
              </button>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="p-12 text-center text-brand-gray">
              <FolderHeart size={40} className="mx-auto mb-3 text-neutral-300" />
              <p className="text-sm font-semibold">No categories found</p>
              <p className="text-xs mt-1">Try refining your search terms or add a new category.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-brand-light-gray text-brand-gray font-semibold text-xs border-b border-brand-border">
                    <th className="px-4 md:px-6 py-3 w-16">Preview</th>
                    <th className="px-4 md:px-6 py-3">Name</th>
                    <th className="px-4 md:px-6 py-3">Slug</th>
                    <th className="px-4 md:px-6 py-3">Description</th>
                    <th className="px-4 md:px-6 py-3">Status</th>
                    <th className="px-4 md:px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-brand-border text-sm">
                  {filteredCategories.map((category) => (
                    <tr key={category._id} className="hover:bg-brand-light-gray/50 transition-colors">
                      <td className="px-4 md:px-6 py-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden border border-brand-border bg-brand-light-gray relative">
                          {category.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={category.image}
                              alt={category.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-neutral-400">
                              <FolderHeart size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 md:px-6 py-4 font-semibold text-brand-black">
                        {category.name}
                      </td>
                      <td className="px-4 md:px-6 py-4 text-brand-gray font-mono text-xs">{category.slug}</td>
                      <td className="px-4 md:px-6 py-4 text-brand-gray truncate max-w-xs">{category.description}</td>
                      <td className="px-4 md:px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            category.isActive
                              ? "bg-green-50 text-green-800 border-green-200"
                              : "bg-gray-50 text-gray-800 border-gray-200"
                          }`}
                        >
                          {category.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/admin/categories/${category._id}`}
                            className="p-1.5 hover:bg-brand-light-gray text-brand-black hover:text-goat-primary rounded transition-colors"
                            title="Edit"
                          >
                            <Pencil size={16} />
                          </Link>
                          <button
                            onClick={() => handleDeleteClick(category._id)}
                            className="p-1.5 hover:bg-red-50 text-brand-gray hover:text-red-600 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
