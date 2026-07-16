import { brand } from "@/lib/brand";
import { formatPrice } from "@/lib/format";
import type { StoredOrder } from "@/lib/db/orders-store";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function orderRef(id: string): string {
  return id.slice(0, 8).toUpperCase();
}

function buildItemsRows(order: StoredOrder): string {
  const rows = order.items.map(
    (item) => `
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#e4e4e7;font-size:14px;">
          ${item.quantity}× ${escapeHtml(item.name)}${
            item.frameOption === "frameless" ? " (Çerçevesiz)" : " (Çerçeveli)"
          }
        </td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#fbbf24;font-size:14px;text-align:right;white-space:nowrap;">
          ${formatPrice(item.unitPrice * item.quantity)}
        </td>
      </tr>`,
  );

  if (order.totals.shipping > 0) {
    rows.push(`
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#a1a1aa;font-size:14px;">Kargo</td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#a1a1aa;font-size:14px;text-align:right;">${formatPrice(order.totals.shipping)}</td>
      </tr>`);
  }

  if (order.totals.discountTotal > 0) {
    rows.push(`
      <tr>
        <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#86efac;font-size:14px;">Set indirimi</td>
        <td style="padding:10px 0;border-bottom:1px solid #2a2a2e;color:#86efac;font-size:14px;text-align:right;">−${formatPrice(order.totals.discountTotal)}</td>
      </tr>`);
  }

  return rows.join("");
}

function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://theposterist.com";
}

function messageToHtml(message: string): string {
  const paragraphs = message.split(/\r?\n/).filter((line, index, lines) => {
    return line.trim() || (index > 0 && index < lines.length - 1);
  });

  if (paragraphs.length === 0) {
    return `<p style="margin:0;font-size:15px;line-height:1.7;color:#e4e4e7;">&nbsp;</p>`;
  }

  return paragraphs
    .map(
      (line) =>
        `<p style="margin:0 0 14px;font-size:15px;line-height:1.7;color:#e4e4e7;">${line.trim() ? escapeHtml(line) : "&nbsp;"}</p>`,
    )
    .join("");
}

export function wrapEmailLayout(input: {
  title: string;
  preheader: string;
  bodyHtml: string;
}): string {
  const siteUrl = getSiteUrl();
  const logoUrl = `${siteUrl}${brand.logoSrc}`;

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(input.title)}</title>
</head>
<body style="margin:0;padding:0;background:#09090a;font-family:Arial,Helvetica,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(input.preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#09090a;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#111113;border:1px solid #27272a;border-radius:12px;overflow:hidden;">
          <tr>
            <td style="padding:28px 28px 20px;border-bottom:1px solid #27272a;background:linear-gradient(180deg,#1a1a1d,#111113);">
              <a href="${siteUrl}" style="text-decoration:none;display:inline-block;">
                <img src="${logoUrl}" alt="${escapeHtml(brand.logoAlt)}" width="200" style="display:block;max-width:200px;height:auto;border:0;" />
              </a>
              <p style="margin:10px 0 0;font-size:12px;color:#fbbf24;letter-spacing:0.12em;text-transform:uppercase;">${escapeHtml(brand.tagline)}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:28px;">
              ${input.bodyHtml}
            </td>
          </tr>
          <tr>
            <td style="padding:20px 28px 28px;border-top:1px solid #27272a;background:#0c0c0e;">
              <p style="margin:0;font-size:12px;line-height:1.6;color:#71717a;">
                Bu e-posta <a href="${siteUrl}" style="color:#fbbf24;text-decoration:none;">${escapeHtml(brand.domain)}</a> sipariş sistemi tarafından gönderildi.<br />
                Destek: <a href="mailto:${brand.supportEmail}" style="color:#fbbf24;text-decoration:none;">${escapeHtml(brand.supportEmail)}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderCustomerOrderConfirmationEmail(order: StoredOrder): {
  subject: string;
  html: string;
} {
  const ref = orderRef(order.id);

  const bodyHtml = `
    <p style="margin:0 0 12px;font-size:15px;line-height:1.7;color:#e4e4e7;">
      Merhaba <strong style="color:#fff;">${escapeHtml(order.customer.name)}</strong>,
    </p>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#a1a1aa;">
      <strong style="color:#fbbf24;">#${ref}</strong> numaralı siparişinizin ödemesi alındı.
      Posteriniz hazırlık sürecine alınacak; kargoya verildiğinde bilgilendirileceksiniz.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;background:#18181b;border:1px solid #27272a;border-radius:10px;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 4px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.14em;">Sipariş özeti</p>
          <p style="margin:0;font-size:28px;font-weight:700;color:#ffffff;">${formatPrice(order.totals.total)}</p>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 20px;">
      ${buildItemsRows(order)}
      <tr>
        <td style="padding-top:12px;font-size:16px;font-weight:700;color:#fff;">Toplam</td>
        <td style="padding-top:12px;font-size:16px;font-weight:700;color:#fbbf24;text-align:right;">${formatPrice(order.totals.total)}</td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#18181b;border:1px solid #27272a;border-radius:10px;">
      <tr>
        <td style="padding:16px 18px;">
          <p style="margin:0 0 8px;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:0.14em;">Teslimat adresi</p>
          <p style="margin:0;font-size:14px;line-height:1.7;color:#e4e4e7;">
            ${escapeHtml(order.customer.address)}<br />
            ${escapeHtml(order.customer.city)}${order.customer.zip ? ` ${escapeHtml(order.customer.zip)}` : ""}
          </p>
        </td>
      </tr>
    </table>`;

  return {
    subject: `Siparişiniz alındı — #${ref}`,
    html: wrapEmailLayout({
      title: `Sipariş onayı #${ref}`,
      preheader: `${brand.name} siparişiniz onaylandı. Toplam ${formatPrice(order.totals.total)}`,
      bodyHtml,
    }),
  };
}

export function renderAdminOrderNotificationEmail(order: StoredOrder): {
  subject: string;
  html: string;
} {
  const ref = orderRef(order.id);

  const bodyHtml = `
    <p style="margin:0 0 8px;font-size:11px;color:#fbbf24;text-transform:uppercase;letter-spacing:0.14em;">Yeni sipariş</p>
    <p style="margin:0 0 20px;font-size:24px;font-weight:700;color:#ffffff;">#${ref} · ${formatPrice(order.totals.total)}</p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;background:#18181b;border:1px solid #27272a;border-radius:10px;">
      <tr>
        <td style="padding:16px 18px;font-size:14px;line-height:1.8;color:#e4e4e7;">
          <strong style="color:#fff;">${escapeHtml(order.customer.name)}</strong><br />
          ${escapeHtml(order.customer.phone)}<br />
          <a href="mailto:${escapeHtml(order.customer.email)}" style="color:#fbbf24;text-decoration:none;">${escapeHtml(order.customer.email)}</a>
        </td>
      </tr>
    </table>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin:0 0 16px;">
      ${buildItemsRows(order)}
    </table>

    <p style="margin:0;font-size:14px;line-height:1.7;color:#a1a1aa;">
      ${escapeHtml(order.customer.address)}, ${escapeHtml(order.customer.city)}
    </p>`;

  return {
    subject: `Yeni sipariş — #${ref} · ${formatPrice(order.totals.total)}`,
    html: wrapEmailLayout({
      title: `Yeni sipariş #${ref}`,
      preheader: `${order.customer.name} — ${formatPrice(order.totals.total)}`,
      bodyHtml,
    }),
  };
}

export function replySubject(subject: string): string {
  if (/^re:\s/i.test(subject.trim())) return subject.trim();
  return `Re: ${subject.trim()}`;
}

export function renderSupportEmail(input: {
  subject: string;
  message: string;
  recipientName?: string;
}): { subject: string; html: string } {
  const greeting = input.recipientName?.trim()
    ? `Merhaba <strong style="color:#fff;">${escapeHtml(input.recipientName.trim())}</strong>,`
    : "Merhaba,";

  const bodyHtml = `
    <p style="margin:0 0 16px;font-size:15px;line-height:1.7;color:#e4e4e7;">
      ${greeting}
    </p>
    ${messageToHtml(input.message)}
    <p style="margin:20px 0 0;font-size:14px;line-height:1.7;color:#a1a1aa;">
      Başka bir sorunuz olursa bu e-postaya yanıt verebilirsiniz.
    </p>
    <p style="margin:16px 0 0;font-size:14px;line-height:1.7;color:#a1a1aa;">
      Sevgilerle,<br />
      <strong style="color:#fff;">${escapeHtml(brand.name)}</strong> Destek Ekibi
    </p>`;

  return {
    subject: input.subject.trim(),
    html: wrapEmailLayout({
      title: input.subject.trim(),
      preheader: input.message.trim().slice(0, 120),
      bodyHtml,
    }),
  };
}
