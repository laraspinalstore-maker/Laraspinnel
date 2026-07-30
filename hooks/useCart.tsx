"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  /** Optional customer-written customization note (e.g. "Add name 'Priya', pink ribbon"). */
  customText?: string;
  /** Optional customer-uploaded reference image for the customization request. */
  customImage?: string;
}

// Same product with a different customization note/image is treated as a distinct cart line.
const lineKey = (productId: string, customText?: string, customImage?: string) =>
  `${productId}::${(customText || "").trim()}::${customImage || ""}`;

// Best-effort cleanup so a customer's uploaded reference image doesn't sit
// orphaned in ImageKit storage once its cart line is gone. Never blocks the
// cart update on failure — the DB record disappearing is what matters to the
// customer; a leftover file is a (rare) storage-cost issue, not a UX one.
function deleteCustomerImage(url?: string) {
  if (!url) return;
  fetch("/api/customer-upload", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  }).catch(() => {});
}

interface CartContextType {
  cart: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string, customText?: string, customImage?: string) => void;
  updateQuantity: (productId: string, quantity: number, customText?: string, customImage?: string) => void;
  updateCustomization: (
    productId: string,
    oldCustomText: string | undefined,
    oldCustomImage: string | undefined,
    updates: { customText?: string; customImage?: string }
  ) => void;
  clearCart: () => void;
  cartCount: number;
  cartTotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Load cart from localStorage on mount.
  //
  // The stored value was previously fed straight into state, so anything that had
  // written to `lp_cart` — a stale format from an older release, or a tampered
  // value — could put a non-array or wrongly-shaped object into the cart and
  // crash every component that maps over it. Prices here are display-only
  // regardless: app/api/orders/route.ts recomputes every amount from the
  // database and ignores what the client sends.
  useEffect(() => {
    const savedCart = localStorage.getItem("lp_cart");
    if (savedCart) {
      try {
        const parsed: unknown = JSON.parse(savedCart);
        const clean = Array.isArray(parsed)
          ? (parsed.filter(
              (item): item is CartItem =>
                Boolean(item) &&
                typeof item === "object" &&
                typeof (item as CartItem).productId === "string" &&
                typeof (item as CartItem).name === "string" &&
                Number.isFinite((item as CartItem).price) &&
                Number.isInteger((item as CartItem).quantity) &&
                (item as CartItem).quantity > 0
            ) as CartItem[])
          : [];
        setCart(clean);
      } catch (err) {
        console.error("Failed to parse cart from localStorage", err);
      }
    }
    setIsHydrated(true);
  }, []);

  // Sync cart to localStorage whenever it changes
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem("lp_cart", JSON.stringify(cart));
    }
  }, [cart, isHydrated]);

  const addItem = (item: Omit<CartItem, "quantity">, quantity = 1) => {
    setCart((prev) => {
      const key = lineKey(item.productId, item.customText, item.customImage);
      const existing = prev.find((i) => lineKey(i.productId, i.customText, i.customImage) === key);
      if (existing) {
        return prev.map((i) =>
          lineKey(i.productId, i.customText, i.customImage) === key
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, { ...item, quantity }];
    });
  };

  const removeItem = (productId: string, customText?: string, customImage?: string) => {
    const key = lineKey(productId, customText, customImage);
    setCart((prev) => prev.filter((i) => lineKey(i.productId, i.customText, i.customImage) !== key));
    deleteCustomerImage(customImage);
  };

  const updateQuantity = (productId: string, quantity: number, customText?: string, customImage?: string) => {
    if (quantity <= 0) {
      removeItem(productId, customText, customImage);
      return;
    }
    const key = lineKey(productId, customText, customImage);
    setCart((prev) =>
      prev.map((i) => (lineKey(i.productId, i.customText, i.customImage) === key ? { ...i, quantity } : i))
    );
  };

  const updateCustomization = (
    productId: string,
    oldCustomText: string | undefined,
    oldCustomImage: string | undefined,
    updates: { customText?: string; customImage?: string }
  ) => {
    const oldKey = lineKey(productId, oldCustomText, oldCustomImage);
    setCart((prev) =>
      prev.map((i) =>
        lineKey(i.productId, i.customText, i.customImage) === oldKey
          ? { ...i, customText: updates.customText, customImage: updates.customImage }
          : i
      )
    );
    // Only delete the old image if it was actually replaced/removed, not if
    // the customer kept the same one.
    if (oldCustomImage && oldCustomImage !== updates.customImage) {
      deleteCustomerImage(oldCustomImage);
    }
  };

  const clearCart = () => {
    for (const item of cart) {
      deleteCustomerImage(item.customImage);
    }
    setCart([]);
  };

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cart,
        addItem,
        removeItem,
        updateQuantity,
        updateCustomization,
        clearCart,
        cartCount,
        cartTotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
