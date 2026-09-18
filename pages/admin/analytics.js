import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

const money = (n) => '$' + Number(n).toFixed(2);

export default function AdminAnalytics() {
  const supabase = getSupabaseBrowserClient();
  const [orders, setOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: orderRows } = await supabase
        .from('orders')
        .select('*, order_items(quantity, unit_price, products(name))')
        .order('created_at');
      setOrders(orderRows || []);

      // Aggregate revenue per product across all paid/fulfilled orders.
      const productTotals = {};
      (orderRows || []).forEach((o) => {
        if (o.status === 'Pending' || o.status === 'Cancelled') return;
        (o.order_items || []).forEach((it) => {
          const name = it.products?.name || 'Unknown';
          productTotals[name] = (productTotals[name] || 0) + it.unit_price * it.quantity;
        });
      });
      const sorted = Object.entries(productTotals).sort((a, b) => b[1] - a[1]).slice(0, 5);
      setTopProducts(sorted);
    })();
  }, []);

  const paidOrders = orders.filter((o) => o.status !== 'Pending' && o.status !== 'Cancelled');
  const totalRevenue = paidOrders.reduce((sum, o) => sum + Number(o.total), 0);
  const avgOrderValue = paidOrders.length ? totalRevenue / paidOrders.length : 0;

  // Group revenue by day for the chart.
  const byDay = {};
  paidOrders.forEach((o) => {
    const day = new Date(o.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    byDay[day] = (byDay[day] || 0) + Number(o.total);
  });
  const chartData = Object.entries(byDay).map(([date, revenue]) => ({ date, revenue }));

  const statusCounts = orders.reduce((acc, o) => { acc[o.status] = (acc[o.status] || 0) + 1; return acc; }, {});

  return (
    <AdminLayout active="analytics">
      <div className="metric-grid" style={{ marginBottom: 20 }}>
        <div><span>Total Revenue</span><b>{money(totalRevenue)}</b></div>
        <div><span>Paid Orders</span><b>{paidOrders.length}</b></div>
        <div><span>Avg Order Value</span><b>{money(avgOrderValue)}</b></div>
        <div><span>Total Orders</span><b>{orders.length}</b></div>
      </div>

      <div className="widget" style={{ marginBottom: 20 }}>
        <h3>Revenue Over Time</h3>
        {chartData.length >= 2 ? (
          <div style={{ width: '100%', height: 260 }}>
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                <XAxis dataKey="date" stroke="#666" fontSize={11} />
                <YAxis stroke="#666" fontSize={11} tickFormatter={(v) => `$${v}`} />
                <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #232323' }} formatter={(v) => money(v)} />
                <Line type="monotone" dataKey="revenue" stroke="var(--accent)" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : <p className="muted">Not enough paid orders yet to chart revenue over time.</p>}
      </div>

      <div className="dash-grid">
        <div className="widget">
          <h3>Top Products by Revenue</h3>
          {topProducts.length ? topProducts.map(([name, total]) => (
            <div className="row" key={name}>
              <b>{name}</b><b style={{ color: 'var(--accent)' }}>{money(total)}</b>
            </div>
          )) : <p className="muted">No paid orders yet.</p>}
        </div>
        <div className="widget">
          <h3>Orders by Status</h3>
          {Object.keys(statusCounts).length ? Object.entries(statusCounts).map(([status, count]) => (
            <div className="row" key={status}>
              <span>{status}</span><b>{count}</b>
            </div>
          )) : <p className="muted">No orders yet.</p>}
        </div>
      </div>
    </AdminLayout>
  );
}
