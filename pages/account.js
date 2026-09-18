import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const money = (n) => '$' + Number(n).toFixed(2);

export default function Account() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return router.push('/login?next=/account');

      const [profileRes, ordersRes, bookingsRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', session.user.id).single(),
        supabase.from('orders').select('*, order_items(quantity, unit_price, products(name))').eq('customer_id', session.user.id).order('created_at', { ascending: false }),
        supabase.from('bookings').select('*, availability(slot_date, slot_time)').eq('customer_id', session.user.id).order('created_at', { ascending: false }),
      ]);
      setProfile(profileRes.data);
      setOrders(ordersRes.data || []);
      setBookings(bookingsRes.data || []);
    })();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
  }

  if (!profile) return <main className="page"><p className="muted">Loading…</p></main>;

  return (
    <>
      <Nav />
      <main className="page">
        <div className="account-top">
          <div>
            <p className="eyebrow">CUSTOMER PORTAL</p>
            <h1>Welcome, {profile.full_name?.split(' ')[0] || 'there'}.</h1>
            <p className="muted">{profile.email}</p>
          </div>
          <button className="btn outline" onClick={signOut}>Sign out</button>
        </div>

        <div className="account-grid">
          <section className="panel">
            <h2>Your Bookings</h2>
            {bookings.length ? bookings.map((b) => (
              <div className="row" key={b.id}>
                <div><b>{b.program_id}</b><small>{b.availability?.slot_date} · {b.availability?.slot_time}</small></div>
                <span className="status">{b.status}</span>
              </div>
            )) : <p className="muted">No bookings yet. <a href="/booking">Book a session →</a></p>}
          </section>

          <section className="panel">
            <h2>Your Orders</h2>
            {orders.length ? orders.map((o) => (
              <div className="row" key={o.id}>
                <div>
                  <b>{o.order_items?.map((it) => it.products?.name).join(', ') || 'Order'}</b>
                  <small>{new Date(o.created_at).toLocaleDateString()}</small>
                </div>
                <div><span className="status">{o.status}</span> <b style={{ marginLeft: 8 }}>{money(o.total)}</b></div>
              </div>
            )) : <p className="muted">No orders yet. <a href="/shop">Shop now →</a></p>}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
