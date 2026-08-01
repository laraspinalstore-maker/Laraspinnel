"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { Horse } from "@phosphor-icons/react";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        email: email.toLowerCase(),
        password,
      });

      if (res?.error) {
        setError(res.error || "Invalid credentials. Please try again.");
      } else {
        router.push("/admin");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-light-gray flex flex-col items-center justify-center p-3 md:p-6">
      {/* Login Container */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-hover border border-brand-border p-3 md:p-8 space-y-6">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-primary-tint text-primary-text flex items-center justify-center border border-primary/10">
            <Horse size={36} weight="duotone" />
          </div>
          <div>
            <h2 className="font-display text-2xl md:text-3xl tracking-wide text-brand-black">
              Welcome Back
            </h2>
            <p className="text-sm text-brand-gray mt-1 font-medium">
              Sign in to manage LARA&apos;S PINNAL dashboard
            </p>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 md:p-4 rounded-xl flex items-start gap-3 animate-in fade-in duration-200">
            <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          {/* Email field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
              Email Address
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                <Mail size={16} />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full h-12 bg-white border border-brand-border rounded-xl pl-11 pr-4 text-sm text-brand-black placeholder-brand-gray focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="admin@laraspinnal.com"
              />
            </div>
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-brand-black uppercase tracking-wider block">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                <Lock size={16} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full h-12 bg-white border border-brand-border rounded-xl pl-11 pr-11 text-sm text-brand-black placeholder-brand-gray focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-gray hover:text-brand-black"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-brand-black hover:bg-primary text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-transparent shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:shadow"
          >
            {isLoading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Signing In...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        {/* Public Site Escape Link */}
        <div className="text-center">
          <Link
            href="/"
            className="text-xs font-semibold text-brand-gray hover:text-brand-black transition-colors"
          >
            ← Back to Public Website
          </Link>
        </div>
      </div>
    </div>
  );
}
