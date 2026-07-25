"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useScrollNavbar } from "@/hooks/useScrollNavbar";
import { useSettings } from "@/hooks/useSettings";
import { Phone, ShoppingCart, Home, ShoppingBag, LayoutGrid, Info, Search } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";
import { useCart } from "@/hooks/useCart";

export default function Navbar() {
  const pathname = usePathname();
  const { isScrolled } = useScrollNavbar();
  const { settings } = useSettings();
  const { cartCount } = useCart();

  const whatsapp = settings.contact_whatsapp || "+91 9442379832";
  const whatsappFormatted = whatsapp.replace(/[^\d+]/g, "");
  const whatsappUrl = `https://wa.me/${whatsappFormatted}`;

  const navLinks = [
    { name: "Home", href: "/" },
    { name: "Shop", href: "/shop" },
    { name: "Categories", href: "/categories" },
    { name: "About", href: "/about" },
    { name: "Enquiry", href: "/contact" },
    { name: "Track Order", href: "/track-order" },
  ];

  const bottomLinks = [
    { name: "Home", href: "/", icon: Home },
    { name: "Shop", href: "/shop", icon: ShoppingBag },
    { name: "Categories", href: "/categories", icon: LayoutGrid },
    { name: "About", href: "/about", icon: Info },
    { name: "Enquiry", href: "/contact", icon: Phone },
  ];

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 transform translate-y-0 ${
          isScrolled
            ? "bg-white/85 backdrop-blur-md shadow-navbar border-b border-brand-border"
            : "bg-white border-b border-brand-border/60"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            {settings.logo_url && (
              <Image
                src={settings.logo_url}
                alt={settings.farm_name || "Lara's Pinnal"}
                width={200}
                height={40}
                sizes="200px"
                quality={75}
                priority
                className="h-8 md:h-10 w-auto object-contain"
              />
            )}
            <span className="font-display text-xl md:text-4xl tracking-wider text-brand-black group-hover:text-goat-primary transition-colors uppercase truncate max-w-[130px] min-[375px]:max-w-[180px] sm:max-w-none leading-none translate-y-[2px]">
              {settings.farm_name || "Lara's Pinnal"}
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden xl:flex items-center gap-6">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.name}
                  href={link.href}
                  className={`text-sm font-semibold relative py-1 transition-colors ${
                    isActive
                      ? "text-goat-primary"
                      : "text-brand-black hover:text-goat-primary"
                  }`}
                >
                  {link.name}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-goat-primary rounded-full animate-in fade-in duration-300"></span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Actions (Desktop) */}
          <div className="hidden xl:flex items-center gap-4">
            {/* Search */}
            <Link
              href="/shop"
              className="p-2 text-brand-black hover:text-goat-primary hover:bg-brand-light-gray rounded-full transition-all border border-transparent hover:border-brand-border"
              title="Search"
              aria-label="Search"
            >
              <Search size={18} strokeWidth={1.8} />
            </Link>

            {/* WhatsApp */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 text-[#25D366] hover:bg-[#25D366]/10 rounded-full transition-all border border-transparent hover:border-[#25D366]/20"
              title="Chat on WhatsApp"
              aria-label="Chat on WhatsApp"
            >
              <FaWhatsapp size={20} />
            </a>

            {/* Cart Button — count appears as a badge on top of the icon */}
            <Link
              href="/cart"
              aria-label={`View Cart${cartCount > 0 ? ` (${cartCount} items)` : ""}`}
              className="bg-brand-black hover:bg-goat-primary text-white text-sm font-semibold px-5 py-2 rounded-full shadow-sm hover:shadow transition-all duration-200 flex items-center gap-2.5"
            >
              <span className="relative">
                <ShoppingCart size={17} />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2.5 min-w-4 h-4 px-1 bg-rose-text text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-xs animate-in zoom-in duration-200">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </span>
              <span>Cart</span>
            </Link>
          </div>

          {/* Mobile controls (Mobile & Tablet) */}
          <div className="flex xl:hidden items-center gap-2">
            {/* Tablet-only icon nav */}
            <div className="hidden md:flex xl:hidden items-center gap-2 pr-2 mr-1 border-r border-brand-border">
              {bottomLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.name}
                    href={link.href}
                    title={link.name}
                    aria-label={link.name}
                    className={`p-2 min-w-11 min-h-11 flex items-center justify-center rounded-full transition-colors ${
                      isActive
                        ? "text-goat-primary bg-goat-tint"
                        : "text-brand-black hover:bg-brand-light-gray hover:text-goat-primary"
                    }`}
                  >
                    <link.icon size={18} strokeWidth={isActive ? 2.2 : 1.8} />
                  </Link>
                );
              })}
              <Link
                href="/shop"
                title="Search"
                aria-label="Search"
                className="p-2 min-w-11 min-h-11 flex items-center justify-center rounded-full text-brand-black hover:bg-brand-light-gray hover:text-goat-primary transition-colors"
              >
                <Search size={18} strokeWidth={1.8} />
              </Link>
            </div>

            {/* Search — mobile only */}
            <Link
              href="/shop"
              className="md:hidden p-2 min-w-11 min-h-11 flex items-center justify-center text-brand-black hover:bg-brand-light-gray rounded-full transition-colors"
              aria-label="Search"
            >
              <Search size={18} />
            </Link>

            {/* Direct Cart Button for mobile/tablet */}
            <Link
              href="/cart"
              className="relative p-2 min-w-11 min-h-11 flex items-center justify-center text-brand-black hover:bg-brand-light-gray rounded-full transition-colors"
              aria-label="View Cart"
            >
              <ShoppingCart size={20} />
              {cartCount > 0 && (
                <span className="absolute top-0.5 right-0.5 min-w-4 h-4 px-1 bg-rose-text text-white text-[8px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </header>

      {/* Spacer to push page content down */}
      <div className="h-14 md:h-16"></div>

      {/* Fixed Bottom Navigation Bar (Mobile only) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white text-neutral-500 border-t border-neutral-200 md:hidden h-[3.75rem] shadow-[0_-2px_10px_rgba(0,0,0,0.08)]">
        <div className="flex items-center justify-around h-full px-2 max-w-md mx-auto">
          {bottomLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.name}
                href={link.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-1.5 transition-all duration-200 select-none ${
                  isActive
                    ? "text-goat-primary"
                    : "text-neutral-500 hover:text-neutral-800"
                }`}
              >
                <link.icon size={20} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[9px] font-bold uppercase tracking-wider">
                  {link.name}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}
