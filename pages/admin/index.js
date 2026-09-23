import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

export default function AdminOverview() {
  const supabase = getSupabaseBrowserClient();
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    (async () => {
      const [{ count: orders }, { data: paid }, { count: bookings }, { count: pending }] = await Promise.all([
        supabase.from('orders').select('*', { count: 'exact', head: true }),
        supabase.from('orders').select('total').eq('status', 'Paid'),
        supabase.from('bookings').select('*', { count: 'exact', head: true }),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
      ]);
      const revenue = (paid || []).reduce((s, o) => s + Number(o.total), 0);
      setMetrics({ orders, revenue, bookings, pending });
    })();
  }, []);

  return (
    <AdminLayout active="overview">
      {metrics ? (
        <div className="metric-grid">
          <div><span>Revenue (paid)</span><b>${metrics.revenue.toFixed(2)}</b></div>
          <div><span>Orders</span><b>{metrics.orders}</b></div>
          <div><span>Bookings</span><b>{metrics.bookings}</b><small>{metrics.pending} pending</small></div>
          <div><span>Status</span><b style={{ fontSize: 16, color: 'var(--success-ink)' }}>LIVE</b></div>
        </div>
      ) : <p className="muted">Loading…</p>}
    </AdminLayout>
  );
}
