import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

export default function PlatformAnalytics() {
  const supabase = getSupabaseBrowserClient();
  const [stats, setStats] = useState(null);
  const [trainerRows, setTrainerRows] = useState([]);

  useEffect(() => {
    (async () => {
      const [
        { count: clientCount },
        { count: trainerCount },
        { count: workoutCount },
        { count: exerciseLogCount },
        { count: progressLogCount },
        { data: trainers },
        { data: assignments },
        { data: allWorkoutSchedules },
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'client'),
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'trainer'),
        supabase.from('workouts').select('*', { count: 'exact', head: true }),
        supabase.from('exercise_logs').select('*', { count: 'exact', head: true }),
        supabase.from('progress_logs').select('*', { count: 'exact', head: true }),
        supabase.from('profiles').select('id, full_name').eq('role', 'trainer'),
        supabase.from('trainer_clients').select('trainer_id, client_id'),
        supabase.from('client_workouts').select('client_id, completed'),
      ]);

      setStats({ clientCount, trainerCount, workoutCount, exerciseLogCount, progressLogCount });

      const rows = (trainers || []).map((t) => {
        const myClients = (assignments || []).filter((a) => a.trainer_id === t.id).map((a) => a.client_id);
        const mySchedules = (allWorkoutSchedules || []).filter((s) => myClients.includes(s.client_id));
        const done = mySchedules.filter((s) => s.completed).length;
        return {
          name: t.full_name,
          clientCount: myClients.length,
          rate: mySchedules.length ? Math.round((done / mySchedules.length) * 100) : 0,
        };
      }).sort((a, b) => b.clientCount - a.clientCount);
      setTrainerRows(rows);
    })();
  }, []);

  return (
    <AdminLayout active="platform">
      {stats ? (
        <>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div><span>Total Clients</span><b>{stats.clientCount}</b></div>
            <div><span>Total Trainers</span><b>{stats.trainerCount}</b></div>
            <div><span>Workouts Created</span><b>{stats.workoutCount}</b></div>
            <div><span>Sets Logged</span><b>{stats.exerciseLogCount}</b></div>
          </div>
          <div className="metric-grid" style={{ marginBottom: 20 }}>
            <div><span>Progress Entries Logged</span><b>{stats.progressLogCount}</b></div>
            <div><span>Avg Clients / Trainer</span><b>{stats.trainerCount ? (stats.clientCount / stats.trainerCount).toFixed(1) : '—'}</b></div>
          </div>

          <div className="widget">
            <h3>Trainer Leaderboard</h3>
            {trainerRows.length ? trainerRows.map((t, i) => (
              <div key={i} style={{ marginBottom: 18 }}>
                <div className="row" style={{ border: 'none', padding: '0 0 6px' }}>
                  <b>{t.name}</b>
                  <span className="muted" style={{ fontSize: 12 }}>{t.clientCount} client{t.clientCount === 1 ? '' : 's'} · {t.rate}% completion</span>
                </div>
                <div style={{ height: 8, background: 'var(--panel)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${t.rate}%`, background: 'var(--accent)', borderRadius: 99 }} />
                </div>
              </div>
            )) : <p className="muted">No trainers on the platform yet.</p>}
          </div>
        </>
      ) : <p className="muted">Loading…</p>}
    </AdminLayout>
  );
}
