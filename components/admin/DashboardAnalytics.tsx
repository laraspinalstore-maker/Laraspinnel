import React from "react";
import { OrderStatus } from "@/components/admin/StatusBadge";
import { TrendingUp, PieChart } from "lucide-react";
import TopSellingProducts, { type TopProduct, type CustomRequestSummary } from "@/components/admin/TopSellingProducts";

export interface DashboardAnalyticsData {
  revenueTrend: { day: string; label: string; total: number }[];
  ordersByStatus: { status: OrderStatus; label: string; count: number }[];
  topProducts: TopProduct[];
  customRequests: CustomRequestSummary;
}

// Solid bar/dot colors that match the pastel StatusBadge palette.
const STATUS_BAR: Record<OrderStatus, string> = {
  pending: "bg-amber-400",
  confirmed: "bg-blue-400",
  preparing: "bg-indigo-400",
  ready: "bg-purple-400",
  delivered: "bg-green-500",
  cancelled: "bg-red-400",
};

const inr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

export default function DashboardAnalytics({
  revenueTrend,
  ordersByStatus,
  topProducts,
  customRequests,
}: DashboardAnalyticsData) {
  const maxRevenue = Math.max(1, ...revenueTrend.map((d) => d.total));
  const trendTotal = revenueTrend.reduce((acc, d) => acc + d.total, 0);
  const statusTotal = Math.max(1, ordersByStatus.reduce((acc, s) => acc + s.count, 0));
  const maxStatus = Math.max(1, ...ordersByStatus.map((s) => s.count));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue trend — last 14 days */}
      <div className="lg:col-span-2 bg-white border border-brand-border rounded-2xl shadow-card p-4 md:p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2">
            <TrendingUp size={18} className="text-goat-primary" />
            <h3 className="font-display text-base md:text-lg text-brand-black tracking-wide">
              Revenue — Last 14 Days
            </h3>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-semibold text-brand-gray uppercase tracking-wide">Total</p>
            <p className="text-sm font-bold text-goat-text">{inr(trendTotal)}</p>
          </div>
        </div>

        {trendTotal === 0 ? (
          <div className="h-44 flex items-center justify-center text-sm text-brand-gray">
            No revenue recorded in the last 14 days.
          </div>
        ) : (
          <div className="flex items-end gap-1 sm:gap-1.5 h-44">
            {revenueTrend.map((d, i) => {
              const heightPct = d.total > 0 ? Math.max(4, (d.total / maxRevenue) * 100) : 0;
              return (
                <div key={i} className="flex-1 h-full flex flex-col items-center justify-end gap-1.5 group">
                  <div className="relative w-full flex items-end justify-center h-full">
                    <div
                      title={`${d.label}: ${inr(d.total)}`}
                      className="w-full max-w-5.5 rounded-t-md bg-goat-primary/80 group-hover:bg-goat-primary transition-all"
                      style={{ height: `${heightPct}%` }}
                    />
                  </div>
                  <span className="text-[8px] sm:text-[9px] font-semibold text-brand-gray tabular-nums">
                    {d.day}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Orders by status */}
      <div className="bg-white border border-brand-border rounded-2xl shadow-card p-4 md:p-6">
        <div className="flex items-center gap-2 mb-5">
          <PieChart size={18} className="text-goat-primary" />
          <h3 className="font-display text-base md:text-lg text-brand-black tracking-wide">
            Orders by Status
          </h3>
        </div>

        <div className="space-y-3">
          {ordersByStatus.map((s) => {
            const pct = Math.round((s.count / statusTotal) * 100);
            const widthPct = s.count > 0 ? Math.max(3, (s.count / maxStatus) * 100) : 0;
            return (
              <div key={s.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-brand-black">
                    <span className={`w-2 h-2 rounded-full ${STATUS_BAR[s.status]}`} />
                    {s.label}
                  </span>
                  <span className="text-brand-gray font-medium tabular-nums">
                    {s.count} <span className="text-neutral-400">({pct}%)</span>
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-brand-light-gray overflow-hidden">
                  <div
                    className={`h-full rounded-full ${STATUS_BAR[s.status]}`}
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top selling products — interactive, so it lives in its own client component */}
      <div className="lg:col-span-3">
        <TopSellingProducts topProducts={topProducts} customRequests={customRequests} />
      </div>
    </div>
  );
}
