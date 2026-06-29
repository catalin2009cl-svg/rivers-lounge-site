import { NextRequest, NextResponse } from 'next/server';
import { Google, decodeIdToken } from 'arctic';
import { findOrCreateOAuthUser } from '@/lib/auth/oauth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://riverslounge.ro';
  const failUrl = `${siteUrl}/cont/autentificare?error=oauth_failed`;

  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const storedState = req.cookies.get('google_oauth_state')?.value;
    const codeVerifier = req.cookies.get('google_oauth_code_verifier')?.value;

    if (!code || !state || !storedState || !codeVerifier || state !== storedState) {
      return NextResponse.redirect(failUrl);
    }

    const clientId = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const google = new Google(clientId, clientSecret, `${siteUrl}/api/auth/google/callback`);

    const tokens = await google.validateAuthorizationCode(code, codeVerifier);
    const idToken = tokens.idToken();
    const claims = decodeIdToken(idToken) as {
      sub: string;
      name: string;
      email?: string;
      picture?: string;
    };

    if (!claims.email) {
      return NextResponse.redirect(`${siteUrl}/cont/autentificare?error=no_email`);
    }

    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: claims.sub,
      email: claims.email,
      name: claims.name,
      avatarUrl: claims.picture,
    });

    const response = NextResponse.redirect(`${siteUrl}/cont`);
    response.cookies.set('user_email', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    response.cookies.delete('google_oauth_state');
    response.cookies.delete('google_oauth_code_verifier');
    return response;
  } catch (err) {
    console.error('[OAuth] Google callback error:', err);
    return NextResponse.redirect(failUrl);
  }
}
