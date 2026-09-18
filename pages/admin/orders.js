import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

const money = (n) => '$' + Number(n).toFixed(2);

export default function AdminOrders() {
  const supabase = getSupabaseBrowserClient();
  const [orders, setOrders] = useState([]);

  async function load() {
    const { data } = await supabase
      .from('orders')
      .select('*, profiles(full_name,email), order_items(quantity,unit_price,products(name))')
      .order('created_at', { ascending: false });
    setOrders(data || []);
  }

  useEffect(() => { load(); }, []);

  async function markFulfilled(id) {
    await supabase.from('orders').update({ status: 'Fulfilled' }).eq('id', id);
    load();
  }

  return (
    <AdminLayout active="orders">
      <div className="panel">
        <div className="panel-head"><h2>Orders</h2></div>
        {orders.length ? orders.map((o) => (
          <div className="row" key={o.id}>
            <div>
              <b>{o.profiles?.full_name || 'Customer'}</b>
              <small>
                {o.order_items?.map((it) => `${it.products?.name} × ${it.quantity}`).join(', ')}
                <br />{money(o.total)}
              </small>
            </div>
            <div>
              <span className="status">{o.status}</span>{' '}
              {o.status === 'Paid' && (
                <button className="mini" onClick={() => markFulfilled(o.id)}>Mark fulfilled</button>
              )}
            </div>
          </div>
        )) : <p className="muted">No orders yet.</p>}
      </div>
    </AdminLayout>
  );
}
