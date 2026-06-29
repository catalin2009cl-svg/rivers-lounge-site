const SITE = 'https://riverslounge.ro';

export type TemplateType = 'PROMO' | 'MENU' | 'EVENT' | 'CUSTOM';

export interface PromoContent {
  headline: string;
  discount: string;
  validUntil: string;
  description: string;
  ctaText: string;
  ctaUrl: string;
}

export interface MenuContent {
  headline: string;
  items: string;
  validPeriod: string;
  ctaText: string;
  ctaUrl: string;
}

export interface EventContent {
  eventName: string;
  date: string;
  time: string;
  description: string;
  imageUrl?: string;
  ctaText: string;
  ctaUrl: string;
}

export interface CustomContent {
  headline: string;
  body: string;
  ctaText?: string;
  ctaUrl?: string;
}

export type TemplateContent = PromoContent | MenuContent | EventContent | CustomContent;

function clickUrl(trackingId: string, target: string): string {
  return `${SITE}/api/email/track/click?id=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(target)}`;
}

function unsubUrl(trackingId: string): string {
  return `${SITE}/api/email/unsubscribe?token=${trackingId}`;
}

function cta(text: string, href: string): string {
  return `<div style="text-align:center;margin-top:28px;">
    <a href="${href}" style="display:inline-block;padding:14px 36px;background:#C9A84C;color:#000000;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">${text}</a>
  </div>`;
}

const HEADER = `<tr>
  <td style="background-color:#1a1a1a;padding:30px;text-align:center;border-bottom:2px solid #C9A84C;">
    <h1 style="color:#C9A84C;margin:0;font-size:24px;letter-spacing:2px;">RIVERS LOUNGE</h1>
    <p style="color:#888888;margin:5px 0 0;font-size:12px;">riverslounge.ro</p>
  </td>
</tr>`;

function footer(trackingId: string): string {
  return `<tr>
  <td style="background-color:#1a1a1a;padding:20px 30px;text-align:center;border-top:1px solid #333333;">
    <p style="color:#666666;margin:0 0 8px;font-size:12px;">© ${new Date().getFullYear()} RIVERS LOUNGE CROWD SRL | Str. Dobrogei nr. 1, Călărași</p>
    <p style="color:#666666;margin:0;font-size:11px;">
      <a href="${unsubUrl(trackingId)}" style="color:#888888;text-decoration:underline;">Dezabonare emailuri promoționale</a>
      &nbsp;·&nbsp;
      <a href="${SITE}/confidentialitate" style="color:#888888;">Confidențialitate</a>
    </p>
  </td>
</tr>`;
}

function wrap(body: string, trackingId: string): string {
  const pixel = `<img src="${SITE}/api/email/track/open?id=${encodeURIComponent(trackingId)}" width="1" height="1" style="display:none;" alt="" />`;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">${pixel}
<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
      ${HEADER}
      <tr><td style="padding:40px 30px;">${body}</td></tr>
      ${footer(trackingId)}
    </table>
  </td></tr>
</table></body></html>`;
}

function renderPromo(c: PromoContent, trackingId: string, name: string): string {
  return wrap(`
    <p style="color:#C9A84C;margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">OFERTĂ SPECIALĂ</p>
    <h1 style="color:#ffffff;margin:0 0 24px;font-size:26px;line-height:1.3;">${c.headline}</h1>
    <div style="background:#1a1a1a;border:2px solid #C9A84C;border-radius:12px;padding:28px;text-align:center;margin:0 0 24px;">
      <p style="color:#888;font-size:13px;margin:0 0 8px;">Reducere</p>
      <p style="color:#C9A84C;font-size:56px;font-weight:800;margin:0 0 6px;line-height:1;">${c.discount}</p>
      <p style="color:#aaa;font-size:13px;margin:0;">Valabil până: <strong style="color:#ffffff;">${c.validUntil}</strong></p>
    </div>
    ${name ? `<p style="color:#cccccc;margin:0 0 12px;line-height:1.6;">Bună, <strong style="color:#ffffff;">${name}</strong>!</p>` : ''}
    <p style="color:#cccccc;margin:0;line-height:1.7;">${c.description}</p>
    ${cta(c.ctaText, clickUrl(trackingId, c.ctaUrl))}
  `, trackingId);
}

function renderMenu(c: MenuContent, trackingId: string, name: string): string {
  return wrap(`
    <h1 style="color:#ffffff;margin:0 0 4px;font-size:26px;">${c.headline}</h1>
    <p style="color:#888888;font-size:13px;margin:0 0 24px;">Valabil: ${c.validPeriod}</p>
    ${name ? `<p style="color:#cccccc;margin:0 0 16px;line-height:1.6;">Bună, <strong style="color:#ffffff;">${name}</strong>!</p>` : ''}
    <div style="color:#cccccc;line-height:1.8;white-space:pre-line;">${c.items}</div>
    ${c.ctaText && c.ctaUrl ? cta(c.ctaText, clickUrl(trackingId, c.ctaUrl)) : ''}
  `, trackingId);
}

function renderEvent(c: EventContent, trackingId: string, name: string): string {
  return wrap(`
    <p style="color:#C9A84C;margin:0 0 8px;font-size:12px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">EVENIMENT SPECIAL</p>
    <h1 style="color:#ffffff;margin:0 0 24px;font-size:26px;line-height:1.3;">${c.eventName}</h1>
    ${c.imageUrl ? `<img src="${c.imageUrl}" alt="${c.eventName}" style="width:100%;border-radius:8px;margin-bottom:24px;display:block;" />` : ''}
    <div style="background:#1a1a1a;border-radius:8px;padding:14px 20px;margin:0 0 24px;font-size:15px;">
      <span style="color:#C9A84C;font-weight:700;">📅 ${c.date}</span>
      <span style="color:#555;margin:0 12px;">|</span>
      <span style="color:#C9A84C;font-weight:700;">🕐 ${c.time}</span>
    </div>
    ${name ? `<p style="color:#cccccc;margin:0 0 12px;line-height:1.6;">Bună, <strong style="color:#ffffff;">${name}</strong>!</p>` : ''}
    <p style="color:#cccccc;line-height:1.7;margin:0;">${c.description}</p>
    ${cta(c.ctaText, clickUrl(trackingId, c.ctaUrl))}
  `, trackingId);
}

function renderCustom(c: CustomContent, trackingId: string, name: string): string {
  const ctaHtml = c.ctaText && c.ctaUrl ? cta(c.ctaText, clickUrl(trackingId, c.ctaUrl)) : '';
  return wrap(`
    <h1 style="color:#ffffff;margin:0 0 20px;font-size:26px;">${c.headline}</h1>
    ${name ? `<p style="color:#cccccc;margin:0 0 16px;line-height:1.6;">Bună, <strong style="color:#ffffff;">${name}</strong>!</p>` : ''}
    <div style="color:#cccccc;line-height:1.7;">${c.body}</div>
    ${ctaHtml}
  `, trackingId);
}

export function renderTemplate(
  template: TemplateType,
  content: TemplateContent,
  trackingId: string,
  recipientName = ''
): string {
  switch (template) {
    case 'PROMO': return renderPromo(content as PromoContent, trackingId, recipientName);
    case 'MENU':  return renderMenu(content as MenuContent, trackingId, recipientName);
    case 'EVENT': return renderEvent(content as EventContent, trackingId, recipientName);
    case 'CUSTOM': return renderCustom(content as CustomContent, trackingId, recipientName);
  }
}
