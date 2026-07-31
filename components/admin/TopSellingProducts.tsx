"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy, Sparkles, ArrowRight } from "lucide-react";

export interface TopProduct {
  /** Product _id. Used to link to the edit page. */
  id: string;
  name: string;
  qty: number;
  revenue: number;
  /** False when the product has since been deleted — the row then isn't a link. */
  exists: boolean;
}

export interface CustomRequestSummary {
  orders: number;
  awaitingQuote: number;
}

interface Props {
  topProducts: TopProduct[];
  customRequests: CustomRequestSummary;
}

type Metric = "qty" | "revenue";

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

/** How many rows the card shows, regardless of how many the server sent. */
const VISIBLE_ROWS = 5;

export default function TopSellingProducts({ topProducts, customRequests }: Props) {
  const [metric, setMetric] = useState<Metric>("qty");

  // The server sends the leaders by BOTH metrics (see the $facet in the dashboard
  // query), so re-sorting here can't miss a high-value, low-volume product the way
  // re-sorting a quantity-only top-5 would.
  const rows = useMemo(() => {
    const sorted = [...topProducts].sort((a, b) =>
      metric === "qty" ? b.qty - a.qty || b.revenue - a.revenue : b.revenue - a.revenue || b.qty - a.qty
    );
    return sorted.slice(0, VISIBLE_ROWS);
  }, [topProducts, metric]);

  const max = Math.max(1, ...rows.map((r) => (metric === "qty" ? r.qty : r.revenue)));

  return (
    <div className="bg-white border border-brand-border rounded-2xl shadow-card p-4 md:p-6">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <Trophy size={18} className="text-gold-primary" />
          <h3 className="font-display text-base md:text-lg text-brand-black tracking-wide">
            Top Selling Products
          </h3>
        </div>

        {/* Units vs revenue — "what moves" and "what earns" are different questions. */}
        <div
          className="flex items-center rounded-full border border-brand-border bg-brand-light-gray/60 p-0.5"
          role="group"
          aria-label="Rank top products by"
        >
          {(["qty", "revenue"] as Metric[]).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMetric(m)}
              aria-pressed={metric === m}
              className={`px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                metric === m
                  ? "bg-white text-brand-black shadow-sm"
                  : "text-brand-gray hover:text-brand-black"
              }`}
            >
              {m === "qty" ? "Units" : "Revenue"}
            </button>
          ))}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="py-8 text-center text-sm text-brand-gray">
          No product sales yet — top products will appear here once orders come in.
        </div>
      ) : (
        <div className="space-y-3.5">
          {rows.map((p, i) => {
            const value = metric === "qty" ? p.qty : p.revenue;
            const widthPct = Math.max(6, (value / max) * 100);

            const body = (
              <>
                <span className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-gold-tint text-gold-text text-xs font-bold">
                  {i + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <span className="text-sm font-semibold text-brand-black truncate group-hover/row:text-primary transition-colors">
                      {p.name}
                    </span>
                    <span className="shrink-0 text-xs text-brand-gray font-medium tabular-nums">
                      {p.qty} sold · <span className="font-bold text-brand-black">{inr(p.revenue)}</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-brand-light-gray overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gold-primary/80 transition-all duration-500"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              </>
            );

            // A deleted product has nowhere to link to, so it stays plain text.
            return p.exists ? (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}`}
                className="flex items-center gap-3 group/row rounded-lg -mx-1.5 px-1.5 py-1 hover:bg-brand-light-gray/40 transition-colors"
                title={`Edit ${p.name}`}
              >
                {body}
              </Link>
            ) : (
              <div key={p.id} className="flex items-center gap-3" title="This product has been deleted">
                {body}
              </div>
            );
          })}
        </div>
      )}

      {/* Custom-order requests are quotes, not sales: their price is 0 until an
          admin agrees one, so they're summarised here rather than ranked above. */}
      {customRequests.orders > 0 && (
        <Link
          href="/admin/orders"
          className="mt-5 pt-4 border-t border-brand-border flex items-center gap-2.5 group/custom"
        >
          <Sparkles size={15} className="text-primary shrink-0" />
          <span className="text-xs text-brand-gray flex-1 min-w-0">
            <span className="font-bold text-brand-black">{customRequests.orders}</span> custom order
            {customRequests.orders === 1 ? "" : "s"}
            {customRequests.awaitingQuote > 0 && (
              <>
                {" · "}
                <span className="font-semibold text-amber-600">
                  {customRequests.awaitingQuote} awaiting a quote
                </span>
              </>
            )}
          </span>
          <ArrowRight
            size={14}
            className="text-brand-gray shrink-0 group-hover/custom:translate-x-0.5 group-hover/custom:text-primary transition-all"
          />
        </Link>
      )}
    </div>
  );
}
