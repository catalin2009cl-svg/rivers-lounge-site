const SITE = 'https://riverslounge.ro';

export type TemplateType = 'PROMO' | 'MENU' | 'EVENT' | 'CUSTOM';

export interface PromoContent {
  headline:    string;
  discount:    string;
  validUntil:  string;
  description: string;
  ctaText:     string;
  ctaUrl:      string;
}

export interface MenuContent {
  headline:    string;
  items:       string;
  validPeriod: string;
  ctaText:     string;
  ctaUrl:      string;
}

export interface EventContent {
  eventName:   string;
  date:        string;
  time:        string;
  description: string;
  imageUrl?:   string;
  ctaText:     string;
  ctaUrl:      string;
}

export interface CustomContent {
  headline:  string;
  body:      string;
  ctaText?:  string;
  ctaUrl?:   string;
}

export type TemplateContent = PromoContent | MenuContent | EventContent | CustomContent;

// ── Unsplash images ──────────────────────────────────────────────────────────

const IMG_FOOD    = 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80';
const IMG_AMBIANCE= 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&q=80';
const IMG_CLOSEUP = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&q=80';
const IMG_GRILL   = 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&q=80';

// ── Helpers ──────────────────────────────────────────────────────────────────

function clickUrl(trackingId: string, target: string): string {
  return `${SITE}/api/email/track/click?id=${encodeURIComponent(trackingId)}&url=${encodeURIComponent(target)}`;
}

function unsubUrl(trackingId: string): string {
  return `${SITE}/api/email/unsubscribe?token=${trackingId}`;
}

function divider(): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="height:1px;background:linear-gradient(to right,#1a1008,#C9A84C 30%,#C9A84C 70%,#1a1008);font-size:0;line-height:0;">&nbsp;</td></tr>
  </table>`;
}

function ctaButton(text: string, href: string): string {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:28px 0 0;">
    <tr>
      <td align="center">
        <a href="${href}" style="display:block;max-width:320px;margin:0 auto;background:#C9A84C;color:#0a0600;text-decoration:none;font-family:Arial,sans-serif;font-size:15px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;padding:16px 32px;border-radius:4px;text-align:center;">${text}</a>
      </td>
    </tr>
  </table>`;
}

// Hero section using table background="" for Outlook + background-image CSS for Gmail/Apple Mail.
// Gradient overlay applied on the td so the text remains legible.
function hero(imageUrl: string, subline: string, headline: string): string {
  return `<table width="600" cellpadding="0" cellspacing="0" border="0"
    background="${imageUrl}"
    style="background-image:url('${imageUrl}');background-size:cover;background-position:center;width:600px;max-width:600px;">
    <tr>
      <td height="280" valign="bottom"
        style="background:linear-gradient(180deg,rgba(10,6,0,0.05) 0%,rgba(10,6,0,0.60) 50%,rgba(10,6,0,0.92) 100%);padding:0 32px 30px;vertical-align:bottom;">
        <p style="margin:0 0 8px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#C9A84C;text-align:center;">${subline}</p>
        <h1 style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:30px;font-weight:700;color:#ffffff;text-align:center;line-height:1.25;text-shadow:0 2px 12px rgba(0,0,0,0.8);">${headline}</h1>
      </td>
    </tr>
  </table>`;
}

// ── Logo bar ─────────────────────────────────────────────────────────────────

const LOGO_ROW = `<tr>
  <td style="background:#0a0600;padding:18px 32px;text-align:center;border-bottom:1px solid #3a2810;">
    <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;letter-spacing:5px;color:#C9A84C;font-weight:700;text-transform:uppercase;">River's Lounge</p>
    <p style="margin:4px 0 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;color:#6a5030;text-transform:uppercase;">Restaurant &amp; Terrace · Călărași</p>
  </td>
</tr>`;

// ── Footer ───────────────────────────────────────────────────────────────────

function footerRow(trackingId: string): string {
  return `<tr>
  <td style="background:#0a0600;padding:28px 32px;text-align:center;border-top:1px solid #3a2810;">
    <p style="margin:0 0 6px;font-family:Georgia,'Times New Roman',serif;font-size:16px;letter-spacing:4px;color:#C9A84C;font-weight:700;">RIVER'S LOUNGE</p>
    <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:12px;color:#5a4020;">Str. Dobrogei nr. 1, Călărași</p>
    <p style="margin:0 0 18px;font-family:Arial,sans-serif;font-size:12px;color:#5a4020;">
      <a href="tel:+40700000000" style="color:#6a5030;text-decoration:none;">+40 700 000 000</a>
    </p>
    <table width="200" cellpadding="0" cellspacing="0" style="margin:0 auto 18px;">
      <tr><td style="height:1px;background:#3a2810;font-size:0;line-height:0;">&nbsp;</td></tr>
    </table>
    <p style="margin:0 0 10px;font-family:Arial,sans-serif;font-size:11px;color:#4a3018;">
      <a href="${unsubUrl(trackingId)}" style="color:#6a5030;text-decoration:underline;">Dezabonare emailuri promoționale</a>
      &nbsp;&nbsp;·&nbsp;&nbsp;
      <a href="${SITE}/confidentialitate" style="color:#4a3018;text-decoration:none;">Confidențialitate</a>
    </p>
    <p style="margin:0;font-family:Arial,sans-serif;font-size:10px;color:#3a2010;">© ${new Date().getFullYear()} RIVERS LOUNGE CROWD SRL. Toate drepturile rezervate.</p>
  </td>
</tr>`;
}

// ── Outer wrapper ────────────────────────────────────────────────────────────

function wrap(heroHtml: string, bodyHtml: string, trackingId: string): string {
  const pixel = `<img src="${SITE}/api/email/track/open?id=${encodeURIComponent(trackingId)}" width="1" height="1" style="display:none;" alt="" />`;
  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta name="x-apple-disable-message-reformatting" />
</head>
<body style="margin:0;padding:0;background-color:#0f0900;font-family:Arial,sans-serif;">${pixel}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0f0900;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0"
      style="background:#1a1008;max-width:600px;width:100%;border:1px solid #3a2810;">
      ${LOGO_ROW}
      <tr><td style="padding:0;line-height:0;">${heroHtml}</td></tr>
      <tr>
        <td style="padding:36px 32px;background:#1a1008;">
          ${bodyHtml}
        </td>
      </tr>
      ${footerRow(trackingId)}
    </table>
  </td></tr>
</table>
</body></html>`;
}

// ── Greeting helper ───────────────────────────────────────────────────────────

function greeting(name: string): string {
  if (!name) return '';
  return `<p style="font-family:Arial,sans-serif;font-size:15px;color:#c8b090;margin:0 0 16px;line-height:1.6;">
    Bună, <strong style="color:#e8d4b0;">${name}</strong>!
  </p>`;
}

// ── PROMO ────────────────────────────────────────────────────────────────────

function renderPromo(c: PromoContent, trackingId: string, name: string): string {
  const h = hero(IMG_GRILL, 'Ofertă specială', c.headline);

  const body = `
    ${greeting(name)}

    ${divider()}

    <!-- Discount badge -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 20px;">
      <tr>
        <td align="center">
          <table cellpadding="0" cellspacing="0" style="border:2px solid #C9A84C;border-radius:50%;width:160px;height:160px;background:#221008;">
            <tr>
              <td align="center" valign="middle" style="text-align:center;padding:10px;">
                <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:54px;font-weight:700;color:#C9A84C;line-height:1;">${c.discount}</p>
                <p style="margin:6px 0 0;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7a5828;">reducere</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>

    <!-- Valid until -->
    <p style="font-family:Arial,sans-serif;font-size:13px;letter-spacing:1px;color:#a07840;text-align:center;margin:0 0 4px;text-transform:uppercase;">Valabil până pe</p>
    <p style="font-family:Georgia,'Times New Roman',serif;font-size:18px;color:#e8c878;text-align:center;margin:0 0 4px;font-weight:700;">${c.validUntil}</p>

    ${divider()}

    <!-- Description -->
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#c8b090;line-height:1.75;margin:0 0 24px;">${c.description}</p>

    <!-- Exclusive note -->
    <p style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:1px;color:#7a5828;text-align:center;margin:0;text-transform:uppercase;">✦ Ofertă exclusivă pentru clienții noștri fideli ✦</p>

    ${ctaButton(c.ctaText, clickUrl(trackingId, c.ctaUrl))}
  `;

  return wrap(h, body, trackingId);
}

// ── MENU ─────────────────────────────────────────────────────────────────────

function formatMenuItems(raw: string): string {
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => `<table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 1px;">
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid #2a1608;">
          <table cellpadding="0" cellspacing="0">
            <tr>
              <td width="20" valign="top" style="color:#C9A84C;font-size:10px;padding-top:3px;font-family:Arial,sans-serif;">◆</td>
              <td style="font-family:Arial,sans-serif;font-size:14px;color:#d4c0a0;line-height:1.55;">${line}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`)
    .join('');
}

function renderMenu(c: MenuContent, trackingId: string, name: string): string {
  const h = hero(IMG_CLOSEUP, 'Meniul Săptămânii', c.headline);

  const body = `
    ${greeting(name)}

    <!-- Valid period -->
    <p style="font-family:Arial,sans-serif;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#7a5828;margin:0 0 20px;text-align:center;">
      ✦ &nbsp;Valabil: <span style="color:#C9A84C;">${c.validPeriod}</span>&nbsp; ✦
    </p>

    ${divider()}

    <!-- Menu items -->
    <div style="margin:0 0 8px;">
      ${formatMenuItems(c.items)}
    </div>

    ${divider()}

    ${c.ctaText && c.ctaUrl ? ctaButton(c.ctaText, clickUrl(trackingId, c.ctaUrl)) : ''}
  `;

  return wrap(h, body, trackingId);
}

// ── EVENT ────────────────────────────────────────────────────────────────────

function renderEvent(c: EventContent, trackingId: string, name: string): string {
  const imgSrc = c.imageUrl || IMG_AMBIANCE;
  const h = hero(imgSrc, 'Eveniment special', c.eventName);

  const body = `
    ${greeting(name)}

    ${divider()}

    <!-- Date & time block -->
    <table width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
      <tr>
        <td align="center" style="background:#221008;border:1px solid #3a2010;border-radius:4px;padding:22px 16px;">
          <p style="margin:0 0 4px;font-family:Arial,sans-serif;font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#7a5828;">Data evenimentului</p>
          <p style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:24px;font-weight:700;color:#e8c878;">${c.date}</p>
          <table cellpadding="0" cellspacing="0" style="margin:0 auto 10px;"><tr><td style="height:1px;width:60px;background:#3a2010;font-size:0;">&nbsp;</td></tr></table>
          <p style="margin:0;font-family:Georgia,'Times New Roman',serif;font-size:20px;font-weight:700;color:#C9A84C;">🕐&nbsp;${c.time}</p>
        </td>
      </tr>
    </table>

    <!-- Description -->
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#c8b090;line-height:1.75;margin:0 0 4px;">${c.description}</p>

    ${divider()}

    ${ctaButton(c.ctaText, clickUrl(trackingId, c.ctaUrl))}
  `;

  return wrap(h, body, trackingId);
}

// ── CUSTOM ───────────────────────────────────────────────────────────────────

function renderCustom(c: CustomContent, trackingId: string, name: string): string {
  const h = hero(IMG_FOOD, 'River\'s Lounge', c.headline);

  const body = `
    ${greeting(name)}

    ${divider()}

    <div style="font-family:Arial,sans-serif;font-size:15px;color:#c8b090;line-height:1.75;margin:0 0 8px;">${c.body}</div>

    ${c.ctaText && c.ctaUrl ? `${divider()}${ctaButton(c.ctaText, clickUrl(trackingId, c.ctaUrl))}` : ''}
  `;

  return wrap(h, body, trackingId);
}

// ── Public API ───────────────────────────────────────────────────────────────

export function renderTemplate(
  template: TemplateType,
  content: TemplateContent,
  trackingId: string,
  recipientName = ''
): string {
  switch (template) {
    case 'PROMO':  return renderPromo(content as PromoContent,   trackingId, recipientName);
    case 'MENU':   return renderMenu(content as MenuContent,     trackingId, recipientName);
    case 'EVENT':  return renderEvent(content as EventContent,   trackingId, recipientName);
    case 'CUSTOM': return renderCustom(content as CustomContent, trackingId, recipientName);
  }
}
