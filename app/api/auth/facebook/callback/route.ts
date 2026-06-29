import { NextRequest, NextResponse } from 'next/server';
import { Facebook } from 'arctic';
import { findOrCreateOAuthUser } from '@/lib/auth/oauth';

export const dynamic = 'force-dynamic';

interface FbMeResponse {
  id: string;
  name: string;
  email?: string;
  picture?: { data?: { url?: string } };
}

export async function GET(req: NextRequest) {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://riverslounge.ro';
  const failUrl = `${siteUrl}/cont/autentificare?error=oauth_failed`;

  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const storedState = req.cookies.get('facebook_oauth_state')?.value;

    if (!code || !state || !storedState || state !== storedState) {
      return NextResponse.redirect(failUrl);
    }

    const clientId = process.env.FACEBOOK_CLIENT_ID!;
    const clientSecret = process.env.FACEBOOK_CLIENT_SECRET!;
    const facebook = new Facebook(clientId, clientSecret, `${siteUrl}/api/auth/facebook/callback`);

    const tokens = await facebook.validateAuthorizationCode(code);
    const accessToken = tokens.accessToken();

    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${accessToken}`
    );
    const me = (await meRes.json()) as FbMeResponse;

    if (!me.email) {
      return NextResponse.redirect(`${siteUrl}/cont/autentificare?error=no_email`);
    }

    const user = await findOrCreateOAuthUser({
      provider: 'facebook',
      providerId: me.id,
      email: me.email,
      name: me.name,
      avatarUrl: me.picture?.data?.url,
    });

    const response = NextResponse.redirect(`${siteUrl}/cont`);
    response.cookies.set('user_email', user.email, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });
    response.cookies.delete('facebook_oauth_state');
    return response;
  } catch (err) {
    console.error('[OAuth] Facebook callback error:', err);
    return NextResponse.redirect(failUrl);
  }
}
