import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const EMAIL_HEADER = `
  <tr>
    <td style="background-color:#1a1a1a;padding:30px;text-align:center;border-bottom:2px solid #C9A84C;">
      <h1 style="color:#C9A84C;margin:0;font-size:24px;letter-spacing:2px;">RIVERS LOUNGE</h1>
      <p style="color:#888888;margin:5px 0 0;font-size:12px;">riverslounge.ro</p>
    </td>
  </tr>`;

const EMAIL_FOOTER = `
  <tr>
    <td style="background-color:#1a1a1a;padding:20px 30px;text-align:center;border-top:1px solid #333333;">
      <p style="color:#666666;margin:0;font-size:12px;">
        © ${new Date().getFullYear()} RIVERS LOUNGE CROWD SRL | Str. Dobrogei nr. 1, Călărași<br>
        <a href="https://riverslounge.ro/confidentialitate" style="color:#C9A84C;">Politică de Confidențialitate</a>
      </p>
    </td>
  </tr>`;

function emailWrapper(content: string): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">
        ${EMAIL_HEADER}
        <tr><td style="padding:40px 30px;">${content}</td></tr>
        ${EMAIL_FOOTER}
      </table>
    </td></tr>
  </table></body></html>`;
}

export async function sendReviewRequestEmail(
  to: string,
  userName: string,
  orderId: string,
  reviewToken: string
): Promise<void> {
  const base = `https://riverslounge.ro/recenzie?token=${reviewToken}&orderId=${orderId}`;
  const stars = [1, 2, 3, 4, 5]
    .map(
      (n) =>
        `<a href="${base}&rating=${n}" style="display:inline-block;width:44px;height:44px;line-height:44px;text-align:center;background:#1a1a1a;border:1px solid #333;border-radius:8px;color:#C9A84C;text-decoration:none;font-size:20px;margin:0 4px;">` +
        '★'.repeat(n) +
        '</a>'
    )
    .join('');

  await resend.emails.send({
    from: 'Rivers Lounge <no_reply@riverslounge.ro>',
    to,
    subject: 'Cum a fost comanda ta? Lasă o recenzie — Rivers Lounge',
    html: emailWrapper(`
      <h2 style="color:#ffffff;margin:0 0 16px;font-size:20px;">Cum ți-a plăcut comanda?</h2>
      <p style="color:#cccccc;margin:0 0 8px;line-height:1.6;">Bună, <strong style="color:#ffffff;">${userName}</strong>!</p>
      <p style="color:#cccccc;margin:0 0 24px;line-height:1.6;">
        Sperăm că ai savurat experiența Rivers Lounge. Alege câte stele merită comanda ta
        (comanda <strong style="color:#C9A84C;">#${orderId.slice(-8).toUpperCase()}</strong>):
      </p>
      <div style="margin:0 0 28px;text-align:center;">${stars}</div>
      <p style="color:#666666;font-size:12px;margin:0;">Durează sub 30 de secunde. Recenzia ta ne ajută să ne îmbunătățim.</p>
    `),
  });
}

export async function sendLowRatingAlertEmail(
  orderId: string,
  userName: string,
  userEmail: string,
  rating: number,
  comment: string | null
): Promise<void> {
  await resend.emails.send({
    from: 'Rivers Lounge <no_reply@riverslounge.ro>',
    to: 'renetrading@yahoo.com',
    subject: `⚠️ Recenzie negativă (${rating}★) — comanda #${orderId.slice(-8).toUpperCase()}`,
    html: emailWrapper(`
      <h2 style="color:#F87171;margin:0 0 16px;font-size:20px;">⚠️ Recenzie negativă primită</h2>
      <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
        <tr><td style="color:#888;padding:6px 0;font-size:13px;width:140px;">Comandă</td><td style="color:#fff;font-size:13px;">#${orderId.slice(-8).toUpperCase()}</td></tr>
        <tr><td style="color:#888;padding:6px 0;font-size:13px;">Client</td><td style="color:#fff;font-size:13px;">${userName} (${userEmail})</td></tr>
        <tr><td style="color:#888;padding:6px 0;font-size:13px;">Rating</td><td style="color:#F87171;font-size:18px;font-weight:700;">${'★'.repeat(rating)}${'☆'.repeat(5 - rating)} (${rating}/5)</td></tr>
        ${comment ? `<tr><td style="color:#888;padding:6px 0;font-size:13px;vertical-align:top;">Comentariu</td><td style="color:#cccccc;font-size:13px;font-style:italic;">&ldquo;${comment}&rdquo;</td></tr>` : ''}
      </table>
      <a href="https://riverslounge.ro/admin/recenzii" style="display:inline-block;padding:12px 24px;background:#C9A84C;color:#000;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Vezi recenzia în admin →
      </a>
    `),
  });
}

export async function sendBirthdayEmail(
  to: string,
  userName: string,
  creditAmount: number
): Promise<void> {
  await resend.emails.send({
    from: 'Rivers Lounge <no_reply@riverslounge.ro>',
    to,
    subject: '🎂 La mulți ani! Ai primit credit în portofel — Rivers Lounge',
    html: emailWrapper(`
      <h2 style="color:#C9A84C;margin:0 0 16px;font-size:22px;text-align:center;">🎂 La mulți ani, ${userName}!</h2>
      <p style="color:#cccccc;margin:0 0 20px;line-height:1.6;text-align:center;">
        Îți urăm o zi de naștere minunată și te așteptăm cu drag la Rivers Lounge!
      </p>
      <div style="background:#1a1a1a;border:2px solid #C9A84C;border-radius:12px;padding:24px;text-align:center;margin:0 0 24px;">
        <p style="color:#888;font-size:13px;margin:0 0 8px;">Cadoul tău de ziua de naștere</p>
        <p style="color:#C9A84C;font-size:42px;font-weight:800;margin:0 0 4px;">${creditAmount} RON</p>
        <p style="color:#888;font-size:12px;margin:0;">credit în portofelul tău Rivers Lounge · valabil 15 zile</p>
      </div>
      <p style="color:#cccccc;margin:0 0 24px;line-height:1.6;text-align:center;">
        Creditul a fost adăugat automat în portofelul tău și se va aplica la următoarea comandă plasată online.
      </p>
      <div style="text-align:center;">
        <a href="https://riverslounge.ro/cont/fidelizare" style="display:inline-block;padding:14px 32px;background:#C9A84C;color:#000;text-decoration:none;border-radius:8px;font-weight:700;font-size:15px;">
          Vezi portofelul →
        </a>
      </div>
    `),
  });
}

export async function sendWeeklyReportEmail(
  pdfBuffer: Buffer,
  weekLabel: string
): Promise<void> {
  await resend.emails.send({
    from: 'Rivers Lounge <no_reply@riverslounge.ro>',
    to: 'renetrading@yahoo.com',
    subject: `📊 Raport săptămânal Rivers Lounge — ${weekLabel}`,
    html: emailWrapper(`
      <h2 style="color:#ffffff;margin:0 0 16px;font-size:20px;">Raport săptămânal</h2>
      <p style="color:#cccccc;margin:0 0 24px;line-height:1.6;">
        Găsești atașat raportul săptămânal pentru perioada <strong style="color:#C9A84C;">${weekLabel}</strong>.
      </p>
      <a href="https://riverslounge.ro/admin/rapoarte" style="display:inline-block;padding:12px 24px;background:#C9A84C;color:#000;text-decoration:none;border-radius:8px;font-weight:700;font-size:14px;">
        Vezi rapoartele în admin →
      </a>
    `),
    attachments: [
      {
        filename: `raport-rivers-${weekLabel.replace(/\s/g, '-')}.pdf`,
        content: pdfBuffer.toString('base64'),
      },
    ],
  });
}

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string,
  userName: string
): Promise<void> {
  await resend.emails.send({
    from: 'Rivers Lounge <no_reply@riverslounge.ro>',
    to,
    subject: 'Resetare parolă — Rivers Lounge',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin:0;padding:0;background-color:#0a0a0a;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0a0a0a;padding:40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111;border-radius:12px;overflow:hidden;max-width:600px;width:100%;">

                  <!-- Header -->
                  <tr>
                    <td style="background-color:#1a1a1a;padding:30px;text-align:center;border-bottom:2px solid #C9A84C;">
                      <h1 style="color:#C9A84C;margin:0;font-size:24px;letter-spacing:2px;">RIVERS LOUNGE</h1>
                      <p style="color:#888888;margin:5px 0 0;font-size:12px;">riverslounge.ro</p>
                    </td>
                  </tr>

                  <!-- Content -->
                  <tr>
                    <td style="padding:40px 30px;">
                      <h2 style="color:#ffffff;margin:0 0 16px;font-size:20px;">Resetare parolă</h2>
                      <p style="color:#cccccc;margin:0 0 16px;line-height:1.6;">
                        Bună, <strong style="color:#ffffff;">${userName}</strong>!
                      </p>
                      <p style="color:#cccccc;margin:0 0 24px;line-height:1.6;">
                        Am primit o solicitare de resetare a parolei pentru contul tău Rivers Lounge.
                        Apasă butonul de mai jos pentru a seta o nouă parolă.
                      </p>

                      <!-- Button -->
                      <table cellpadding="0" cellspacing="0" style="margin:0 0 24px;">
                        <tr>
                          <td style="background-color:#C9A84C;border-radius:8px;">
                            <a href="${resetLink}"
                               style="display:inline-block;padding:14px 32px;color:#000000;text-decoration:none;font-weight:bold;font-size:16px;">
                              Resetează parola
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color:#888888;margin:0 0 8px;font-size:13px;line-height:1.6;">
                        Linkul este valabil <strong style="color:#cccccc;">1 oră</strong> de la momentul solicitării.
                      </p>
                      <p style="color:#888888;margin:0 0 24px;font-size:13px;line-height:1.6;">
                        Dacă nu ai solicitat resetarea parolei, ignoră acest email. Parola ta nu va fi modificată.
                      </p>

                      <!-- Divider -->
                      <hr style="border:none;border-top:1px solid #333333;margin:24px 0;">

                      <p style="color:#666666;margin:0;font-size:12px;line-height:1.6;">
                        Dacă butonul nu funcționează, copiază și lipește acest link în browser:<br>
                        <a href="${resetLink}" style="color:#C9A84C;word-break:break-all;">${resetLink}</a>
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td style="background-color:#1a1a1a;padding:20px 30px;text-align:center;border-top:1px solid #333333;">
                      <p style="color:#666666;margin:0;font-size:12px;">
                        © ${new Date().getFullYear()} RIVERS LOUNGE CROWD SRL | Str. Dobrogei nr. 1, Călărași<br>
                        <a href="https://riverslounge.ro/confidentialitate" style="color:#C9A84C;">Politică de Confidențialitate</a>
                      </p>
                    </td>
                  </tr>

                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  });
}
