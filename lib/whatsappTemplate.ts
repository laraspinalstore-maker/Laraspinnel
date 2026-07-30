// Shared between the admin "WhatsApp Message" settings page (editor + live
// preview) and the order detail page (which renders + sends the real thing),
// so both always agree on the placeholder syntax and default copy.

export const DEFAULT_WHATSAPP_ORDER_TEMPLATE = `Hi {{customerName}}! 👋

This is *{{shopName}}*. Thank you for your order!

*Order Reference:* #{{orderNumber}}
*Items Ordered:*
{{items}}

*Total Amount:* ₹{{totalAmount}}

Kindly confirm/complete your payment so we can begin crafting and dispatch your order. Please share a screenshot of the payment once done. 🙏

Thank you for supporting handmade! 🌸`;

export const WHATSAPP_TEMPLATE_PLACEHOLDERS: { token: string; description: string }[] = [
  { token: "{{customerName}}", description: "Customer's name" },
  { token: "{{shopName}}", description: "Your business name (from Branding settings)" },
  { token: "{{orderNumber}}", description: "Order reference number" },
  { token: "{{items}}", description: "Itemized list — name, quantity, subtotal, and any customization note" },
  { token: "{{totalAmount}}", description: "Order total (number only, no ₹ symbol)" },
];

export interface WhatsAppTemplateOrderItem {
  name: string;
  quantity: number;
  price: number;
  customText?: string;
  customImage?: string;
}

export interface WhatsAppTemplateData {
  customerName: string;
  shopName: string;
  orderNumber: string;
  items: WhatsAppTemplateOrderItem[];
  totalAmount: number;
}

export function formatWhatsAppItemsList(items: WhatsAppTemplateOrderItem[]): string {
  return items
    .map((item, idx) => {
      const lines = [`${idx + 1}. ${item.name} (Qty: ${item.quantity}) - ₹${item.price * item.quantity}`];
      if (item.customText) lines.push(`   Customization: ${item.customText}`);
      if (item.customImage) lines.push(`   Reference image attached in your order`);
      return lines.join("\n");
    })
    .join("\n");
}

export function renderWhatsAppTemplate(template: string, data: WhatsAppTemplateData): string {
  // Replacements are passed as functions, not strings: `customerName` and the
  // item names come from customer input, and a value containing a `$&` / `$'`
  // sequence would otherwise be interpreted as a regex substitution pattern and
  // splice other parts of the template into the message.
  const literal = (value: string) => () => value;
  return template
    .replace(/{{\s*customerName\s*}}/g, literal(data.customerName ?? ""))
    .replace(/{{\s*shopName\s*}}/g, literal(data.shopName ?? ""))
    .replace(/{{\s*orderNumber\s*}}/g, literal(data.orderNumber ?? ""))
    .replace(/{{\s*items\s*}}/g, literal(formatWhatsAppItemsList(data.items)))
    .replace(/{{\s*totalAmount\s*}}/g, literal(String(data.totalAmount)));
}

export function getWhatsAppLink(phone: string, message: string): string {
  const digits = phone.replace(/\D/g, "");
  const withCountryCode = digits.length === 10 ? `91${digits}` : digits;
  return `https://wa.me/${withCountryCode}?text=${encodeURIComponent(message)}`;
}
