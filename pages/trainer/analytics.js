import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function TrainerAnalytics() {
  const supabase = getSupabaseBrowserClient();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: myClients } = await supabase.from('trainer_clients').select('client_id, profiles!trainer_clients_client_id_fkey(full_name)').eq('trainer_id', session.user.id);
      const clientIds = (myClients || []).map((c) => c.client_id);
      if (!clientIds.length) { setStats({ perClient: [], overallRate: 0 }); return; }

      const { data: scheduled } = await supabase.from('client_workouts').select('client_id, completed').in('client_id', clientIds);

      const perClient = (myClients || []).map((c) => {
        const rows = (scheduled || []).filter((s) => s.client_id === c.client_id);
        const done = rows.filter((r) => r.completed).length;
        const rate = rows.length ? Math.round((done / rows.length) * 100) : 0;
        return { name: c.profiles?.full_name, done, total: rows.length, rate };
      });

      const totalDone = (scheduled || []).filter((s) => s.completed).length;
      const overallRate = scheduled?.length ? Math.round((totalDone / scheduled.length) * 100) : 0;

      setStats({ perClient, overallRate });
    })();
  }, []);

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>COMMAND CENTER</p>
        <Link href="/trainer">Dashboard</Link>
        <Link href="/trainer/clients">Clients</Link>
        <Link href="/trainer/workout-builder">Workout Builder</Link>
        <Link href="/trainer/exercises">Exercise Library</Link>
        <Link href="/trainer/meal-plans">Meal Plans</Link>
        <Link href="/trainer/programs">Programs</Link>
        <button className="on">Progress Analytics</button>
        <Link href="/trainer/messages">Messages</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">TRAINER</p><h1>Progress Analytics</h1></div></div>

        {stats ? (
          <>
            <div className="metric-grid" style={{ marginBottom: 20 }}>
              <div><span>Overall Completion Rate</span><b>{stats.overallRate}%</b></div>
              <div><span>Active Clients</span><b>{stats.perClient.length}</b></div>
            </div>
            <div className="widget">
              <h3>Workout Consistency by Client</h3>
              {stats.perClient.length ? stats.perClient.map((c, i) => (
                <div key={i} style={{ marginBottom: 18 }}>
                  <div className="row" style={{ border: 'none', padding: '0 0 6px' }}>
                    <b>{c.name}</b><span className="muted" style={{ fontSize: 12 }}>{c.done}/{c.total} sessions</span>
                  </div>
                  <div style={{ height: 8, background: '#1a1a1a', borderRadius: 99, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${c.rate}%`, background: 'var(--accent)', borderRadius: 99, transition: 'width .6s ease' }} />
                  </div>
                </div>
              )) : <p className="muted">No workout history yet.</p>}
            </div>
          </>
        ) : <p className="muted">Loading…</p>}
      </section>
    </main>
  );
}
