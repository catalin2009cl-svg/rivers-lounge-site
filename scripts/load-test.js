/**
 * k6 load test — Rivers Lounge realistic order flow
 *
 * Run:
 *   k6 run scripts/load-test.js
 *   NEXT_ACTION_ID=<hash> k6 run scripts/load-test.js   (enables order step)
 *
 * ─── ARCHITECTURE NOTES ────────────────────────────────────────────────────
 *
 * There is NO /api/comenzi or /api/cos/adauga endpoint.
 *
 * CART — lives entirely in client-side React context (contexts/cart-context).
 *   There is no server-side cart. Step 3 simulates the user selecting an item
 *   via think-time only; items are sent directly in the order payload.
 *
 * ORDER PLACEMENT — handled by a Next.js Server Action (lib/actions/orders.ts:
 *   saveOrder). The browser POSTs to /comanda/checkout with:
 *     Content-Type: text/plain;charset=UTF-8
 *     Next-Action: <build-time hash>          ← changes every deployment
 *     Body: JSON array of the action arguments
 *
 *   To get the NEXT_ACTION_ID:
 *     1. Open DevTools → Network on https://riverslounge.ro/comanda/checkout
 *     2. Place a test order through the normal UI
 *     3. Find the POST request to /comanda/checkout
 *     4. Copy the value of the "Next-Action" request header
 *     5. Pass it: NEXT_ACTION_ID=<hash> k6 run scripts/load-test.js
 *
 * PRODUCT IDs — stored in Prisma (MenuItem table, CUID primary keys).
 *   Replace SAMPLE_PRODUCTS below with real IDs from the production menu.
 *   Find them in the admin panel at /admin/meniu, or run:
 *     SELECT id, name, price FROM "MenuItem" WHERE status='disponibil' LIMIT 5;
 *
 * ───────────────────────────────────────────────────────────────────────────
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BASE_URL = 'https://riverslounge.ro';

// Injected at runtime: NEXT_ACTION_ID=<hash> k6 run scripts/load-test.js
// Step 5 is skipped (with a warning) if this is not set.
const NEXT_ACTION_ID = __ENV.NEXT_ACTION_ID || '';

// Replace with real product IDs from the production MenuItem table.
// Format mirrors lib/server-data.ts:OrderItem.
const SAMPLE_PRODUCTS = [
  { id: 'REPLACE_WITH_REAL_ID_1', name: 'Produs Test 1', price: 35, quantity: 1, unit: 'buc', category: 'food' },
  { id: 'REPLACE_WITH_REAL_ID_2', name: 'Produs Test 2', price: 42, quantity: 1, unit: 'buc', category: 'food' },
  { id: 'REPLACE_WITH_REAL_ID_3', name: 'Produs Test 3', price: 28, quantity: 1, unit: 'buc', category: 'food' },
];

const HTML_HEADERS = {
  'User-Agent': 'k6-load-test/1.0 (Rivers Lounge order flow)',
  'Accept': 'text/html,application/xhtml+xml',
};

// ---------------------------------------------------------------------------
// Custom metrics — separate tracking per step type
// ---------------------------------------------------------------------------

const pageDuration  = new Trend('page_duration', true);   // GET pages (ms)
const orderDuration = new Trend('order_duration', true);  // POST order (ms)
const orderErrors   = new Rate('order_errors');            // order placement failures
const pageErrors    = new Rate('page_errors');             // page load failures

// ---------------------------------------------------------------------------
// Test options
// ---------------------------------------------------------------------------

export const options = {
  vus: 10,
  duration: '60s',

  thresholds: {
    // Step 5: order placement
    order_duration: ['p(95)<5000'],  // 95th percentile under 5 s
    order_errors:   ['rate<0.01'],   // fewer than 1% failures

    // Steps 1, 2, 4: page loads
    page_duration:  ['p(95)<2000'],  // 95th percentile under 2 s
    page_errors:    ['rate<0.01'],
  },
};

// ---------------------------------------------------------------------------
// Virtual user scenario
// ---------------------------------------------------------------------------

export default function () {

  // Step 1 — homepage
  group('step1_homepage', () => {
    const res = http.get(`${BASE_URL}/`, { headers: HTML_HEADERS });
    const ok  = check(res, { 'homepage 2xx': (r) => r.status >= 200 && r.status < 300 });
    pageDuration.add(res.timings.duration);
    pageErrors.add(!ok);
  });
  sleep(1 + Math.random()); // 1–2 s think time

  // Step 2 — browse menu
  group('step2_menu', () => {
    const res = http.get(`${BASE_URL}/meniu`, { headers: HTML_HEADERS });
    const ok  = check(res, { 'menu 2xx': (r) => r.status >= 200 && r.status < 300 });
    pageDuration.add(res.timings.duration);
    pageErrors.add(!ok);
  });
  sleep(2 + Math.random()); // 2–3 s browsing

  // Step 3 — "add to cart" (client-side only — no server round-trip)
  // The cart lives in React context / localStorage. Items are carried through
  // to the checkout payload in step 5; there is no /api/cos/adauga endpoint.
  sleep(1 + Math.random()); // 1–2 s selecting item

  // Step 4 — checkout page
  group('step4_checkout', () => {
    const res = http.get(`${BASE_URL}/comanda/checkout`, { headers: HTML_HEADERS });
    const ok  = check(res, { 'checkout 2xx': (r) => r.status >= 200 && r.status < 300 });
    pageDuration.add(res.timings.duration);
    pageErrors.add(!ok);
  });
  sleep(1 + Math.random()); // 1–2 s filling form

  // Step 5 — place order via Next.js Server Action
  if (!NEXT_ACTION_ID) {
    // Warn once per VU iteration; does not fail the test.
    console.warn('[step5] NEXT_ACTION_ID not set — order placement skipped. See script header.');
    return;
  }

  group('step5_place_order', () => {
    const item     = SAMPLE_PRODUCTS[Math.floor(Math.random() * SAMPLE_PRODUCTS.length)];
    const subtotal = item.price;
    const total    = subtotal; // pickup → no delivery fee

    // Server Actions receive args as a JSON-encoded array.
    // Payload shape mirrors lib/actions/orders.ts:OrderInput.
    // orderType 'ridicare' (pickup) avoids delivery address/fee complexity.
    const payload = JSON.stringify([{
      name:          'Test User',
      phone:         '0700000000',
      address:       '',
      city:          '',
      addressDetails:'',
      items:         [{ ...item, quantity: 1 }],
      subtotal,
      deliveryFee:   0,
      total,
      paymentMethod: 'cash',
      orderType:     'ridicare',
      notes:         'k6 load test — vă rugăm ignorați',
    }]);

    const res = http.post(
      `${BASE_URL}/comanda/checkout`,
      payload,
      {
        headers: {
          'User-Agent':    HTML_HEADERS['User-Agent'],
          'Content-Type': 'text/plain;charset=UTF-8',
          'Next-Action':  NEXT_ACTION_ID,
          'Accept':       'text/x-component',
        },
      }
    );

    const ok = check(res, {
      'order 2xx':       (r) => r.status >= 200 && r.status < 300,
      'no error field':  (r) => !r.body.includes('"error"'),
      'has success':     (r) => r.body.includes('"success"'),
    });

    orderDuration.add(res.timings.duration);
    orderErrors.add(!ok);
  });
}

// ---------------------------------------------------------------------------
// Custom end-of-test summary
// ---------------------------------------------------------------------------

export function handleSummary(data) {
  const m = (key) => data.metrics[key]?.values ?? {};

  const pageDur  = m('page_duration');
  const ordDur   = m('order_duration');
  const pageErr  = m('page_errors');
  const ordErr   = m('order_errors');
  const reqs     = m('http_reqs');

  const fmt  = (v) => v !== undefined ? v.toFixed(0) + ' ms' : 'n/a';
  const fmtr = (v) => v !== undefined ? (v * 100).toFixed(2) + '%' : 'n/a';
  const fmtN = (v) => v !== undefined ? v.toFixed(2) : 'n/a';
  const pass = (ok) => ok ? 'PASS ✓' : 'FAIL ✗';

  const pageP95 = pageDur['p(95)'];
  const ordP95  = ordDur['p(95)'];

  const pageP95Pass  = pageP95  !== undefined ? pageP95  < 2000 : true;
  const ordP95Pass   = ordP95   !== undefined ? ordP95   < 5000 : true;
  const pageErrPass  = (pageErr.rate ?? 0) < 0.01;
  const ordErrPass   = (ordErr.rate  ?? 0) < 0.01;

  const actionNote = NEXT_ACTION_ID
    ? NEXT_ACTION_ID.slice(0, 12) + '…'
    : 'not set (step 5 skipped)';

  const report = `
╔══════════════════════════════════════════════════════╗
║       Rivers Lounge — Order Flow Load Test           ║
╠══════════════════════════════════════════════════════╣
║  Config                                              ║
║    Virtual users   :  10                             ║
║    Duration        :  60 s                           ║
║    Target          :  ${BASE_URL.padEnd(28)}║
║    Next-Action ID  :  ${actionNote.padEnd(28)}║
╠══════════════════════════════════════════════════════╣
║  Page loads  (steps 1, 2, 4)                         ║
║    p95 response    :  ${fmt(pageP95).padEnd(28)}║
║    Error rate      :  ${fmtr(pageErr.rate).padEnd(28)}║
║    p95 < 2 000 ms  :  ${pass(pageP95Pass).padEnd(28)}║
║    Error rate < 1% :  ${pass(pageErrPass).padEnd(28)}║
╠══════════════════════════════════════════════════════╣
║  Order placement  (step 5)                           ║
║    p95 response    :  ${fmt(ordP95).padEnd(28)}║
║    Error rate      :  ${fmtr(ordErr.rate).padEnd(28)}║
║    p95 < 5 000 ms  :  ${pass(ordP95Pass).padEnd(28)}║
║    Error rate < 1% :  ${pass(ordErrPass).padEnd(28)}║
╠══════════════════════════════════════════════════════╣
║  Overall                                             ║
║    Total requests  :  ${String(reqs.count ?? 0).padEnd(28)}║
║    Requests/sec    :  ${fmtN(reqs.rate).padEnd(28)}║
╚══════════════════════════════════════════════════════╝
`;

  return {
    stdout: report,
    'scripts/load-test-summary.json': JSON.stringify(data, null, 2),
  };
}
