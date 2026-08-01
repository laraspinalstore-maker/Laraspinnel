"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import AdminTopbar from "@/components/admin/AdminTopbar";
import CustomSelect from "@/components/shared/CustomSelect";
import StatusBadge, { OrderStatus } from "@/components/admin/StatusBadge";
import TypeToConfirmDialog from "@/components/admin/TypeToConfirmDialog";
import { useToast } from "@/components/admin/Toast";
import { useSettings } from "@/hooks/useSettings";
import { ArrowLeft, Save, Calendar, Phone, MapPin, User, FileText, ShoppingCart, Trash2, Images, Sparkles, X, ImageOff } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { DEFAULT_WHATSAPP_ORDER_TEMPLATE, renderWhatsAppTemplate, getWhatsAppLink } from "@/lib/whatsappTemplate";
import { safeUrl } from "@/lib/security/url";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  customText?: string;
  customImage?: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  customerName: string;
  phone: string;
  email?: string;
  address: string;
  city: string;
  pincode: string;
  notes?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  totalAmount: number;
  status: OrderStatus;
  orderType?: "shop" | "custom";
  referenceImages?: string[];
  customDetails?: {
    occasion?: string;
    colors?: string[];
    size?: string;
    quantityLabel?: string;
    personalization?: string;
    requirements?: string;
    preferredDate?: string;
    customerNote?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Renders the admin-configurable WhatsApp template (falls back to the
// default) with this order's real data substituted in.
function buildWhatsAppMessage(order: Order, shopName: string, template: string): string {
  return renderWhatsAppTemplate(template || DEFAULT_WHATSAPP_ORDER_TEMPLATE, {
    customerName: order.customerName,
    shopName,
    orderNumber: order.orderNumber,
    items: order.items,
    totalAmount: order.totalAmount,
  });
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { settings } = useSettings();
  const { showToast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("pending");
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  /** Reference image shown in the in-page lightbox; null when closed. */
  const [previewImage, setPreviewImage] = useState<{ url: string; label: string } | null>(null);
  /** URLs that failed to load, so a missing file shows a message not a broken icon. */
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  /**
   * The network half, with no state in it. Two reasons, both reported by lint on
   * the previous version: an effect must not set state synchronously (it forces a
   * render pass before first paint), and an effect calling a component function
   * that sets state cannot satisfy `exhaustive-deps` without either re-running on
   * every render or suppressing the rule.
   */
  const loadOrder = async (orderId: string): Promise<Order | null> => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) return null;
      return (await res.json()) as Order;
    } catch {
      return null;
    }
  };

  /** Refetch after a status change or a note edit. */
  const fetchOrderDetails = async () => {
    if (!id) return;
    setIsLoading(true);
    const data = await loadOrder(id);
    if (data) {
      setOrder(data);
      setSelectedStatus(data.status);
    } else {
      setError("Failed to fetch order details.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      const data = await loadOrder(id);
      // The admin can navigate away mid-request; without this the response would
      // update a component that is no longer mounted.
      if (!active) return;
      if (data) {
        setOrder(data);
        setSelectedStatus(data.status);
      } else {
        setError("Failed to fetch order details.");
      }
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [id]);

  // Escape closes the image viewer, and the page behind it stops scrolling while
  // it's open — the two things that make an overlay feel like a real dialog.
  useEffect(() => {
    if (!previewImage) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPreviewImage(null);
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [previewImage]);

  const handleStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    setIsUpdating(true);
    setError("");
    setSuccessMsg("");

    try {
      const res = await fetch(`/api/admin/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      const data = await res.json();
      if (res.ok) {
        setOrder(data);
        setSuccessMsg("Order status updated successfully!");
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setError(data.error || "Failed to update status");
      }
    } catch {
      setError("Failed to update status");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!order) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/orders/${id}`, { method: "DELETE" });
      if (res.ok) {
        showToast(`Order ${order.orderNumber} deleted successfully.`, { variant: "success" });
        router.push("/admin/orders");
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || "Failed to delete order.", { variant: "error" });
      }
    } catch {
      showToast("Failed to delete order.", { variant: "error" });
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <AdminTopbar title={order ? `Order: ${order.orderNumber}` : "Order Details"} />

      <div className="flex-1 p-3 md:p-6 space-y-6 w-full max-w-none animate-in fade-in">
        <div>
          <Link href="/admin/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-black hover:text-primary transition-colors">
            <ArrowLeft size={16} /> Back to Orders
          </Link>
        </div>

        {isLoading ? (
          <div className="bg-white border border-brand-border rounded-2xl p-12 text-center text-brand-gray animate-pulse">
            Loading order details...
          </div>
        ) : error || !order ? (
          <div className="bg-white border border-brand-border rounded-2xl p-6 text-center text-red-600">
            <p className="text-sm font-semibold">{error || "Order not found"}</p>
            <button onClick={fetchOrderDetails} className="mt-2 text-xs font-semibold underline text-brand-black">Try Again</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left Column (8 cols): Info & Products */}
            <div className="lg:col-span-8 space-y-6">
              {/* Order Metadata summary card */}
              <div className="bg-white border border-brand-border rounded-2xl p-5 md:p-6 space-y-4 shadow-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-brand-gray uppercase">Order Reference</span>
                  <h2 className="text-xl font-bold text-brand-black font-mono">{order.orderNumber}</h2>
                  <div className="flex items-center gap-1.5 text-xs text-brand-gray font-semibold">
                    <Calendar size={13} />
                    <span>Placed: {new Date(order.createdAt).toLocaleDateString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</span>
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end gap-1.5">
                  <span className="text-xs font-bold text-brand-gray uppercase">Current Status</span>
                  <StatusBadge status={order.status} />
                </div>
              </div>

              {/* Products Table Card */}
              {/* Custom request details — shown prominently for custom orders */}
              {order.orderType === "custom" && order.customDetails && (
                <div className="bg-white border border-primary/40 rounded-2xl shadow-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-brand-border bg-primary-tint/40 flex items-center gap-2">
                    <Sparkles size={18} className="text-primary" />
                    <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider">
                      Custom Request Details
                    </h3>
                    <span className="ml-auto text-[10px] font-bold uppercase tracking-wider text-rose-text bg-rose-tint border border-rose-primary/30 rounded-full px-2.5 py-0.5">
                      Custom Order
                    </span>
                  </div>

                  <div className="p-5 space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      {order.customDetails.occasion && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-brand-gray uppercase block">Occasion</span>
                          <span className="font-semibold text-brand-black">{order.customDetails.occasion}</span>
                        </div>
                      )}
                      {order.customDetails.size && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-brand-gray uppercase block">Size</span>
                          <span className="font-semibold text-brand-black">{order.customDetails.size}</span>
                        </div>
                      )}
                      {order.customDetails.quantityLabel && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-brand-gray uppercase block">Quantity</span>
                          <span className="font-semibold text-brand-black">{order.customDetails.quantityLabel}</span>
                        </div>
                      )}
                      {order.customDetails.preferredDate && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-brand-gray uppercase block">Preferred Date</span>
                          <span className="font-semibold text-brand-black">
                            {new Date(order.customDetails.preferredDate).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      )}
                    </div>

                    {order.customDetails.colors && order.customDetails.colors.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-brand-gray uppercase block">Preferred Colors</span>
                        <div className="flex flex-wrap gap-2">
                          {order.customDetails.colors.map((c) => (
                            <span
                              key={c}
                              className="text-xs font-semibold text-brand-black bg-brand-light-gray border border-brand-border rounded-full px-3 py-1"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {order.customDetails.personalization && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-brand-gray uppercase block">Personalization (Name / Text)</span>
                        <p className="text-sm font-semibold text-primary-text bg-primary-tint border border-primary/20 rounded-xl px-4 py-3 whitespace-pre-line">
                          {order.customDetails.personalization}
                        </p>
                      </div>
                    )}

                    {order.customDetails.requirements && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-brand-gray uppercase block">Special Requirements</span>
                        <p className="text-sm text-brand-black bg-brand-light-gray/60 border border-brand-border rounded-xl px-4 py-3 whitespace-pre-line">
                          {order.customDetails.requirements}
                        </p>
                      </div>
                    )}

                    {order.customDetails.customerNote && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-brand-gray uppercase flex items-center gap-1">
                          <FileText size={11} /> Customer Note
                        </span>
                        <p className="text-sm text-brand-black bg-gold-tint border border-gold-primary/30 rounded-xl px-4 py-3 whitespace-pre-line">
                          {order.customDetails.customerNote}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-white border border-brand-border rounded-2xl shadow-card overflow-hidden">
                <div className="px-5 py-4 border-b border-brand-border flex items-center gap-2">
                  <ShoppingCart size={18} className="text-primary" />
                  <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider">Ordered Products</h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead>
                      <tr className="bg-brand-light-gray text-brand-gray font-semibold text-xs border-b border-brand-border">
                        <th className="px-4 py-3 w-16">Preview</th>
                        <th className="px-4 py-3">Product Name</th>
                        <th className="px-4 py-3 text-center">Price</th>
                        <th className="px-4 py-3 text-center">Qty</th>
                        <th className="px-4 py-3 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-brand-border">
                      {order.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-brand-light-gray/30 transition-colors">
                          <td className="px-4 py-3">
                            <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-brand-border bg-brand-light-gray">
                              {item.image && (
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  sizes="40px"
                                  className="object-cover"
                                />
                              )}
                            </div>
                          </td>
                          {/* max-w + align-top keep a long customization note inside this
                              column instead of pushing the price cells sideways. */}
                          <td className="px-4 py-4 align-top font-semibold text-brand-black max-w-88">
                            <div className="wrap-break-word">{item.name}</div>
                            {item.customText && (
                              /* Customers paste unbroken strings, which have no wrap
                                 opportunity — break-all forces one. whitespace-pre-wrap
                                 keeps any line breaks they actually typed. */
                              <p className="mt-1 text-xs font-medium text-primary-text bg-primary-tint border border-primary/20 rounded-lg px-2 py-1 block max-w-full whitespace-pre-wrap break-all italic">
                                <span className="not-italic font-bold">Customization: </span>
                                {item.customText}
                              </p>
                            )}
                            {item.customImage && (
                              <button
                                type="button"
                                onClick={() =>
                                  setPreviewImage({ url: item.customImage!, label: `Reference image — ${item.name}` })
                                }
                                className="mt-1.5 flex items-center gap-2 group/img text-left cursor-pointer"
                                title="View reference image"
                              >
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-primary/30 shrink-0 bg-brand-light-gray flex items-center justify-center">
                                  {brokenImages[item.customImage] ? (
                                    <ImageOff size={16} className="text-brand-gray" />
                                  ) : (
                                    <Image
                                      src={item.customImage}
                                      alt="Customer reference image"
                                      fill
                                      sizes="48px"
                                      className="object-cover group-hover/img:scale-105 transition-transform"
                                      onError={() =>
                                        setBrokenImages((prev) => ({ ...prev, [item.customImage!]: true }))
                                      }
                                    />
                                  )}
                                </div>
                                <span className="text-xs font-semibold text-primary group-hover/img:underline">
                                  {brokenImages[item.customImage] ? "Image unavailable" : "Reference Image"}
                                </span>
                              </button>
                            )}
                          </td>
                          <td className="px-4 py-4 align-top text-center text-brand-black font-semibold whitespace-nowrap">
                            ₹{item.price}
                          </td>
                          <td className="px-4 py-4 align-top text-center text-brand-black">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-4 align-top text-right font-bold text-brand-black whitespace-nowrap">
                            ₹{item.price * item.quantity}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-brand-light-gray/30 px-5 py-4 flex flex-col gap-2 border-t border-brand-border text-sm font-semibold">
                  <div className="flex justify-between">
                    <span className="text-brand-gray">Subtotal</span>
                    <span className="text-brand-black">₹{order.subtotal || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-brand-gray">Delivery Shipping</span>
                    {order.deliveryFee === 0 ? (
                      <span className="text-primary font-bold">FREE Delivery</span>
                    ) : (
                      <span className="text-brand-black">₹{order.deliveryFee || 0}</span>
                    )}
                  </div>
                </div>
                <div className="px-5 py-4 flex justify-between border-t border-brand-border text-base font-bold">
                  <span className="text-brand-black">Total Paid / Estimated</span>
                  <span className="text-brand-black text-lg">₹{order.totalAmount}</span>
                </div>
              </div>

              {/* Customer inspiration images (custom-order requests) */}
              {order.referenceImages && order.referenceImages.length > 0 && (
                <div className="bg-white border border-brand-border rounded-2xl shadow-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-brand-border flex items-center gap-2">
                    <Images size={18} className="text-primary" />
                    <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider">
                      Customer Inspiration Images
                    </h3>
                    <span className="ml-auto text-[11px] font-bold text-brand-gray bg-brand-light-gray border border-brand-border rounded-full px-2.5 py-0.5">
                      {order.referenceImages.length}
                    </span>
                  </div>
                  <div className="p-5 flex flex-wrap gap-3">
                    {order.referenceImages.map((url, i) => (
                      <button
                        key={url}
                        type="button"
                        onClick={() => setPreviewImage({ url, label: `Customer inspiration image ${i + 1}` })}
                        title="View larger"
                        className="group relative w-28 h-28 rounded-xl overflow-hidden border border-brand-border bg-brand-light-gray cursor-pointer flex items-center justify-center"
                      >
                        {brokenImages[url] ? (
                          <ImageOff size={20} className="text-brand-gray" />
                        ) : (
                          <Image
                            src={url}
                            alt={`Customer inspiration image ${i + 1}`}
                            fill
                            sizes="112px"
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            onError={() => setBrokenImages((prev) => ({ ...prev, [url]: true }))}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column (4 cols): Billing & Actions */}
            <div className="lg:col-span-4 space-y-6">
              {/* Billing Customer Card */}
              <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-4 shadow-card">
                <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider border-b border-brand-border pb-3 flex items-center gap-2">
                  <User size={18} className="text-primary" /> Delivery Client
                </h3>

                <div className="space-y-3.5 text-sm">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-gray uppercase block">Customer Name</span>
                    <span className="font-semibold text-brand-black">{order.customerName}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-gray uppercase block">Mobile Number</span>
                    <a href={`tel:${order.phone}`} className="font-semibold text-primary hover:underline flex items-center gap-1">
                      <Phone size={13} /> {order.phone}
                    </a>
                  </div>
                  {order.email && (
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-brand-gray uppercase block">Email Address</span>
                      <a href={`mailto:${order.email}`} className="font-semibold text-primary hover:underline break-all">
                        {order.email}
                      </a>
                    </div>
                  )}
                  <a
                    href={getWhatsAppLink(
                      order.phone,
                      buildWhatsAppMessage(
                        order,
                        settings.farm_name || "Lara's Pinnal",
                        settings.whatsapp_order_template || DEFAULT_WHATSAPP_ORDER_TEMPLATE
                      )
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                  >
                    <FaWhatsapp size={17} /> Message on WhatsApp
                  </a>
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-brand-gray uppercase block">Delivery Address</span>
                    <span className="text-brand-black font-semibold flex items-start gap-1">
                      <MapPin size={14} className="text-neutral-400 shrink-0 mt-0.5" />
                      <span>{order.address}, {order.city} - {order.pincode}</span>
                    </span>
                  </div>
                  {order.notes && (
                    <div className="space-y-1 pt-1.5 border-t border-brand-border/60">
                      <span className="text-[10px] font-bold text-brand-gray uppercase flex items-center gap-1"><FileText size={10} /> Client Notes</span>
                      <span className="text-xs text-brand-gray whitespace-pre-line italic">&quot;{order.notes}&quot;</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Update Card */}
              <div className="bg-white border border-brand-border rounded-2xl p-5 space-y-4 shadow-card">
                <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider border-b border-brand-border pb-3 flex items-center gap-2">
                  <Save size={18} className="text-primary" /> Update Status
                </h3>

                <form onSubmit={handleStatusUpdate} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-brand-gray">Set Order Status</label>
                    <CustomSelect
                      options={[
                        { label: "Pending Verification", value: "pending" },
                        { label: "Confirmed", value: "confirmed" },
                        { label: "Preparing / Crafting", value: "preparing" },
                        { label: "Ready to Ship", value: "ready" },
                        { label: "Delivered", value: "delivered" },
                        { label: "Cancelled", value: "cancelled" },
                      ]}
                      value={selectedStatus}
                      onChange={(val) => setSelectedStatus(val as OrderStatus)}
                      theme="primary"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="w-full bg-brand-black hover:bg-primary text-white font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm text-sm disabled:bg-neutral-400"
                  >
                    {isUpdating ? "Updating..." : <><Save size={16} /> Save Status</>}
                  </button>
                </form>

                {successMsg && (
                  <p className="text-xs font-bold text-primary text-center mt-2 animate-pulse">
                    {successMsg}
                  </p>
                )}
              </div>

              {/* Danger Zone Card */}
              <div className="bg-white border border-red-200 rounded-2xl p-5 space-y-3 shadow-card">
                <h3 className="font-bold text-sm text-red-600 uppercase tracking-wider border-b border-red-100 pb-3 flex items-center gap-2">
                  <Trash2 size={18} /> Danger Zone
                </h3>
                <p className="text-xs text-brand-gray">
                  Permanently delete this order and its record. This cannot be undone.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-bold py-2.5 px-4 rounded-xl transition-all flex items-center justify-center gap-2 text-sm"
                >
                  <Trash2 size={16} /> Delete Order
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <TypeToConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete this order?"
        message={
          order
            ? `This will permanently delete order ${order.orderNumber} for ${order.customerName}. This cannot be undone.`
            : ""
        }
        confirmWord={order?.orderNumber || ""}
        confirmLabel="Delete Order"
        cancelLabel="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* In-page reference-image viewer. Previously these thumbnails were links
          with target="_blank", which pulled the admin out of the order they were
          working on. */}
      {previewImage && (
        <div
          className="fixed inset-0 z-100 bg-black/80 flex items-center justify-center p-4 sm:p-8"
          onClick={() => setPreviewImage(null)}
          role="dialog"
          aria-modal="true"
          aria-label={previewImage.label}
        >
          <div
            className="relative w-full max-w-3xl max-h-full flex flex-col gap-3"
            // Clicks inside the panel must not fall through to the backdrop.
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-white truncate">{previewImage.label}</p>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="shrink-0 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                aria-label="Close image preview"
              >
                <X size={18} />
              </button>
            </div>

            <div className="relative w-full aspect-square sm:aspect-4/3 bg-white/5 rounded-2xl overflow-hidden border border-white/15">
              <Image
                src={previewImage.url}
                alt={previewImage.label}
                fill
                sizes="(max-width: 768px) 100vw, 768px"
                // contain, not cover: an admin needs to see the whole reference,
                // not a cropped centre.
                className="object-contain"
              />
            </div>

            <a
              href={safeUrl(previewImage.url, "#")}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-semibold text-white/70 hover:text-white underline self-start"
            >
              Open original in a new tab
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
