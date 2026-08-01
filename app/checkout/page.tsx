"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/hooks/useCart";
import { useSettings } from "@/hooks/useSettings";
import { ShoppingBag, ChevronRight, ArrowLeft, Phone, ShieldCheck, Heart, FileText, CheckCircle2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import AlertCard from "@/components/ui/AlertCard";
import { toErrorMessage } from "@/lib/errorMessage";

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useCart();
  const { settings } = useSettings();

  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    pincode: "",
    notes: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<{ orderNumber: string; id: string } | null>(null);
  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  const contactPhone = settings.contact_phone || "+91 9442379832";
  const contactWhatsapp = settings.contact_whatsapp || "+91 9442379832";
  const whatsappFormatted = contactWhatsapp.replace(/[^\d+]/g, "");
  const whatsappUrl = `https://wa.me/${whatsappFormatted}?text=Hi Lara's Pinnal, I placed an order!`;

  const validate = () => {
    const tempErrors: Record<string, string> = {};
    if (!formData.customerName.trim()) tempErrors.customerName = "Name is required.";
    if (!formData.phone.trim()) {
      tempErrors.phone = "Mobile number is required.";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      tempErrors.phone = "Enter a valid 10-digit mobile number.";
    }
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      tempErrors.email = "Enter a valid email address.";
    }
    if (!formData.address.trim()) tempErrors.address = "Delivery address is required.";
    if (!formData.city.trim()) tempErrors.city = "City is required.";
    if (!formData.pincode.trim()) {
      tempErrors.pincode = "Pincode is required.";
    } else if (!/^\d{6}$/.test(formData.pincode.trim())) {
      tempErrors.pincode = "Pincode must be 6 digits.";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const orderItems = cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
        customText: item.customText,
        customImage: item.customImage,
      }));

      const payload = {
        ...formData,
        items: orderItems,
      };

      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to place order.");
      }

      setPlacedOrder({ orderNumber: data.orderNumber, id: data.id });
      clearCart();
    } catch (err) {
      setAlertMessage(toErrorMessage(err, "An error occurred while placing order."));
    } finally {
      setIsSubmitting(false);
    }
  };

  // If order is successfully placed, show success screen
  if (placedOrder) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Navbar />

        <main id="main-content" tabIndex={-1} className="flex-1 max-w-xl mx-auto px-4 md:px-6 py-20 flex flex-col items-center justify-center text-center space-y-8 animate-in fade-in">
          <div className="w-20 h-20 rounded-full bg-primary-tint border border-primary/10 flex items-center justify-center shadow-md animate-bounce">
            <CheckCircle2 size={48} className="text-primary" />
          </div>

          <div className="space-y-3">
            <h1 className="font-display text-3xl md:text-4xl text-brand-black uppercase tracking-wide">
              Order Placed!
            </h1>
            <p className="text-sm font-semibold text-brand-black">
              Order Number: <span className="text-primary select-all">{placedOrder.orderNumber}</span>
            </p>
            <p className="text-xs text-brand-gray max-w-sm mx-auto leading-relaxed">
              Thank you for supporting handcrafted art! We will contact you shortly on WhatsApp or phone to confirm shipping details and delivery date.
              {formData.email.trim() && ` A confirmation email is also on its way to ${formData.email.trim()}.`}
            </p>
          </div>

          <div className="w-full bg-brand-light-gray/30 border border-brand-border rounded-2xl p-6 space-y-4">
            <h3 className="font-bold text-sm text-brand-black uppercase tracking-wider">Confirm Your Order Quickly</h3>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 bg-[#25D366] hover:bg-[#20ba59] text-white font-bold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <FaWhatsapp size={18} /> Chat on WhatsApp
              </a>
              <a
                href={`tel:${contactPhone}`}
                className="flex-1 bg-brand-black hover:bg-primary text-white font-bold py-3 px-4 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
              >
                <Phone size={16} /> Call Us
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
            <Link
              href={`/track-order?order=${encodeURIComponent(placedOrder.orderNumber)}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Track This Order <ChevronRight size={16} />
            </Link>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              <ArrowLeft size={16} /> Continue Shopping
            </Link>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // If cart is empty during checkout
  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white flex flex-col justify-between">
        <Navbar />
        <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-20 text-center space-y-4 flex flex-col items-center justify-center">
          <ShoppingBag className="mx-auto text-neutral-300 animate-pulse" size={56} />
          {/* An <h1>, not an <h2>: this branch renders the entire page, so an
              <h2> left the document with no top-level heading at all. */}
          <h1 className="text-lg font-bold text-brand-black">No Items to Checkout</h1>
          <p className="text-xs text-brand-gray">Your cart is currently empty. Add items before checking out.</p>
          <Link href="/shop" className="bg-brand-black hover:bg-primary text-white font-bold py-3 px-6 rounded-full transition-all shadow-md">
            Browse Shop
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <AlertCard
        title="Order Not Placed"
        message={alertMessage ?? ""}
        onClose={() => setAlertMessage(null)}
      />

      <main id="main-content" tabIndex={-1} className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-16 w-full space-y-8 animate-in fade-in">
        {/* Page Header */}
        <div className="space-y-3 pb-6">
          <h1 className="font-display text-3xl sm:text-5xl text-brand-black tracking-wide uppercase">
            Order Checkout
          </h1>
          <p className="text-sm font-medium text-brand-gray">
            Fill in your billing details to finalize your crochet order. No online payment required.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Checkout Form (7 cols) */}
          <form id="checkout-form" onSubmit={handleSubmit} className="lg:col-span-7 space-y-6">
            <div className="bg-white border border-brand-border rounded-2xl p-5 md:p-8 space-y-5 shadow-card">
              <h2 className="text-lg font-bold text-brand-black uppercase tracking-wider pb-3 flex items-center gap-2">
                <FileText size={18} className="text-primary" /> Delivery Information
              </h2>

              {/* Name */}
              <div className="space-y-1.5">
                <label htmlFor="customerName" className="text-xs font-bold text-brand-black uppercase">Full Name</label>
                <input
                  type="text"
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  className={`w-full h-11 px-4 bg-brand-light-gray/30 border ${errors.customerName ? "border-red-500" : "border-brand-border"} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all`}
                />
                {errors.customerName && <p className="text-xs font-medium text-red-500">{errors.customerName}</p>}
              </div>

              {/* Mobile Number */}
              <div className="space-y-1.5">
                <label htmlFor="phone" className="text-xs font-bold text-brand-black uppercase">Mobile Number</label>
                <input
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter 10-digit mobile number"
                  className={`w-full h-11 px-4 bg-brand-light-gray/30 border ${errors.phone ? "border-red-500" : "border-brand-border"} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all`}
                />
                {errors.phone && <p className="text-xs font-medium text-red-500">{errors.phone}</p>}
              </div>

              {/* Email Address */}
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <label htmlFor="email" className="text-xs font-bold text-brand-black uppercase">Email Address</label>
                  <span className="text-[10px] text-brand-gray">Optional</span>
                </div>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="you@example.com — for an order confirmation email"
                  className={`w-full h-11 px-4 bg-brand-light-gray/30 border ${errors.email ? "border-red-500" : "border-brand-border"} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all`}
                />
                {errors.email && <p className="text-xs font-medium text-red-500">{errors.email}</p>}
              </div>

              {/* Address */}
              <div className="space-y-1.5">
                <label htmlFor="address" className="text-xs font-bold text-brand-black uppercase">Street Address</label>
                <textarea
                  id="address"
                  name="address"
                  rows={3}
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="Enter building number, street name, and area"
                  className={`w-full p-4 bg-brand-light-gray/30 border ${errors.address ? "border-red-500" : "border-brand-border"} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none`}
                />
                {errors.address && <p className="text-xs font-medium text-red-500">{errors.address}</p>}
              </div>

              {/* City & Pincode */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="city" className="text-xs font-bold text-brand-black uppercase">City</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    placeholder="Enter city"
                    className={`w-full h-11 px-4 bg-brand-light-gray/30 border ${errors.city ? "border-red-500" : "border-brand-border"} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all`}
                  />
                  {errors.city && <p className="text-xs font-medium text-red-500">{errors.city}</p>}
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="pincode" className="text-xs font-bold text-brand-black uppercase">Pincode</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    id="pincode"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleInputChange}
                    placeholder="6-digit pincode"
                    className={`w-full h-11 px-4 bg-brand-light-gray/30 border ${errors.pincode ? "border-red-500" : "border-brand-border"} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all`}
                  />
                  {errors.pincode && <p className="text-xs font-medium text-red-500">{errors.pincode}</p>}
                </div>
              </div>

              {/* Custom Order Notes */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <label htmlFor="notes" className="text-xs font-bold text-brand-black uppercase">Order Notes</label>
                  <span className="text-[10px] text-brand-gray font-semibold">Optional</span>
                </div>
                <textarea
                  id="notes"
                  name="notes"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Specify custom letters, colors, or details here..."
                  className="w-full p-4 bg-brand-light-gray/30 border border-brand-border rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
                />
              </div>
            </div>
          </form>

          {/* Cart Summary & Trust (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Cart Summary Card */}
            <div className="bg-brand-light-gray/30 border border-brand-border rounded-2xl p-6 space-y-4 shadow-card">
              <h2 className="font-display text-lg text-brand-black uppercase tracking-wide pb-3">
                Order Summary
              </h2>

              <div className="divide-y divide-brand-border/60 max-h-60 overflow-y-auto pr-1">
                {cart.map((item) => (
                  <div key={`${item.productId}-${item.customText || ""}-${item.customImage || ""}`} className="py-3 flex justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <p className="font-semibold text-brand-black truncate">{item.name}</p>
                      <p className="text-xs text-brand-gray font-medium">Qty: {item.quantity} &times; ₹{item.price}</p>
                      {item.customText && (
                        <p className="text-xs text-primary-text italic truncate mt-0.5" title={item.customText}>
                          Custom: {item.customText}
                        </p>
                      )}
                      {item.customImage && (
                        <div className="relative w-8 h-8 rounded-md overflow-hidden border border-primary/30 mt-1">
                          <Image
                            src={item.customImage}
                            alt="Customization reference"
                            fill
                            sizes="32px"
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-brand-black shrink-0">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 text-sm space-y-2">
                <div className="flex justify-between">
                  <span className="text-brand-gray font-medium">Subtotal:</span>
                  <span className="font-bold text-brand-black">₹{cartTotal}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-brand-gray font-medium">Delivery:</span>
                  {(() => {
                    const deliveryFeeSetting = parseFloat(settings.delivery_fee) || 0;
                    const isFreeDeliveryEnabled = settings.is_free_delivery_enabled === "true";
                    const freeDeliveryThreshold = parseFloat(settings.free_delivery_threshold) || 0;
                    
                    const isFreeDelivery = isFreeDeliveryEnabled && cartTotal >= freeDeliveryThreshold;
                    const deliveryFee = isFreeDelivery || deliveryFeeSetting === 0 ? 0 : deliveryFeeSetting;

                    return deliveryFee === 0 ? (
                      <span className="text-primary font-bold">FREE Delivery</span>
                    ) : (
                      <span className="font-bold text-brand-black">₹{deliveryFee}</span>
                    );
                  })()}
                </div>
                <div className="pt-3 flex justify-between text-base">
                  <span className="font-bold text-brand-black">Total Amount:</span>
                  <span className="font-extrabold text-brand-black text-lg">
                    ₹{(() => {
                      const deliveryFeeSetting = parseFloat(settings.delivery_fee) || 0;
                      const isFreeDeliveryEnabled = settings.is_free_delivery_enabled === "true";
                      const freeDeliveryThreshold = parseFloat(settings.free_delivery_threshold) || 0;
                      
                      const isFreeDelivery = isFreeDeliveryEnabled && cartTotal >= freeDeliveryThreshold;
                      const deliveryFee = isFreeDelivery || deliveryFeeSetting === 0 ? 0 : deliveryFeeSetting;
                      return cartTotal + deliveryFee;
                    })()}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                form="checkout-form"
                disabled={isSubmitting}
                className="w-full bg-brand-black hover:bg-primary text-white font-bold py-3.5 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-md disabled:bg-neutral-400 disabled:cursor-not-allowed text-base"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Place Order <ChevronRight size={18} /></>
                )}
              </button>
            </div>

            {/* Trust Signpost card */}
            <div className="border border-brand-border rounded-2xl p-5 bg-white space-y-3.5 shadow-sm">
              <div className="flex items-center gap-3">
                <ShieldCheck size={36} className="text-primary shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-brand-black uppercase tracking-wider">Safe & Secure Booking</h4>
                  <p className="text-[10px] text-brand-gray">No advance payment card details needed. Pay after order verification.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-3.5">
                <Heart size={36} className="text-red-400 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-brand-black uppercase tracking-wider">Handcrafted Art Guarantee</h4>
                  <p className="text-[10px] text-brand-gray">Every stitch is handcrafted by our local artisan with utmost care.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
