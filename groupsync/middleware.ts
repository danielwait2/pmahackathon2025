import { withAuth } from 'next-auth/middleware';

export default withAuth({
  pages: { signIn: '/login' },
  secret: process.env.NEXTAUTH_SECRET || process.env.AUTH_SECRET || 'dev-nextauth-secret-change-me',
});

export const config = {
  matcher: ['/dashboard/:path*', '/project/:path*'],
};
