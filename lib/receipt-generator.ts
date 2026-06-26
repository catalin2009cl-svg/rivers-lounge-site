import type { Order } from '@/lib/server-data';

export function generateReceiptHTML(order: Order): string {
  const date = new Date(order.createdAt).toLocaleDateString('ro-RO', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const itemsRows = order.items
    .map(
      (item) => `
    <tr>
      <td style="padding:5px 0;vertical-align:top">${item.name}${item.unit ? `<br><span style="font-size:10px;color:#666">/ ${item.unit}</span>` : ''}</td>
      <td style="text-align:center;padding:5px 4px;vertical-align:top;white-space:nowrap">${item.quantity}x</td>
      <td style="text-align:right;padding:5px 0;vertical-align:top;white-space:nowrap">${item.price} RON</td>
      <td style="text-align:right;padding:5px 0;vertical-align:top;white-space:nowrap;font-weight:600">${(item.quantity * item.price).toFixed(0)} RON</td>
    </tr>`
    )
    .join('');

  const statusLabel =
    order.status === 'livrata'      ? '✓ COMANDĂ LIVRATĂ' :
    order.status === 'confirmata'   ? '✓ CONFIRMATĂ' :
    order.status === 'in-pregatire' ? '⏳ ÎN PREGĂTIRE' :
    order.status === 'anulata'      ? '✗ ANULATĂ' :
                                      '⏳ ÎN PROCESARE';

  const discountAmt = order.discountAmount ?? 0;

  return `<!DOCTYPE html>
<html lang="ro">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Bon Comandă ${order.id}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', Courier, monospace;
      max-width: 420px;
      margin: 0 auto;
      padding: 24px 20px;
      color: #111;
      background: #fff;
      font-size: 13px;
      line-height: 1.5;
    }
    .header { text-align: center; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px dashed #111; }
    .logo { font-size: 22px; font-weight: bold; letter-spacing: 3px; }
    .subtitle { font-size: 12px; margin-top: 3px; color: #333; }
    .contact { font-size: 11px; color: #555; margin-top: 8px; line-height: 1.6; }

    .order-info { margin: 14px 0; font-size: 12px; }
    .order-info div { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 4px; }
    .order-info span:first-child { color: #555; flex-shrink: 0; }
    .order-info span:last-child { text-align: right; font-weight: 500; word-break: break-all; }

    .divider { border: none; border-top: 1px dashed #111; margin: 12px 0; }

    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th {
      text-align: left; font-size: 10px; text-transform: uppercase;
      letter-spacing: 0.05em; padding-bottom: 8px;
      border-bottom: 1px solid #111; color: #333;
    }
    thead th:not(:first-child) { text-align: right; }
    thead th:nth-child(2) { text-align: center; }

    .totals { margin-top: 10px; font-size: 13px; }
    .totals div { display: flex; justify-content: space-between; padding: 3px 0; gap: 8px; }
    .totals span:last-child { font-weight: 500; }
    .totals .discount { color: #167a3b; }
    .total-final {
      font-size: 16px; font-weight: bold;
      border-top: 2px solid #111; padding-top: 8px; margin-top: 6px;
    }

    .status-wrap { text-align: center; margin: 16px 0; }
    .status-badge {
      display: inline-block; padding: 5px 16px;
      border: 1.5px solid #111; font-size: 11px;
      text-transform: uppercase; letter-spacing: 1px; font-weight: 600;
    }

    .footer {
      text-align: center; margin-top: 20px;
      padding-top: 16px; border-top: 2px dashed #111;
      font-size: 11px; color: #555; line-height: 1.7;
    }
    .fiscal-note { margin-top: 10px; font-size: 10px; color: #777; }

    .actions {
      display: flex; gap: 8px; justify-content: center;
      margin-top: 24px; padding-top: 16px; border-top: 1px solid #ddd;
    }
    .btn-print {
      background: #111; color: #fff; border: none;
      padding: 10px 24px; cursor: pointer; font-size: 13px;
      font-family: inherit; border-radius: 4px;
    }
    .btn-close {
      background: #fff; color: #111; border: 1px solid #111;
      padding: 10px 20px; cursor: pointer; font-size: 13px;
      font-family: inherit; border-radius: 4px;
    }

    @media print {
      body { max-width: 100%; padding: 0; }
      .actions { display: none !important; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo">RIVER'S LOUNGE</div>
    <div class="subtitle">Restaurant &amp; Evenimente</div>
    <div class="contact">
      Str. Dobrogei nr. 1, Călărași, România<br>
      Tel: 0725 635 020 &nbsp;|&nbsp; renetrading@yahoo.com
    </div>
  </div>

  <div class="order-info">
    <div><span><strong>BON COMANDĂ</strong></span><span style="font-family:monospace;color:#555">${order.id}</span></div>
    <div><span>Data:</span><span>${date}</span></div>
    <div><span>Tip comandă:</span><span>${order.orderType === 'livrare' ? 'Livrare la domiciliu' : 'Ridicare din restaurant'}</span></div>
    <div><span>Metodă plată:</span><span>${order.paymentMethod === 'cash' ? 'Numerar' : 'Card'}</span></div>
    ${order.address ? `<div><span>Adresă livrare:</span><span>${[order.address, order.addressDetails, order.city].filter(Boolean).join(', ')}</span></div>` : ''}
    ${order.discountApplied ? `<div><span>Cod reducere:</span><span>${order.discountApplied}</span></div>` : ''}
  </div>

  <hr class="divider">

  <table>
    <thead>
      <tr>
        <th style="text-align:left">Produs</th>
        <th style="text-align:center">Cant.</th>
        <th style="text-align:right">Preț</th>
        <th style="text-align:right">Total</th>
      </tr>
    </thead>
    <tbody>
      ${itemsRows}
    </tbody>
  </table>

  <hr class="divider">

  <div class="totals">
    <div><span>Subtotal:</span><span>${order.subtotal} RON</span></div>
    ${order.deliveryFee > 0
      ? `<div><span>Livrare:</span><span>${order.deliveryFee} RON</span></div>`
      : `<div><span>Livrare:</span><span>GRATUITĂ</span></div>`}
    ${discountAmt > 0
      ? `<div class="discount"><span>Reducere (${order.discountApplied ?? ''}):</span><span>-${discountAmt} RON</span></div>`
      : ''}
    <div class="total-final"><span>TOTAL:</span><span>${order.total} RON</span></div>
  </div>

  <hr class="divider">

  <div class="status-wrap">
    <span class="status-badge">${statusLabel}</span>
  </div>

  <div class="footer">
    <p>Vă mulțumim pentru comandă!</p>
    <p>riverslounge.ro</p>
    <p class="fiscal-note">
      Acest document nu reprezintă o factură fiscală.<br>
      Pentru factură contactați-ne la renetrading@yahoo.com
    </p>
  </div>

  <div class="actions">
    <button class="btn-print" onclick="window.print()">🖨️ Printează / Salvează PDF</button>
    <button class="btn-close" onclick="window.close()">✕ Închide</button>
  </div>

</body>
</html>`;
}

export function openReceipt(order: Order): void {
  const html = generateReceiptHTML(order);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const win = window.open(url, '_blank', 'width=520,height=720,scrollbars=yes');
  // Revoke after the window has had time to load
  if (win) {
    win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true });
  } else {
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }
}
