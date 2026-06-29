import { defineConfig } from 'prisma/config';
import fs from 'node:fs';
import path from 'node:path';

// Load .env.local so DATABASE_URL is available when Prisma CLI runs
// outside of Next.js (prisma db push, prisma studio, etc.).
// Only sets variables that aren't already in the environment.
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  const content = fs.readFileSync(envPath, 'utf-8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (match && !process.env[match[1]]) {
      process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, '');
    }
  }
} catch { /* .env.local not present — CI/Vercel supply vars directly */ }

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL,
  },
});
