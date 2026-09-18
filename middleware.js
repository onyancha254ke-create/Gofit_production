import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';

// Runs on the server before /admin, /trainer, or /dashboard pages render.
// A visitor cannot bypass this by editing localStorage or forging a
// client-side flag — the role check happens against the database using
// their real session cookie, on every request to these paths.
export async function middleware(req) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();
  const path = req.nextUrl.pathname;

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
  // /dashboard: any authenticated client, trainer, or admin may view their own dashboard.

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/trainer/:path*', '/dashboard/:path*'],
};
