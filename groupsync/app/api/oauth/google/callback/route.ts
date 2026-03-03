import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { cookies } from 'next/headers';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(new URL(`/settings/availability?google=error`, request.url));
  }

  const cookieStore = await cookies();
  const expectedState = cookieStore.get('google_oauth_state')?.value;
  if (!state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(new URL(`/settings/availability?google=invalid_state`, request.url));
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  if (!clientId || !clientSecret || !redirectUri || !code) {
    return NextResponse.redirect(new URL(`/settings/availability?google=missing_config`, request.url));
  }

  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    return NextResponse.redirect(new URL(`/settings/availability?google=token_error`, request.url));
  }

  const tokenData = await tokenResponse.json();
  const accessToken = tokenData.access_token as string | undefined;
  const refreshToken = tokenData.refresh_token as string | undefined;
  const expiresIn = tokenData.expires_in as number | undefined;
  if (!accessToken || !expiresIn) {
    return NextResponse.redirect(new URL(`/settings/availability?google=token_error`, request.url));
  }

  const expiryDate = new Date(Date.now() + expiresIn * 1000);
  await prisma.userCalendarToken.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      accessToken,
      refreshToken: refreshToken ?? null,
      expiryDate,
    },
    update: {
      accessToken,
      ...(refreshToken ? { refreshToken } : {}),
      expiryDate,
    },
  });

  const response = NextResponse.redirect(new URL('/settings/availability?google=connected', request.url));
  response.cookies.delete('google_oauth_state');
  return response;
}
