"use client";

import React, { useState, useEffect } from "react";
import AdminTopbar from "@/components/admin/AdminTopbar";
import ConfirmDialog from "@/components/admin/ConfirmDialog";
import { Mail, Trash2, MailOpen, AlertCircle, Phone, Clock, Loader2, ArrowRight } from "lucide-react";

interface Message {
  _id: string;
  name: string;
  phone: string;
  email?: string;
  subject: string;
  message: string;
  status: "new" | "read" | "responded";
  replies?: { text: string; date: string }[];
  createdAt: string;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [activeMessage, setActiveMessage] = useState<Message | null>(null);
  
  // Reply State
  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [isSendingReply, setIsSendingReply] = useState(false);
  const [replyStatus, setReplyStatus] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/admin/messages");
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      } else {
        setError("Failed to fetch messages inbox");
      }
    } catch (err) {
      setError("Failed to fetch messages inbox");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  const selectMessage = async (msg: Message) => {
    setActiveMessage(msg);
    setIsReplying(false);
    setReplyText("");
    setReplyStatus(null);

    // If it's a new message, mark it as read automatically
    if (msg.status === "new") {
      try {
        const res = await fetch(`/api/admin/messages/${msg._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "read" }),
        });

        if (res.ok) {
          // Update local status
          setMessages(
            messages.map((m) => (m._id === msg._id ? { ...m, status: "read" as const } : m))
          );
        }
      } catch (err) {
        console.error("Failed to mark message as read", err);
      }
    }
  };

  const handleSendReply = async () => {
    if (!activeMessage || !replyText.trim()) return;
    
    setIsSendingReply(true);
    setReplyStatus(null);
    try {
      const res = await fetch(`/api/admin/messages/${activeMessage._id}/reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ replyText }),
      });

      if (res.ok) {
        const data = await res.json();
        const newReply = data.reply;
        
        // Update to responded and append reply
        const updatedMessage = {
          ...activeMessage,
          status: "responded" as any,
          replies: [...(activeMessage.replies || []), newReply]
        };
        
        setMessages(
          messages.map((m) => (m._id === activeMessage._id ? updatedMessage : m))
        );
        setActiveMessage(updatedMessage);
        setIsReplying(false);
        setReplyText("");
        setReplyStatus({ type: "success", text: "Reply sent successfully via email!" });
        
        // Hide success message after 5 seconds
        setTimeout(() => {
          setReplyStatus(null);
        }, 5000);
      } else {
        const data = await res.json();
        setReplyStatus({ type: "error", text: data.error || "Failed to send reply" });
      }
    } catch (err) {
      setReplyStatus({ type: "error", text: "Network error while sending reply" });
    } finally {
      setIsSendingReply(false);
    }
  };

  const toggleResponded = async (msg: Message) => {
    const nextStatus = msg.status === "responded" ? "read" : "responded";
    try {
      const res = await fetch(`/api/admin/messages/${msg._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (res.ok) {
        setMessages(
          messages.map((m) => (m._id === msg._id ? { ...m, status: nextStatus as any } : m))
        );
        if (activeMessage?._id === msg._id) {
          setActiveMessage({ ...activeMessage, status: nextStatus as any });
        }
      }
    } catch (err) {
      setError("Failed to update message status");
    }
  };

  const handleDelete = async (id: string) => {
    setConfirmDeleteId(id);
  };

  const doDelete = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    try {
      const res = await fetch(`/api/admin/messages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages(messages.filter((m) => m._id !== id));
        if (activeMessage?._id === id) setActiveMessage(null);
      } else {
        setError("Failed to delete message");
      }
    } catch (err) {
      setError("Failed to delete message");
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <ConfirmDialog
        isOpen={!!confirmDeleteId}
        title="Delete Message"
        message="Are you sure you want to delete this message? This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={doDelete}
        onCancel={() => setConfirmDeleteId(null)}
      />
      <AdminTopbar title="Contact Messages" />

      <div className="flex-1 p-3 md:p-6 w-full flex flex-col lg:flex-row gap-6">
        {/* Inbox Left Column */}
        <div className="w-full lg:w-96 bg-white border border-brand-border rounded-2xl shadow-card flex flex-col overflow-hidden h-[calc(100vh-12rem)]">
          <div className="px-5 py-4 border-b border-brand-border bg-brand-light-gray/50 flex items-center justify-between">
            <h3 className="font-display text-base text-brand-black tracking-wide">
              Inbox
            </h3>
            <span className="bg-brand-black text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {messages.filter((m) => m.status === "new").length} New
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-brand-border">
            {isLoading ? (
              <div className="p-3 md:p-8 text-center text-brand-gray flex flex-col items-center gap-3">
                <Loader2 className="animate-spin text-goat-primary" size={24} />
                <p className="text-xs">Loading messages...</p>
              </div>
            ) : error ? (
              <div className="p-3 md:p-8 text-center text-red-600 text-xs font-semibold">
                {error}
              </div>
            ) : messages.length === 0 ? (
              <div className="p-3 md:p-8 text-center text-brand-gray flex flex-col items-center gap-2">
                <Mail size={32} className="text-neutral-300" />
                <p className="text-xs font-medium">Inbox is empty</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg._id}
                  onClick={() => selectMessage(msg)}
                  className={`p-3 md:p-4 cursor-pointer hover:bg-brand-light-gray/50 transition-colors text-left relative ${
                    activeMessage?._id === msg._id ? "bg-brand-light-gray" : ""
                  } ${msg.status === "new" ? "border-l-4 border-goat-primary" : ""}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm truncate ${msg.status === "new" ? "font-bold text-brand-black" : "text-neutral-600"}`}>
                      {msg.name}
                    </span>
                    <span className="text-[10px] text-brand-gray shrink-0 font-mono">
                      {new Date(msg.createdAt).toLocaleDateString("en-IN")}
                    </span>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${msg.status === "new" ? "font-semibold text-brand-black" : "text-brand-gray"}`}>
                    {msg.subject}
                  </p>
                  <p className="text-xs text-brand-gray truncate mt-1">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Message View Right Column */}
        <div className="flex-1 bg-white border border-brand-border rounded-2xl shadow-card p-3 md:p-6 flex flex-col overflow-hidden h-[calc(100vh-12rem)] justify-between">
          {activeMessage ? (
            <div className="flex flex-col h-full justify-between gap-6">
              {/* Header */}
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border pb-4">
                  <div>
                    <h3 className="font-semibold text-brand-black text-lg">{activeMessage.subject}</h3>
                    <p className="text-xs text-brand-gray mt-1">
                      Received on{" "}
                      {new Date(activeMessage.createdAt).toLocaleString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleResponded(activeMessage)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        activeMessage.status === "responded"
                          ? "bg-green-50 text-green-800 border-green-200"
                          : "bg-neutral-100 hover:bg-neutral-200 text-brand-black border-brand-border"
                      }`}
                    >
                      <MailOpen size={14} />
                      <span>{activeMessage.status === "responded" ? "Responded" : "Mark Responded"}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(activeMessage._id)}
                      className="p-2 hover:bg-red-50 text-brand-gray hover:text-red-600 rounded-xl border border-brand-border hover:border-red-200 transition-colors"
                      title="Delete message"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Sender card */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-brand-light-gray p-3 md:p-4 rounded-xl border border-brand-border text-sm">
                  <div>
                    <span className="text-xs text-brand-gray block">Sender Name</span>
                    <span className="font-semibold text-brand-black">{activeMessage.name}</span>
                  </div>
                  <div>
                    <span className="text-xs text-brand-gray block">Phone Number</span>
                    <a href={`tel:${activeMessage.phone}`} className="font-semibold text-goat-primary hover:underline flex items-center gap-1.5 mt-0.5">
                      <Phone size={14} />
                      <span>{activeMessage.phone}</span>
                    </a>
                  </div>
                  {activeMessage.email && (
                    <div className="min-w-0">
                      <span className="text-xs text-brand-gray block">Email Address</span>
                      <a href={`mailto:${activeMessage.email}`} className="font-semibold text-brand-black hover:underline flex items-center gap-1.5 mt-0.5 min-w-0">
                        <Mail size={14} className="shrink-0" />
                        <span className="truncate" title={activeMessage.email}>{activeMessage.email}</span>
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Message Content & History */}
              <div className="flex-1 overflow-y-auto p-3 md:p-4 bg-brand-light-gray/30 border border-brand-border rounded-xl flex flex-col gap-4">
                <div className="whitespace-pre-wrap text-sm text-brand-black leading-relaxed">
                  {activeMessage.message}
                </div>
                
                {/* Reply History */}
                {activeMessage.replies && activeMessage.replies.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-brand-border flex flex-col gap-4">
                    <h4 className="text-xs font-semibold text-brand-gray uppercase tracking-wider">Reply History</h4>
                    {activeMessage.replies.map((reply, idx) => (
                      <div key={idx} className="bg-white border border-brand-border rounded-xl p-3 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-brand-black">Admin Reply</span>
                          <span className="text-[10px] text-brand-gray">
                            {new Date(reply.date).toLocaleString("en-IN", {
                              day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit"
                            })}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-sm text-brand-black">
                          {reply.text}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Reply Section */}
              {activeMessage.email && (
                <div className="border-t border-brand-border pt-4 mt-auto">
                  
                  {replyStatus && (
                    <div className={`mb-4 px-4 py-3 rounded-xl flex items-start gap-3 border ${
                      replyStatus.type === "success" ? "bg-green-50 border-green-200 text-green-800" : "bg-red-50 border-red-200 text-red-800"
                    }`}>
                      <AlertCircle size={20} className={replyStatus.type === "success" ? "text-green-600" : "text-red-600"} />
                      <span className="font-medium text-sm">{replyStatus.text}</span>
                    </div>
                  )}

                  {!isReplying ? (
                    <button
                      onClick={() => setIsReplying(true)}
                      className="inline-flex items-center gap-2 bg-brand-black hover:bg-goat-primary text-white font-semibold text-sm h-11 px-4 md:px-6 rounded-xl transition-colors duration-200 shadow-sm"
                    >
                      <span>Reply via Email</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4 duration-300">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-brand-gray uppercase tracking-wider">Compose Reply</span>
                        <button 
                          onClick={() => setIsReplying(false)}
                          className="text-xs text-red-500 hover:text-red-700 font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type your reply here... (Will be sent directly to their email)"
                        rows={4}
                        className="w-full bg-brand-light-gray border border-brand-border rounded-xl p-3 text-sm text-brand-black focus:ring-2 focus:ring-goat-primary outline-none resize-none"
                      />
                      <div className="flex justify-end">
                        <button
                          onClick={handleSendReply}
                          disabled={isSendingReply || !replyText.trim()}
                          className="inline-flex items-center gap-2 bg-goat-primary hover:bg-goat-hover text-white font-semibold text-sm h-10 px-6 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSendingReply ? (
                            <>
                              <Loader2 size={16} className="animate-spin" />
                              <span>Sending...</span>
                            </>
                          ) : (
                            <>
                              <Mail size={16} />
                              <span>Send Reply</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-brand-gray p-3 md:p-8">
              <Mail size={48} className="text-neutral-200 mb-3" />
              <h4 className="font-semibold text-brand-black">No message selected</h4>
              <p className="text-xs mt-1">Select a contact message from the list to view its contents.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
