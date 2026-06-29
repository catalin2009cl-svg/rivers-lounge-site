import { NextResponse } from 'next/server';
import { Google, generateState, generateCodeVerifier } from 'arctic';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  console.log('[OAuth/Google] clientId:', clientId ? `SET (${clientId.slice(0, 8)}…)` : 'MISSING');
  console.log('[OAuth/Google] clientSecret:', clientSecret ? 'SET' : 'MISSING');

  if (!clientId || !clientSecret) {
    const missing = [!clientId && 'GOOGLE_CLIENT_ID', !clientSecret && 'GOOGLE_CLIENT_SECRET']
      .filter(Boolean)
      .join(',');
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://riverslounge.ro';
    return NextResponse.redirect(
      `${base}/cont/autentificare?error=oauth_not_configured&missing=${missing}`
    );
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://riverslounge.ro';
  const google = new Google(clientId, clientSecret, `${siteUrl}/api/auth/google/callback`);

  const state = generateState();
  const codeVerifier = generateCodeVerifier();
  const url = google.createAuthorizationURL(state, codeVerifier, ['openid', 'profile', 'email']);

  const cookieOpts = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: 600,
    path: '/',
  };

  const response = NextResponse.redirect(url);
  response.cookies.set('google_oauth_state', state, cookieOpts);
  response.cookies.set('google_oauth_code_verifier', codeVerifier, cookieOpts);
  return response;
}
