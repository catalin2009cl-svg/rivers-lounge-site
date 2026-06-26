/**
 * Refresh street data from OpenStreetMap Overpass API.
 * Run: npx ts-node scripts/update-streets.ts
 */

import https from 'https';
import fs from 'fs';
import path from 'path';

const OVERPASS_HOSTS = [
  'lz4.overpass-api.de',
  'z.overpass-api.de',
  'overpass-api.de',
];

const LOCALITIES: { name: string; bbox: string }[] = [
  { name: 'Călărași', bbox: '44.155,27.285,44.220,27.390' },
  { name: 'Modelu',   bbox: '44.183,27.355,44.206,27.400' },
  { name: 'Tonea',    bbox: '44.199,27.396,44.212,27.417' },
];

const STREET_PREFIXES = [
  'Strada ', 'Bulevardul ', 'Calea ', 'Aleea ', 'Intrarea ',
  'Prelungirea ', 'Fundătura ', 'Piața ', 'Splaiul ', 'Șoseaua ',
];

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function overpassQuery(ql: string, host: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const body = 'data=' + encodeURIComponent(ql);
    const options = {
      hostname: host,
      path: '/api/interpreter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Content-Length': Buffer.byteLength(body),
        'User-Agent': 'RiversLoungeStreetFetcher/1.0 (restaurant-website)',
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          resolve({ error: data.slice(0, 200) });
        }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

function extractStreets(r: any): string[] {
  if (!r.elements) return [];
  const names = r.elements
    .map((e: any) => e.tags?.name)
    .filter(Boolean) as string[];
  const filtered = names.filter((name) =>
    STREET_PREFIXES.some((prefix) => name.startsWith(prefix))
  );
  return [...new Set(filtered)].sort((a, b) => a.localeCompare(b, 'ro'));
}

async function fetchWithRetry(bbox: string): Promise<string[]> {
  const ql = `[out:json][timeout:60];\nway["highway"]["name"](${bbox});\nout tags;`;
  for (const host of OVERPASS_HOSTS) {
    await sleep(4000);
    const r = await overpassQuery(ql, host);
    const streets = extractStreets(r);
    if (streets.length > 0) {
      return streets;
    }
    console.log(`  ${host} returned 0 streets, trying next mirror...`);
  }
  return [];
}

async function main() {
  console.log('Fetching streets from OpenStreetMap Overpass API...\n');

  const cities: Record<string, string[]> = {};

  for (const locality of LOCALITIES) {
    console.log(`Fetching ${locality.name} (bbox: ${locality.bbox})...`);
    const streets = await fetchWithRetry(locality.bbox);
    cities[locality.name] = streets;
    console.log(`  ${streets.length} streets found`);
  }

  const output = {
    lastUpdated: new Date().toISOString().split('T')[0],
    source: 'OpenStreetMap Overpass API (data © OpenStreetMap contributors, ODbL)',
    note: 'Re-run scripts/update-streets.ts to refresh street data.',
    cities,
  };

  const outPath = path.join(process.cwd(), 'lib', 'data', 'streets.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2), 'utf-8');

  console.log('\nSaved to lib/data/streets.json');
  Object.entries(cities).forEach(([city, streets]) => {
    console.log(`  ${city}: ${streets.length} streets`);
  });
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
