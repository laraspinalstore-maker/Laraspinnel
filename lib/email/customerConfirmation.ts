import {
  DEFAULT_EMAIL_SUBJECT_TEMPLATE,
  DEFAULT_EMAIL_INTRO_TEMPLATE,
  DEFAULT_EMAIL_FOOTER_TEMPLATE,
  renderEmailText,
} from "@/lib/emailTemplate";
import {
  renderEmailShell,
  stitchCard,
  sectionHeading,
  EMAIL_COLORS,
  EMAIL_FONTS,
} from "@/lib/email/layout";

interface OrderConfirmationOrder {
  orderNumber: string;
  customerName: string;
  address: string;
  city: string;
  pincode: string;
  totalAmount: number;
  items: {
    name: string;
    price: number;
    quantity: number;
    customText?: string;
  }[];
}

interface GetOrderConfirmationEmailOptions {
  shopName: string;
  subjectTemplate?: string;
  introTemplate?: string;
  footerTemplate?: string;
}

function buildItemsTableRows(items: OrderConfirmationOrder["items"]): string {
  return items
    .map(
      (item) => `
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border};">
            <div style="font-weight: bold; color: ${EMAIL_COLORS.ink}; font-size: 13px;">${item.name}</div>
            ${item.customText ? `<div style="font-size: 11px; color: ${EMAIL_COLORS.sageText}; font-style: italic; margin-top: 2px;">Customization: ${item.customText}</div>` : ""}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: center; font-size: 13px; color: ${EMAIL_COLORS.ink};">
            ${item.quantity}
          </td>
          <td style="padding: 10px 0; border-bottom: 1px solid ${EMAIL_COLORS.border}; text-align: right; font-weight: bold; font-size: 13px; color: ${EMAIL_COLORS.ink};">
            &#8377;${item.price * item.quantity}
          </td>
        </tr>`
    )
    .join("");
}

// Renders the customer order-confirmation email — a fixed HTML layout
// (safe from admin typos) with three text blocks (subject/intro/footer)
// substituted from admin-editable templates, defaulting when unset.
export function getOrderConfirmationEmail(
  order: OrderConfirmationOrder,
  { shopName, subjectTemplate, introTemplate, footerTemplate }: GetOrderConfirmationEmailOptions
): { subject: string; html: string } {
  const data = {
    customerName: order.customerName,
    shopName,
    orderNumber: order.orderNumber,
    totalAmount: order.totalAmount,
  };

  const subject = renderEmailText(subjectTemplate || DEFAULT_EMAIL_SUBJECT_TEMPLATE, data);
  const intro = renderEmailText(introTemplate || DEFAULT_EMAIL_INTRO_TEMPLATE, data);
  const footer = renderEmailText(footerTemplate || DEFAULT_EMAIL_FOOTER_TEMPLATE, data);

  const bodyHtml = `
    <p style="white-space: pre-line; margin: 0 0 4px; font-size: 14px;">${intro}</p>

    ${stitchCard(`
      <span style="font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: ${EMAIL_COLORS.goldText}; font-weight: bold;">Order Reference</span>
      <span style="font-family: ${EMAIL_FONTS.mono}; font-size: 20px; font-weight: bold; color: ${EMAIL_COLORS.ink}; margin-top: 4px; display: block;">
        #${order.orderNumber}
      </span>
    `)}

    ${sectionHeading("Ordered Items")}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse; margin-top: 8px;">
      <thead>
        <tr>
          <th style="text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_COLORS.gray}; padding-bottom: 6px;">Product</th>
          <th style="text-align: center; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_COLORS.gray}; padding-bottom: 6px;">Qty</th>
          <th style="text-align: right; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; color: ${EMAIL_COLORS.gray}; padding-bottom: 6px;">Subtotal</th>
        </tr>
      </thead>
      <tbody>
        ${buildItemsTableRows(order.items)}
      </tbody>
    </table>

    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top: 14px;">
      <tr>
        <td style="background-color: ${EMAIL_COLORS.sageTint}; border-radius: 10px; padding: 12px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size: 14px; font-weight: bold; color: ${EMAIL_COLORS.ink};">Total Amount</td>
              <td style="font-size: 16px; font-weight: bold; color: ${EMAIL_COLORS.sage}; text-align: right;">&#8377;${order.totalAmount}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    ${sectionHeading("Delivery Address")}
    <p style="font-size: 13px; color: ${EMAIL_COLORS.ink}; margin: 8px 0 0;">
      ${order.address}, ${order.city} - ${order.pincode}
    </p>

    <p style="white-space: pre-line; font-size: 13px; color: ${EMAIL_COLORS.brownText}; margin: 24px 0 0; padding-top: 16px; border-top: 1px solid ${EMAIL_COLORS.border};">${footer}</p>
  `;

  const html = renderEmailShell({
    title: subject,
    bannerText: "Order Confirmation",
    shopName,
    bodyHtml,
  });

  return { subject, html };
}
