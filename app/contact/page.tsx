
"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSettings } from "@/hooks/useSettings";
import { contactMessageSchema } from "@/lib/validations";
import {
  User,
  Phone,
  Mail,
  MessageSquare,
  Send,
  Loader2,
  AlertCircle,
  CheckCircle2,
  MapPin,
  Clock,
} from "lucide-react";
import { FaWhatsapp } from "react-icons/fa6";

export default function ContactPage() {
  const { settings } = useSettings();
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const farmName = settings.farm_name || "Lara's Pinnal";
  const phone = settings.contact_phone || "+91 9442379832";
  const whatsapp = settings.contact_whatsapp || "+91 9442379832";
  const email = settings.contact_email || "senthilraguanthan2004@gmail.com";
  const address = settings.contact_address || "2/90 MettuStreet, Therkunam, Villupuram, Tamil Nadu - 604102";
  const businessHours = settings.business_hours || "Monday - Sunday: 6:00 AM - 8:00 PM";

  const whatsappFormatted = whatsapp.replace(/[^\d+]/g, "");
  const whatsappUrl = `https://wa.me/${whatsappFormatted}`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(contactMessageSchema),
    mode: "onBlur",
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  const onSubmit = async (data: any) => {
    setSubmitError("");
    setSuccess(false);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        setSuccess(true);
        reset();
      } else {
        const result = await res.json();
        setSubmitError(result.error || "Failed to submit message.");
      }
    } catch (err) {
      setSubmitError("Network error. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto px-4 md:px-6 py-7 md:py-12 w-full space-y-12">
        {/* Page Header */}
        <div className="space-y-3 pb-6 text-center mx-auto w-full">
          <span className="flex items-center justify-center gap-2 text-xs font-semibold text-primary-text uppercase tracking-wider">
            <Phone size={14} className="text-primary" /> Get in touch
          </span>
          <h1 className="font-display text-3xl sm:text-5xl text-brand-black tracking-wide uppercase">
            Contact Lara's Pinnal
          </h1>
          <p className="text-sm font-medium text-brand-gray">
            Have questions about custom crochet orders, flower bouquets, gift hampers, or bulk enquiries? Fill out the form or chat with us on WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left Column: Form details */}
          <div className="flex flex-col h-full">
            <h2 className="font-display text-2xl text-brand-black uppercase tracking-wide mb-6">
              Send Your Custom Order or Gift Enquiry
            </h2>

            {submitError && (
              <div className="bg-red-50 border border-red-200 text-red-800 text-sm p-3 md:p-4 rounded-xl flex items-start gap-3 animate-in fade-in duration-200 mb-4">
                <AlertCircle size={18} className="shrink-0 text-red-600 mt-0.5" />
                <span className="font-medium">{submitError}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-50 border border-green-200 text-green-800 text-sm p-3 md:p-4 rounded-xl flex items-start gap-3 animate-in fade-in duration-200 mb-4">
                <CheckCircle2 size={18} className="shrink-0 text-green-600 mt-0.5" />
                <span className="font-medium">Your message has been submitted. Our team will contact you shortly!</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                      <User size={16} />
                    </div>
                    <input
                      type="text"
                      {...register("name")}
                      placeholder="Ramesh Kumar"
                      className="w-full h-11 bg-brand-light-gray/40 border border-brand-border rounded-xl pl-10 pr-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {errors.name && (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{errors.name.message}</span>
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">
                    Phone Number
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      {...register("phone")}
                      placeholder="9442379832"
                      className="w-full h-11 bg-brand-light-gray/40 border border-brand-border rounded-xl pl-10 pr-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                      <AlertCircle size={12} />
                      <span>{errors.phone.message}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">
                  Email Address (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                    <Mail size={16} />
                  </div>
                  <input
                    type="email"
                    {...register("email")}
                    placeholder="ramesh@gmail.com"
                    className="w-full h-11 bg-brand-light-gray/40 border border-brand-border rounded-xl pl-10 pr-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.email.message}</span>
                  </p>
                )}
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">
                  Subject
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-gray">
                    <MessageSquare size={16} />
                  </div>
                  <input
                    type="text"
                    {...register("subject")}
                    placeholder="e.g. Custom Crochet Bouquet Query"
                    className="w-full h-11 bg-brand-light-gray/40 border border-brand-border rounded-xl pl-10 pr-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                {errors.subject && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.subject.message}</span>
                  </p>
                )}
              </div>

              {/* Message */}
              <div className="space-y-1.5 flex-1 flex flex-col">
                <label className="text-xs font-bold text-brand-black uppercase tracking-wider block">
                  Message Details
                </label>
                <textarea
                  {...register("message")}
                  placeholder="Tell us what you need in detail..."
                  className="w-full flex-1 bg-brand-light-gray/40 border border-brand-border rounded-xl p-3 md:p-4 text-sm text-brand-black outline-none focus:ring-2 focus:ring-primary resize-none min-h-30"
                ></textarea>
                {errors.message && (
                  <p className="text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertCircle size={12} />
                    <span>{errors.message.message}</span>
                  </p>
                )}
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 bg-brand-black hover:bg-primary text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 border border-transparent disabled:opacity-50 mt-auto"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Sending Message...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send Message</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Contact Details Cards */}
          <div className="flex flex-col gap-6 h-full justify-between">
            <div className="space-y-6">
              <h2 className="font-display text-2xl text-brand-black uppercase tracking-wide">
                Studio Contact Details
              </h2>
              <div className="bg-brand-light-gray border border-brand-border rounded-2xl p-3 md:p-6 space-y-5 text-sm select-none">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-brand-gray font-bold uppercase tracking-wider block">Studio Location</span>
                    <span className="font-semibold text-brand-black block mt-0.5">{address}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-brand-gray font-bold uppercase tracking-wider block">Phone Line</span>
                    <a href={`tel:${phone}`} className="font-semibold text-brand-black hover:text-primary transition-colors block mt-0.5">
                      {phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Mail size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-brand-gray font-bold uppercase tracking-wider block">Email Inbox</span>
                    <a href={`mailto:${email}`} className="font-semibold text-brand-black hover:text-primary transition-colors block mt-0.5">
                      Email Us
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-primary shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-brand-gray font-bold uppercase tracking-wider block">Studio Hours</span>
                    <span className="font-semibold text-brand-black block mt-0.5">{businessHours}</span>
                  </div>
                </div>
              </div>

              {/* Chat on WhatsApp green block */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full h-14 border border-[#25D366]/20 bg-[#25D366]/5 hover:bg-[#25D366]/10 rounded-2xl flex items-center justify-center gap-2.5 text-base font-bold text-[#25D366] transition-all hover:scale-101"
              >
                <FaWhatsapp size={22} />
                <span>Chat on WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
