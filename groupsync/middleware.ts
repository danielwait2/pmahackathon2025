import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for NextAuth session
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-nextauth-secret-change-me'
  });

  if (token) {
    return NextResponse.next();
  }

  // Check for guest cookie if accessing a project
  if (pathname.startsWith('/project/')) {
    const projectId = pathname.split('/')[2];
    const guestCookie = request.cookies.get(`guest_member_${projectId}`);

    if (guestCookie?.value) {
      // Guest has valid cookie, allow access
      return NextResponse.next();
    }
  }

  // No valid auth, redirect to login
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('callbackUrl', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/dashboard/:path*', '/project/:path*'],
};
