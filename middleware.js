import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

// Runs on nearly every request. Two jobs:
// 1. Refresh the Supabase auth cookie on EVERY page/API call — this is
//    required by @supabase/auth-helpers-nextjs; without it, cookies go
//    stale on pages this middleware doesn't visit, and any API route that
//    reads the session server-side (checkout, M-Pesa STK push, etc.) then
//    wrongly sees the visitor as signed out even though the browser still
//    shows them logged in.
// 2. Enforce role-based access, but only for /admin, /trainer, /dashboard —
//    a visitor cannot bypass this by editing localStorage or forging a
//    client-side flag, since the check runs against the database using
//    their real session cookie.
export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession(); // refreshes the cookie as a side effect

  const path = req.nextUrl.pathname;
  const needsRoleCheck = path.startsWith('/admin') || path.startsWith('/trainer') || path.startsWith('/dashboard');
  if (!needsRoleCheck) return res;

  if (!session) {
    return NextResponse.redirect(new URL(`/login?next=${path}`, req.url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  const role = profile?.role;

  if (path.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }
  if (path.startsWith('/trainer') && role !== 'trainer' && role !== 'admin') {
    return NextResponse.redirect(new URL('/', req.url));
  }

  return res;
}

export const config = {
  // Runs on every request except static assets and image optimization files,
  // so the session cookie stays fresh everywhere, not just on protected pages.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
