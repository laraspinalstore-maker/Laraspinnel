"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminTopbar from "@/components/admin/AdminTopbar";
import TypeToConfirmDialog from "@/components/admin/TypeToConfirmDialog";
import CustomSelect from "@/components/shared/CustomSelect";
import { useToast } from "@/components/admin/Toast";
import { Plus, Search, Pencil, Trash2, ShoppingBag, FolderOpen } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  category: {
    _id: string;
    name: string;
  };
  price: number;
  discountPrice?: number;
  stock: number;
  isFeatured: boolean;
  isActive: boolean;
  images: string[];
  description?: string;
}

export default function AdminProductsPage() {
  const { showToast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [confirmBulk, setConfirmBulk] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);

  const fetchProductsAndCategories = async () => {
    setIsLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch("/api/admin/products"),
        fetch("/api/admin/categories")
      ]);

      if (prodRes.ok && catRes.ok) {
        const prodData = await prodRes.json();
        const catData = await catRes.json();
        setProducts(prodData);
        setFilteredProducts(prodData);
        setCategories([
          { label: "All Categories", value: "all" },
          ...catData.map((c: any) => ({ label: c.name, value: c._id }))
        ]);
      } else {
        setError("Failed to fetch product metrics");
      }
    } catch (err) {
      setError("Failed to fetch product metrics");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductsAndCategories();
  }, []);

  useEffect(() => {
    let results = products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (categoryFilter !== "all") {
      results = results.filter((p) => p.category?._id === categoryFilter);
    }

    setFilteredProducts(results);
  }, [searchTerm, categoryFilter, products]);

  const handleDeleteClick = (id: string) => {
    setConfirmDeleteId(id);
  };

  // Group the visible products by their category so admins can scan category-wise.
  const groupedProducts = useMemo(() => {
    const groups: { id: string; name: string; items: Product[] }[] = [];
    const map = new Map<string, { id: string; name: string; items: Product[] }>();

    for (const product of filteredProducts) {
      const id = product.category?._id || "uncategorized";
      const name = product.category?.name || "Uncategorized";
      let group = map.get(id);
      if (!group) {
        group = { id, name, items: [] };
        map.set(id, group);
        groups.push(group);
      }
      group.items.push(product);
    }

    // Alphabetical, with "Uncategorized" always last.
    groups.sort((a, b) => {
      if (a.id === "uncategorized") return 1;
      if (b.id === "uncategorized") return -1;
      return a.name.localeCompare(b.name);
    });

    return groups;
  }, [filteredProducts]);

  const doDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;

    setIsDeletingSingle(true);
    try {
      const res = await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (res.ok) {
        setProducts(products.filter((p) => p._id !== id));
        showToast("Product deleted successfully.", { variant: "success" });
      } else {
        showToast(data.error || "Failed to delete product", { variant: "error" });
      }
    } catch (err) {
      showToast("Failed to delete product", { variant: "error" });
    } finally {
      setIsDeletingSingle(false);
      setConfirmDeleteId(null);
    }
  };

  // ---- Bulk selection ----
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isGroupAllSelected = (items: Product[]) =>
    items.length > 0 && items.every((p) => selectedIds.has(p._id));

  const toggleGroup = (items: Product[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = items.every((p) => next.has(p._id));
      items.forEach((p) => (allSelected ? next.delete(p._id) : next.add(p._id)));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const doBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/products/${id}`, { method: "DELETE" })
            .then((res) => ({ id, ok: res.ok }))
            .catch(() => ({ id, ok: false }))
        )
      );

      const deletedIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
      const failedCount = results.length - deletedIds.size;

      if (deletedIds.size > 0) {
        setProducts((prev) => prev.filter((p) => !deletedIds.has(p._id)));
      }
      setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => !deletedIds.has(id))));

      if (failedCount > 0) {
        showToast(`${failedCount} product(s) could not be deleted. Please try again.`, {
          variant: "error",
        });
      } else if (deletedIds.size > 0) {
        showToast(`${deletedIds.size} product(s) deleted.`, { variant: "success" });
      }
    } finally {
      setIsBulkDeleting(false);
      setConfirmBulk(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <TypeToConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete this product?"
        message={
          confirmDeleteId
            ? `This will permanently delete "${products.find((p) => p._id === confirmDeleteId)?.name || "this product"}". This cannot be undone.`
            : ""
        }
        confirmWord={products.find((p) => p._id === confirmDeleteId)?.name || ""}
        confirmLabel="Delete Product"
        isLoading={isDeletingSingle}
        onConfirm={doDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />

      <TypeToConfirmDialog
        isOpen={confirmBulk}
        title="Delete selected products?"
        message={`This will permanently delete ${selectedIds.size} selected product(s). This cannot be undone.`}
        confirmWord="DELETE"
        confirmLabel={`Delete ${selectedIds.size} Product(s)`}
        isLoading={isBulkDeleting}
        onConfirm={doBulkDelete}
        onCancel={() => setConfirmBulk(false)}
      />
      
      <AdminTopbar title="Gift Products" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full animate-in fade-in">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:max-w-xl">
            {/* Search */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gray">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search products by name..."
                className="w-full h-10 pl-9 pr-4 bg-white border border-brand-border rounded-xl text-sm text-brand-black focus:ring-2 focus:ring-goat-primary outline-none transition-all"
              />
            </div>

            {/* Category Filter */}
            <div className="w-full sm:w-48">
              <CustomSelect
                options={categories}
                value={categoryFilter}
                onChange={(val) => setCategoryFilter(val)}
                theme="goat"
              />
            </div>
          </div>

          {/* Add Product Button */}
          <Link
            href="/admin/products/new"
            className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center gap-2 bg-brand-black hover:bg-goat-primary text-white font-semibold text-sm h-10 px-4 rounded-xl transition-colors duration-200 shadow-sm whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add Product</span>
          </Link>
        </div>

        {/* Bulk action bar — appears when products are selected */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-goat-tint border border-goat-primary/30 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-1">
            <span className="text-sm font-bold text-goat-text">
              {selectedIds.size} selected
            </span>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={clearSelection}
                className="flex-1 sm:flex-none text-sm font-semibold text-brand-black bg-white border border-brand-border hover:bg-brand-light-gray h-9 px-4 rounded-lg transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => setConfirmBulk(true)}
                disabled={isBulkDeleting}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 h-9 px-4 rounded-lg transition-colors shadow-sm disabled:bg-neutral-400"
              >
                <Trash2 size={15} />
                {isBulkDeleting ? "Deleting..." : "Delete selected"}
              </button>
            </div>
          </div>
        )}

        {/* List — grouped category-wise */}
        {isLoading ? (
          <div className="bg-white border border-brand-border rounded-2xl shadow-card p-12 text-center text-brand-gray flex flex-col items-center gap-3">
            <div className="animate-spin text-goat-primary">
              <ShoppingBag size={40} />
            </div>
            <p className="text-sm font-semibold">Loading products...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-brand-border rounded-2xl shadow-card p-12 text-center text-red-600">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchProductsAndCategories}
              className="mt-2 text-xs font-semibold underline text-brand-black"
            >
              Try Again
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-2xl shadow-card p-12 text-center text-brand-gray">
            <ShoppingBag size={40} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-sm font-semibold">No products found</p>
            <p className="text-xs mt-1">Try refining your filters or add a new product.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedProducts.map((group) => (
              <div
                key={group.id}
                className="bg-white border border-brand-border rounded-2xl shadow-card overflow-hidden"
              >
                {/* Category header */}
                <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 bg-brand-light-gray/60 border-b border-brand-border">
                  <label className="flex items-center gap-2.5 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGroupAllSelected(group.items)}
                      onChange={() => toggleGroup(group.items)}
                      className="w-4 h-4 shrink-0 accent-goat-primary rounded border-brand-border cursor-pointer"
                      title="Select all in this category"
                    />
                    <FolderOpen size={16} className="text-goat-primary shrink-0" />
                    <h3 className="text-sm font-bold text-brand-black uppercase tracking-wide truncate">
                      {group.name}
                    </h3>
                  </label>
                  <span className="shrink-0 text-[11px] font-bold text-brand-gray bg-white border border-brand-border rounded-full px-2.5 py-0.5">
                    {group.items.length} {group.items.length === 1 ? "product" : "products"}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-brand-gray font-semibold text-xs border-b border-brand-border">
                        <th className="pl-4 md:pl-6 pr-1 py-2.5 w-8"></th>
                        <th className="px-4 md:px-6 py-2.5 w-16">Preview</th>
                        <th className="px-4 md:px-6 py-2.5">Name</th>
                        <th className="px-4 md:px-6 py-2.5">Price</th>
                        <th className="px-4 md:px-6 py-2.5">Stock</th>
                        <th className="px-4 md:px-6 py-2.5">Status</th>
                        <th className="px-4 md:px-6 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border text-sm">
                      {group.items.map((product) => (
                        <tr
                          key={product._id}
                          className={`transition-colors ${
                            selectedIds.has(product._id)
                              ? "bg-goat-tint/50"
                              : "hover:bg-brand-light-gray/50"
                          }`}
                        >
                          <td className="pl-4 md:pl-6 pr-1 py-3">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(product._id)}
                              onChange={() => toggleOne(product._id)}
                              className="w-4 h-4 accent-goat-primary rounded border-brand-border cursor-pointer"
                              aria-label={`Select ${product.name}`}
                            />
                          </td>
                          <td className="px-4 md:px-6 py-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden border border-brand-border bg-brand-light-gray relative">
                              {product.images?.[0] ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={product.images[0]}
                                  alt={product.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-neutral-400">
                                  <ShoppingBag size={20} />
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <div className="font-semibold text-brand-black flex items-center gap-2">
                              <span>{product.name}</span>
                              {product.isFeatured && (
                                <span className="bg-goat-tint text-goat-text text-[10px] font-bold px-1.5 py-0.5 rounded border border-goat-primary/10 shrink-0">
                                  Featured
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 md:px-6 py-4 font-semibold text-brand-black">
                            {product.discountPrice ? (
                              <div className="flex flex-col">
                                <span>₹{product.discountPrice}</span>
                                <span className="text-[10px] text-brand-gray line-through">₹{product.price}</span>
                              </div>
                            ) : (
                              <span>₹{product.price}</span>
                            )}
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span className={`font-semibold ${product.stock <= 3 ? "text-red-600" : "text-brand-black"}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                                product.isActive
                                  ? "bg-green-50 text-green-800 border-green-200"
                                  : "bg-gray-50 text-gray-800 border-gray-200"
                              }`}
                            >
                              {product.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 md:px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Link
                                href={`/admin/products/${product._id}`}
                                className="p-1.5 hover:bg-brand-light-gray text-brand-black hover:text-goat-primary rounded transition-colors"
                                title="Edit"
                              >
                                <Pencil size={16} />
                              </Link>
                              <button
                                onClick={() => handleDeleteClick(product._id)}
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
