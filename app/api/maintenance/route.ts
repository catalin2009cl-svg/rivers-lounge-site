import { NextResponse } from 'next/server';
import { getSettings } from '@/lib/server-data';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await getSettings();
    return NextResponse.json({ enabled: settings.maintenanceMode?.enabled ?? false });
  } catch {
    return NextResponse.json({ enabled: false });
  }
}
