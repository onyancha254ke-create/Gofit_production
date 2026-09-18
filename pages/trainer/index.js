import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function TrainerDashboard() {
  const supabase = getSupabaseBrowserClient();
  const [clients, setClients] = useState([]);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const trainerId = session.user.id;

      const { data: assignments } = await supabase
        .from('trainer_clients')
        .select('client_id, profiles!trainer_clients_client_id_fkey(full_name, email)')
        .eq('trainer_id', trainerId);
      setClients(assignments || []);

      const [{ count: workoutCount }, { count: pendingBookings }, { count: unreadMsgs }] = await Promise.all([
        supabase.from('workouts').select('*', { count: 'exact', head: true }).eq('trainer_id', trainerId),
        supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'Pending'),
        supabase.from('messages').select('*', { count: 'exact', head: true }).eq('recipient_id', trainerId).eq('read', false),
      ]);
      setMetrics({ clients: (assignments || []).length, workouts: workoutCount, pendingBookings, unreadMsgs });
    })();
  }, []);

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>COMMAND CENTER</p>
        <button className="on">Dashboard</button>
        <Link href="/trainer/clients">Clients</Link>
        <Link href="/trainer/workout-builder">Workout Builder</Link>
        <Link href="/trainer/exercises">Exercise Library</Link>
        <Link href="/trainer/meal-plans">Meal Plans</Link>
        <Link href="/admin/bookings">Calendar</Link>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <Link href="/trainer/messages">Messages</Link>
        <Link href="/admin/orders">Payments</Link>
        <Link href="/admin/products">Store</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head">
          <div><p className="eyebrow">TRAINER</p><h1>Command Center</h1></div>
        </div>

        {metrics && (
          <div className="metric-grid">
            <div><span>Active Clients</span><b>{metrics.clients}</b></div>
            <div><span>Workouts Built</span><b>{metrics.workouts}</b></div>
            <div><span>Pending Bookings</span><b>{metrics.pendingBookings}</b></div>
            <div><span>Unread Messages</span><b>{metrics.unreadMsgs}</b></div>
          </div>
        )}

        <div className="widget" style={{ marginTop: 20 }}>
          <h3>Your Clients</h3>
          {clients.length ? clients.map((c) => (
            <div className="row" key={c.client_id}>
              <div>
                <b>{c.profiles?.full_name || 'Client'}</b>
                <small>{c.profiles?.email}</small>
              </div>
              <Link href={`/trainer/clients/${c.client_id}`} className="mini">View</Link>
            </div>
          )) : <p className="muted">No clients assigned yet. Assign a client from the admin customer list to get started.</p>}
        </div>
      </section>
    </main>
  );
}
