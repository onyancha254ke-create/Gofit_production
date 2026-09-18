import Link from 'next/link';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { useRouter } from 'next/router';

const tabs = [
  { key: 'overview', label: 'Overview', href: '/admin' },
  { key: 'products', label: 'Products', href: '/admin/products' },
  { key: 'availability', label: 'Availability', href: '/admin/availability' },
  { key: 'bookings', label: 'Bookings', href: '/admin/bookings' },
  { key: 'orders', label: 'Orders', href: '/admin/orders' },
  { key: 'analytics', label: 'Revenue', href: '/admin/analytics' },
  { key: 'subscriptions', label: 'Subscriptions', href: '/admin/subscriptions' },
  { key: 'users', label: 'Manage Users', href: '/admin/users' },
  { key: 'platform', label: 'Platform Analytics', href: '/admin/platform' },
];

export default function AdminLayout({ active, children }) {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <main className="admin">
      <aside className="admin-side">
        <p className="eyebrow">COMMAND CENTER</p>
        {tabs.map((t) => (
          <Link key={t.key} href={t.href} className={active === t.key ? 'on' : ''}>{t.label}</Link>
        ))}
        <a href="/">← View website</a>
      </aside>
      <section className="admin-main">
        <div className="admin-head">
          <div><p className="eyebrow">GOFIT ADMIN</p><h1>Command Center</h1></div>
          <button className="btn blue" onClick={signOut}>Sign out</button>
        </div>
        {children}
      </section>
    </main>
  );
}
