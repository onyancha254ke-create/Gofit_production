import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function TrainerClients() {
  const supabase = getSupabaseBrowserClient();
  const [myClients, setMyClients] = useState([]);
  const [allClients, setAllClients] = useState([]);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const [mineRes, allRes] = await Promise.all([
      supabase.from('trainer_clients').select('client_id, profiles!trainer_clients_client_id_fkey(id, full_name, email)').eq('trainer_id', session.user.id),
      supabase.from('profiles').select('id, full_name, email').eq('role', 'client'),
    ]);
    setMyClients(mineRes.data || []);
    setAllClients(allRes.data || []);
  }
  useEffect(() => { load(); }, []);

  async function assignToMe(clientId) {
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('trainer_clients').insert({ trainer_id: session.user.id, client_id: clientId });
    if (error) return alert(error.message);
    load();
  }

  const myIds = new Set(myClients.map((c) => c.client_id));
  const unassignedFromMe = allClients.filter((c) => !myIds.has(c.id));

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>COMMAND CENTER</p>
        <Link href="/trainer">Dashboard</Link>
        <button className="on">Clients</button>
        <Link href="/trainer/workout-builder">Workout Builder</Link>
        <Link href="/trainer/exercises">Exercise Library</Link>
        <Link href="/trainer/meal-plans">Meal Plans</Link>
        <Link href="/trainer/programs">Programs</Link>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <Link href="/trainer/messages">Messages</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">TRAINER</p><h1>Clients</h1></div></div>

        <div className="widget" style={{ marginBottom: 20 }}>
          <h3>Your Clients ({myClients.length})</h3>
          {myClients.length ? myClients.map((c) => (
            <div className="row" key={c.client_id}>
              <div><b>{c.profiles?.full_name}</b><small>{c.profiles?.email}</small></div>
              <Link href={`/trainer/clients/${c.client_id}`} className="mini">View Progress →</Link>
            </div>
          )) : <p className="muted">No clients yet — assign one from the list below.</p>}
        </div>

        <div className="widget">
          <h3>All Other Clients</h3>
          {unassignedFromMe.length ? unassignedFromMe.map((c) => (
            <div className="row" key={c.id}>
              <div><b>{c.full_name}</b><small>{c.email}</small></div>
              <button className="mini" onClick={() => assignToMe(c.id)}>Assign to me</button>
            </div>
          )) : <p className="muted">No other clients right now.</p>}
        </div>
      </section>
    </main>
  );
}
