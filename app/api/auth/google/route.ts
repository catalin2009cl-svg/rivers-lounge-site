import { NextResponse } from 'next/server';
import { Google, generateState, generateCodeVerifier } from 'arctic';

export const dynamic = 'force-dynamic';

export async function GET() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://riverslounge.ro';
    return NextResponse.redirect(`${base}/cont/autentificare?error=oauth_not_configured`);
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
