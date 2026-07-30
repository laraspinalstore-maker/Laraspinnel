import {
  DEFAULT_STATUS_EMAIL_SUBJECT_TEMPLATE,
  DEFAULT_STATUS_EMAIL_INTRO_TEMPLATE,
  DEFAULT_STATUS_EMAIL_FOOTER_TEMPLATE,
  renderEmailText,
} from "@/lib/emailTemplate";
import {
  renderEmailShell,
  stitchCard,
  trackOrderButton,
  EMAIL_COLORS,
  EMAIL_FONTS,
} from "@/lib/email/layout";
import { escapeHtml } from "@/lib/security/url";

type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "delivered" | "cancelled";

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending Verification",
  confirmed: "Confirmed",
  preparing: "Preparing / Crafting",
  ready: "Ready to Ship",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

// Brand-mapped status colors: gold = waiting, sage = good news,
// terracotta = actively crafting, brown = journey complete.
const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: EMAIL_COLORS.gold,
  confirmed: EMAIL_COLORS.sage,
  preparing: EMAIL_COLORS.terracotta,
  ready: EMAIL_COLORS.sage,
  delivered: EMAIL_COLORS.brownText,
  cancelled: "#B4443C",
};

interface StatusUpdateOrder {
  orderNumber: string;
  customerName: string;
  status: OrderStatus;
}

interface GetStatusUpdateEmailOptions {
  shopName: string;
  subjectTemplate?: string;
  introTemplate?: string;
  footerTemplate?: string;
}

// Renders the order status-update email — same pattern as the order
// confirmation email: fixed HTML layout, admin-editable text blocks.
export function getOrderStatusUpdateEmail(
  order: StatusUpdateOrder,
  { shopName, subjectTemplate, introTemplate, footerTemplate }: GetStatusUpdateEmailOptions
): { subject: string; html: string } {
  const statusLabel = STATUS_LABELS[order.status] || order.status;
  const statusColor = STATUS_COLORS[order.status] || EMAIL_COLORS.ink;

  const data = {
    customerName: order.customerName,
    shopName,
    orderNumber: order.orderNumber,
    totalAmount: 0,
    statusLabel,
  };

  const subject = renderEmailText(subjectTemplate || DEFAULT_STATUS_EMAIL_SUBJECT_TEMPLATE, data);
  const intro = renderEmailText(introTemplate || DEFAULT_STATUS_EMAIL_INTRO_TEMPLATE, data);
  const footer = renderEmailText(footerTemplate || DEFAULT_STATUS_EMAIL_FOOTER_TEMPLATE, data);

  const bodyHtml = `
    <p style="white-space: pre-line; margin: 0 0 4px; font-size: 14px;">${escapeHtml(intro)}</p>

    ${stitchCard(`
      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: ${EMAIL_COLORS.goldText}; font-weight: bold;">Order Reference</span>
      <span style="font-family: ${EMAIL_FONTS.mono}; font-size: 20px; font-weight: bold; color: ${EMAIL_COLORS.ink}; margin-top: 4px; display: block;">
        #${escapeHtml(order.orderNumber)}
      </span>
      <span style="display: inline-block; margin-top: 12px; padding: 5px 16px; background-color: ${statusColor}; color: #ffffff; border-radius: 9999px; font-weight: bold; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">
        ${escapeHtml(statusLabel)}
      </span>
    `)}

    ${trackOrderButton(order.orderNumber)}

    <p style="white-space: pre-line; font-size: 13px; color: ${EMAIL_COLORS.brownText}; margin: 24px 0 0; padding-top: 16px; border-top: 1px solid ${EMAIL_COLORS.border};">${escapeHtml(footer)}</p>
  `;

  const html = renderEmailShell({
    title: subject,
    bannerText: "Order Status Update",
    bannerColor: statusColor,
    shopName,
    bodyHtml,
  });

  return { subject, html };
}
