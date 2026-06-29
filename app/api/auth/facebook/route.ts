import { NextResponse } from 'next/server';
import { Facebook, generateState } from 'arctic';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;

  console.log('[OAuth/Facebook] clientId:', clientId ? `SET (${clientId.slice(0, 8)}…)` : 'MISSING');
  console.log('[OAuth/Facebook] clientSecret:', clientSecret ? 'SET' : 'MISSING');

  if (!clientId || !clientSecret) {
    const missing = [!clientId && 'FACEBOOK_CLIENT_ID', !clientSecret && 'FACEBOOK_CLIENT_SECRET']
      .filter(Boolean)
      .join(',');
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://riverslounge.ro';
    return NextResponse.redirect(
      `${base}/cont/autentificare?error=oauth_not_configured&missing=${missing}`
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://riverslounge.ro';
  const facebook = new Facebook(clientId, clientSecret, `${siteUrl}/api/auth/facebook/callback`);

  const state = generateState();
  const url = facebook.createAuthorizationURL(state, ['email', 'public_profile']);

  const response = NextResponse.redirect(url);
  response.cookies.set('facebook_oauth_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  return response;
}
