"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import ImageUploadDropzone from "@/components/admin/ImageUploadDropzone";
import { useCart } from "@/hooks/useCart";
import { ShoppingCart, ShoppingBag, Plus, Minus } from "lucide-react";

/**
 * Quantity, customisation inputs, and the Add to Cart / Buy Now actions.
 *
 * These must stay in ONE island. The customisation note and reference image are
 * part of the cart line's identity (useCart keys a line on productId plus
 * customText plus customImage), so splitting the inputs away from the handlers
 * that read them would let a line be added without the customisation the visitor
 * just entered.
 */

interface ProductPurchasePanelProps {
  productId: string;
  name: string;
  /** The price actually charged — discountPrice when present, else price. */
  price: number;
  /** First product image, used as the cart line's thumbnail. */
  image: string;
  /** Upper bound for the quantity stepper. */
  stock: number;
}

export default function ProductPurchasePanel({
  productId,
  name,
  price,
  image,
  stock,
}: ProductPurchasePanelProps) {
  const router = useRouter();
  const { addItem } = useCart();

  const [quantity, setQuantity] = useState(1);
  const [successMsg, setSuccessMsg] = useState("");
  const [customText, setCustomText] = useState("");
  const [customImage, setCustomImage] = useState("");

  const buildLine = () => ({
    productId,
    name,
    price,
    image,
    customText: customText.trim() || undefined,
    customImage: customImage || undefined,
  });

  const handleAddToCart = () => {
    addItem(buildLine(), quantity);
    setSuccessMsg("Added to cart successfully!");
    setTimeout(() => setSuccessMsg(""), 3000);
  };

  const handleBuyNow = () => {
    addItem(buildLine(), quantity);
    router.push("/cart");
  };

  return (
    <div className="order-3 md:order-3 md:col-span-7 space-y-4">
      {/* Custom design instructions */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <label htmlFor="customText" className="text-sm font-semibold text-primary-text">
            Customize Your Order
          </label>
          <span className="text-[10px] text-brand-gray">Optional</span>
        </div>
        <textarea
          id="customText"
          rows={4}
          maxLength={300}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="e.g. Add name 'Priya', change ribbon color to pink..."
          className="w-full p-3 bg-primary-tint/20 border border-primary/25 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary transition-all resize-none"
        />
      </div>

      {/* Reference image upload */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-semibold text-primary-text">
            Upload Reference Image
          </span>
          <span className="text-[10px] text-brand-gray">Optional</span>
        </div>
        <ImageUploadDropzone
          value={customImage ? [customImage] : []}
          onChange={(urls) => setCustomImage(urls[urls.length - 1] || "")}
          maxFiles={1}
          endpoint="/api/customer-upload"
        />
      </div>

      {/* Quantity picker */}
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-primary-text">Quantity:</span>
        <div className="flex items-center border border-primary/25 rounded-xl bg-primary-tint/20 h-10 overflow-hidden">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            className="px-3 h-full hover:bg-primary-tint transition-colors text-brand-black"
            aria-label="Decrease quantity"
          >
            <Minus size={14} />
          </button>
          <span className="w-10 text-center text-sm font-bold text-brand-black" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(stock, q + 1))}
            className="px-3 h-full hover:bg-primary-tint transition-colors text-brand-black"
            aria-label="Increase quantity"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Checkout buttons */}
      <div className="flex flex-col lg:flex-row gap-3 pt-2">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 bg-white hover:bg-brand-light-gray text-brand-black border border-brand-border font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <ShoppingCart size={18} aria-hidden="true" /> Add to Cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex-1 bg-brand-black hover:bg-primary text-white font-bold py-3 px-6 rounded-full transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <ShoppingBag size={18} aria-hidden="true" /> Buy Now
        </button>
      </div>

      {/* Success alert message */}
      {successMsg && (
        <p
          role="status"
          aria-live="polite"
          className="text-sm text-primary font-semibold text-center mt-2 animate-pulse"
        >
          {successMsg}
        </p>
      )}
    </div>
  );
}
