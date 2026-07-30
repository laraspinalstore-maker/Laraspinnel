"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import AdminTopbar from "@/components/admin/AdminTopbar";
import CustomSelect from "@/components/shared/CustomSelect";
import StatusBadge, { OrderStatus } from "@/components/admin/StatusBadge";
import TypeToConfirmDialog from "@/components/admin/TypeToConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import { Search, FileText, Phone, CalendarDays, RefreshCw, X, Trash2 } from "lucide-react";

// Selectable order statuses (shared by the filter and the bulk-update bar).
const STATUS_CHOICES: { label: string; value: OrderStatus }[] = [
  { label: "Pending", value: "pending" },
  { label: "Confirmed", value: "confirmed" },
  { label: "Preparing", value: "preparing" },
  { label: "Ready to Ship", value: "ready" },
  { label: "Delivered", value: "delivered" },
  { label: "Cancelled", value: "cancelled" },
];

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  totalAmount: number;
  status: OrderStatus;
  orderType?: "shop" | "custom";
  createdAt: string;
  items: {
    quantity: number;
  }[];
}

export default function AdminOrdersPage() {
  const { showToast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState(""); // "YYYY-MM-DD" from the date input
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>("confirmed");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);
  const [orderPendingDelete, setOrderPendingDelete] = useState<Order | null>(null);
  const [isDeletingSingle, setIsDeletingSingle] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/orders");
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
        setFilteredOrders(data);
      } else {
        setError("Failed to fetch customer orders");
      }
    } catch (err) {
      setError("Failed to fetch customer orders");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    let results = orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.phone.includes(searchTerm)
    );

    if (statusFilter !== "all") {
      results = results.filter((o) => o.status === statusFilter);
    }

    if (dateFilter) {
      results = results.filter((o) => {
        const d = new Date(o.createdAt);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
          d.getDate()
        ).padStart(2, "0")}`;
        return key === dateFilter;
      });
    }

    setFilteredOrders(results);
  }, [searchTerm, statusFilter, dateFilter, orders]);

  // Group the visible orders by the day they were placed (newest day first).
  const groupedOrders = useMemo(() => {
    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const now = new Date();
    const todayKey = dayKey(now);
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayKey = dayKey(yesterday);

    const labelFor = (d: Date, key: string) => {
      if (key === todayKey) return "Today";
      if (key === yesterdayKey) return "Yesterday";
      return d.toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    };

    const groups: { key: string; label: string; items: Order[]; total: number }[] = [];
    const map = new Map<string, { key: string; label: string; items: Order[]; total: number }>();

    for (const order of filteredOrders) {
      const d = new Date(order.createdAt);
      const key = dayKey(d);
      let group = map.get(key);
      if (!group) {
        group = { key, label: labelFor(d, key), items: [], total: 0 };
        map.set(key, group);
        groups.push(group);
      }
      group.items.push(order);
      group.total += order.totalAmount;
    }

    // Newest day at the top.
    groups.sort((a, b) => (a.key < b.key ? 1 : a.key > b.key ? -1 : 0));
    return groups;
  }, [filteredOrders]);

  // ---- Bulk selection ----
  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const isGroupAllSelected = (items: Order[]) =>
    items.length > 0 && items.every((o) => selectedIds.has(o._id));

  const toggleGroup = (items: Order[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected = items.every((o) => next.has(o._id));
      items.forEach((o) => (allSelected ? next.delete(o._id) : next.add(o._id)));
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const doBulkStatusUpdate = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkUpdating(true);
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/orders/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: bulkStatus }),
          })
            .then((res) => ({ id, ok: res.ok }))
            .catch(() => ({ id, ok: false }))
        )
      );

      const updatedIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
      const failedCount = results.length - updatedIds.size;

      if (updatedIds.size > 0) {
        setOrders((prev) =>
          prev.map((o) => (updatedIds.has(o._id) ? { ...o, status: bulkStatus } : o))
        );
      }
      setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => !updatedIds.has(id))));

      if (failedCount > 0) {
        showToast(`${failedCount} order(s) could not be updated. Please try again.`, {
          variant: "error",
        });
      } else if (updatedIds.size > 0) {
        showToast(`${updatedIds.size} order(s) updated successfully.`, { variant: "success" });
      }
    } finally {
      setIsBulkUpdating(false);
    }
  };

  const doBulkDelete = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setIsBulkDeleting(true);
    try {
      const results = await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/orders/${id}`, { method: "DELETE" })
            .then((res) => ({ id, ok: res.ok }))
            .catch(() => ({ id, ok: false }))
        )
      );

      const deletedIds = new Set(results.filter((r) => r.ok).map((r) => r.id));
      const failedCount = results.length - deletedIds.size;

      if (deletedIds.size > 0) {
        setOrders((prev) => prev.filter((o) => !deletedIds.has(o._id)));
      }
      setSelectedIds((prev) => new Set(Array.from(prev).filter((id) => !deletedIds.has(id))));

      if (failedCount > 0) {
        showToast(`${failedCount} order(s) could not be deleted. Please try again.`, {
          variant: "error",
        });
      } else if (deletedIds.size > 0) {
        showToast(`${deletedIds.size} order(s) deleted successfully.`, { variant: "success" });
      }
    } finally {
      setIsBulkDeleting(false);
      setShowBulkDeleteConfirm(false);
    }
  };

  const doDeleteSingle = async () => {
    if (!orderPendingDelete) return;
    const order = orderPendingDelete;

    setIsDeletingSingle(true);
    try {
      const res = await fetch(`/api/admin/orders/${order._id}`, { method: "DELETE" });
      if (res.ok) {
        setOrders((prev) => prev.filter((o) => o._id !== order._id));
        setSelectedIds((prev) => {
          const next = new Set(prev);
          next.delete(order._id);
          return next;
        });
        showToast(`Order ${order.orderNumber} deleted successfully.`, { variant: "success" });
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to delete order. Please try again.", { variant: "error" });
      }
    } catch (err) {
      showToast("Failed to delete order. Please try again.", { variant: "error" });
    } finally {
      setIsDeletingSingle(false);
      setOrderPendingDelete(null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminTopbar title="Customer Orders" />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full animate-in fade-in">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:max-w-3xl">
            {/* Search */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-brand-gray">
                <Search size={16} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search orders by number, client, or phone..."
                className="w-full h-10 pl-9 pr-4 bg-white border border-brand-border rounded-xl text-sm text-brand-black focus:ring-2 focus:ring-goat-primary outline-none transition-all"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <CustomSelect
                options={[{ label: "All Statuses", value: "all" }, ...STATUS_CHOICES]}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                theme="goat"
              />
            </div>

            {/* Date Filter */}
            <div className="relative w-full sm:w-44">
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                aria-label="Filter by date"
                className={`w-full h-10 pl-3 pr-8 bg-white border border-brand-border rounded-xl text-sm focus:ring-2 focus:ring-goat-primary outline-none transition-all ${
                  dateFilter ? "text-brand-black font-semibold" : "text-brand-gray"
                }`}
              />
              {dateFilter && (
                <button
                  type="button"
                  onClick={() => setDateFilter("")}
                  aria-label="Clear date filter"
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-brand-gray hover:text-red-600 transition-colors"
                >
                  <X size={15} />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bulk status update bar — appears when orders are selected */}
        {selectedIds.size > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-goat-tint border border-goat-primary/30 rounded-xl px-4 py-3 animate-in fade-in slide-in-from-top-1">
            <span className="text-sm font-bold text-goat-text shrink-0">
              {selectedIds.size} selected
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full sm:w-auto">
              <span className="text-xs font-semibold text-brand-gray uppercase tracking-wide shrink-0 sm:mr-1">
                Set status to
              </span>
              <div className="w-full sm:w-48">
                <CustomSelect
                  options={STATUS_CHOICES}
                  value={bulkStatus}
                  onChange={(val) => setBulkStatus(val as OrderStatus)}
                  theme="goat"
                />
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={clearSelection}
                  className="flex-1 sm:flex-none text-sm font-semibold text-brand-black bg-white border border-brand-border hover:bg-brand-light-gray h-9 px-4 rounded-lg transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={doBulkStatusUpdate}
                  disabled={isBulkUpdating}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-sm font-bold text-white bg-goat-primary hover:bg-goat-hover h-9 px-4 rounded-lg transition-colors shadow-sm disabled:bg-neutral-400"
                >
                  <RefreshCw size={15} className={isBulkUpdating ? "animate-spin" : ""} />
                  {isBulkUpdating ? "Updating..." : "Update status"}
                </button>
                <button
                  onClick={() => setShowBulkDeleteConfirm(true)}
                  disabled={isBulkDeleting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 text-sm font-bold text-red-600 bg-white border border-red-200 hover:bg-red-50 h-9 px-4 rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {/* List — grouped date-wise */}
        {isLoading ? (
          <div className="bg-white border border-brand-border rounded-2xl shadow-card p-12 text-center text-brand-gray flex flex-col items-center gap-3">
            <div className="animate-spin text-goat-primary">
              <FileText size={40} />
            </div>
            <p className="text-sm font-semibold">Loading orders...</p>
          </div>
        ) : error ? (
          <div className="bg-white border border-brand-border rounded-2xl shadow-card p-12 text-center text-red-600">
            <p className="text-sm font-semibold">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-2 text-xs font-semibold underline text-brand-black"
            >
              Try Again
            </button>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="bg-white border border-brand-border rounded-2xl shadow-card p-12 text-center text-brand-gray">
            <FileText size={40} className="mx-auto mb-3 text-neutral-300" />
            <p className="text-sm font-semibold">No orders found</p>
            <p className="text-xs mt-1">Orders placed by customers will show up here.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {groupedOrders.map((group) => (
              <div
                key={group.key}
                className="bg-white border border-brand-border rounded-2xl shadow-card overflow-hidden"
              >
                {/* Date header */}
                <div className="flex items-center justify-between gap-3 px-4 md:px-6 py-3 bg-brand-light-gray/60 border-b border-brand-border">
                  <label className="flex items-center gap-2.5 min-w-0 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isGroupAllSelected(group.items)}
                      onChange={() => toggleGroup(group.items)}
                      className="w-4 h-4 shrink-0 accent-goat-primary rounded border-brand-border cursor-pointer"
                      title="Select all orders on this date"
                    />
                    <CalendarDays size={16} className="text-goat-primary shrink-0" />
                    <h3 className="text-sm font-bold text-brand-black tracking-wide truncate">
                      {group.label}
                    </h3>
                    <span className="shrink-0 text-[11px] font-bold text-brand-gray bg-white border border-brand-border rounded-full px-2.5 py-0.5">
                      {group.items.length} {group.items.length === 1 ? "order" : "orders"}
                    </span>
                  </label>
                  <span className="shrink-0 text-sm font-bold text-goat-text">
                    ₹{group.total.toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="text-brand-gray font-semibold text-xs border-b border-brand-border">
                        <th className="pl-4 md:pl-6 pr-1 py-2.5 w-8"></th>
                        <th className="px-4 md:px-6 py-2.5">Order Number</th>
                        <th className="px-4 md:px-6 py-2.5">Customer</th>
                        <th className="px-4 md:px-6 py-2.5">Items Qty</th>
                        <th className="px-4 md:px-6 py-2.5">Total Amount</th>
                        <th className="px-4 md:px-6 py-2.5">Time</th>
                        <th className="px-4 md:px-6 py-2.5">Status</th>
                        <th className="px-4 md:px-6 py-2.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border text-sm">
                      {group.items.map((order) => {
                        const totalQty = order.items.reduce((acc, item) => acc + item.quantity, 0);
                        return (
                          <tr
                            key={order._id}
                            className={`transition-colors ${
                              selectedIds.has(order._id)
                                ? "bg-goat-tint/50"
                                : "hover:bg-brand-light-gray/50"
                            }`}
                          >
                            <td className="pl-4 md:pl-6 pr-1 py-4">
                              <input
                                type="checkbox"
                                checked={selectedIds.has(order._id)}
                                onChange={() => toggleOne(order._id)}
                                className="w-4 h-4 accent-goat-primary rounded border-brand-border cursor-pointer"
                                aria-label={`Select order ${order.orderNumber}`}
                              />
                            </td>
                            <td className="px-4 md:px-6 py-4 font-mono font-semibold text-brand-black">
                              <span className="inline-flex items-center gap-2">
                                {order.orderNumber}
                                {order.orderType === "custom" && (
                                  <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-rose-text bg-rose-tint border border-rose-primary/30 rounded-full px-2 py-0.5">
                                    Custom
                                  </span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 md:px-6 py-4">
                              <div className="font-semibold text-brand-black">{order.customerName}</div>
                              <div className="text-xs text-brand-gray flex items-center gap-1 mt-0.5">
                                <Phone size={12} className="text-neutral-400" />
                                <span>{order.phone}</span>
                              </div>
                            </td>
                            <td className="px-4 md:px-6 py-4 font-semibold text-brand-black">
                              {totalQty}
                            </td>
                            <td className="px-4 md:px-6 py-4 font-bold text-brand-black">
                              ₹{order.totalAmount}
                            </td>
                            <td className="px-4 md:px-6 py-4 text-brand-gray">
                              {new Date(order.createdAt).toLocaleTimeString("en-IN", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </td>
                            <td className="px-4 md:px-6 py-4">
                              <StatusBadge status={order.status} />
                            </td>
                            <td className="px-4 md:px-6 py-4 text-right">
                              <div className="inline-flex items-center gap-2">
                                <Link
                                  href={`/admin/orders/${order._id}`}
                                  className="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-full border border-brand-border text-brand-black hover:bg-brand-light-gray transition-colors"
                                >
                                  Manage
                                </Link>
                                <button
                                  onClick={() => setOrderPendingDelete(order)}
                                  aria-label={`Delete order ${order.orderNumber}`}
                                  className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-brand-border text-red-600 hover:bg-red-50 hover:border-red-200 transition-colors"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Single-order delete confirmation */}
      <TypeToConfirmDialog
        isOpen={!!orderPendingDelete}
        title="Delete this order?"
        message={
          orderPendingDelete
            ? `This will permanently delete order ${orderPendingDelete.orderNumber} for ${orderPendingDelete.customerName}. This cannot be undone.`
            : ""
        }
        confirmWord={orderPendingDelete?.orderNumber || ""}
        confirmLabel="Delete Order"
        cancelLabel="Cancel"
        isLoading={isDeletingSingle}
        onConfirm={doDeleteSingle}
        onCancel={() => setOrderPendingDelete(null)}
      />

      {/* Bulk delete confirmation */}
      <TypeToConfirmDialog
        isOpen={showBulkDeleteConfirm}
        title="Delete selected orders?"
        message={`This will permanently delete ${selectedIds.size} order(s). This cannot be undone.`}
        confirmWord="DELETE"
        confirmLabel={`Delete ${selectedIds.size} Order(s)`}
        cancelLabel="Cancel"
        isLoading={isBulkDeleting}
        onConfirm={doBulkDelete}
        onCancel={() => setShowBulkDeleteConfirm(false)}
      />
    </div>
  );
}
