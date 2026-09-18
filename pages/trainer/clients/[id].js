import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getSupabaseBrowserClient } from '../../../lib/supabaseClient';

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function changeOverWindow(logs, days) {
  const cutoff = daysAgo(days);
  const inWindow = logs.filter((l) => new Date(l.log_date) >= cutoff);
  if (inWindow.length < 2) return null;
  const sorted = [...inWindow].sort((a, b) => new Date(a.log_date) - new Date(b.log_date));
  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  return (last.weight_kg - first.weight_kg).toFixed(1);
}

export default function ClientDetail() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { id } = router.query;
  const [client, setClient] = useState(null);
  const [progress, setProgress] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [workoutStats, setWorkoutStats] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const [exerciseOptions, setExerciseOptions] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [strengthLogs, setStrengthLogs] = useState([]);

  async function load() {
    if (!id) return;
    const [profileRes, progressRes, photoRes, workoutsRes, exLogsRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('progress_logs').select('*').eq('client_id', id).order('log_date'),
      supabase.from('transformation_photos').select('*').eq('client_id', id).order('taken_date', { ascending: false }).limit(9),
      supabase.from('client_workouts').select('scheduled_date, completed').eq('client_id', id),
      supabase.from('exercise_logs').select('*, exercises(id, name)').eq('client_id', id).order('log_date'),
    ]);
    setClient(profileRes.data);
    setProgress(progressRes.data || []);

    const withUrls = await Promise.all((photoRes.data || []).map(async (p) => {
      const { data } = await supabase.storage.from('transformation-photos').createSignedUrl(p.photo_url, 3600);
      return { ...p, signedUrl: data?.signedUrl };
    }));
    setPhotos(withUrls);

    const rows = workoutsRes.data || [];
    const done = rows.filter((r) => r.completed).length;
    setWorkoutStats({ done, total: rows.length, rate: rows.length ? Math.round((done / rows.length) * 100) : 0 });

    const exLogs = exLogsRes.data || [];
    const uniqueExercises = [...new Map(exLogs.map((l) => [l.exercise_id, l.exercises])).values()];
    setExerciseOptions(uniqueExercises);
    if (uniqueExercises.length && !selectedExercise) setSelectedExercise(uniqueExercises[0].id);
    setStrengthLogs(exLogs);
  }
  useEffect(() => { load(); }, [id]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('messages').insert({ sender_id: session.user.id, recipient_id: id, body: message });
    setSending(false);
    if (error) return alert(error.message);
    setMessage('');
    alert('Message sent.');
  }

  if (!client) return <main className="page"><p className="muted">Loading…</p></main>;

  const chartData = progress.map((l) => ({ date: new Date(l.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), weight: l.weight_kg }));
  const change30 = changeOverWindow(progress, 30);
  const change60 = changeOverWindow(progress, 60);
  const change90 = changeOverWindow(progress, 90);

  const strengthData = strengthLogs
    .filter((l) => l.exercise_id === selectedExercise)
    .map((l) => ({ date: new Date(l.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), weight: l.weight_kg }));

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>COMMAND CENTER</p>
        <Link href="/trainer">Dashboard</Link>
        <Link href="/trainer/clients">Clients</Link>
        <Link href="/trainer/workout-builder">Workout Builder</Link>
        <Link href="/trainer/exercises">Exercise Library</Link>
        <Link href="/trainer/meal-plans">Meal Plans</Link>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <Link href="/trainer/messages">Messages</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">CLIENT</p><h1>{client.full_name}</h1></div></div>

        <div className="metric-grid" style={{ marginBottom: 20 }}>
          <div><span>30-Day Change</span><b>{change30 !== null ? `${change30 > 0 ? '+' : ''}${change30} kg` : '—'}</b></div>
          <div><span>60-Day Change</span><b>{change60 !== null ? `${change60 > 0 ? '+' : ''}${change60} kg` : '—'}</b></div>
          <div><span>90-Day Change</span><b>{change90 !== null ? `${change90 > 0 ? '+' : ''}${change90} kg` : '—'}</b></div>
          <div><span>Workout Rate</span><b>{workoutStats ? `${workoutStats.rate}%` : '—'}</b><small>{workoutStats ? `${workoutStats.done}/${workoutStats.total}` : ''}</small></div>
        </div>

        <div className="dash-grid">
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="widget">
              <h3>Weight Over Time</h3>
              {progress.length >= 2 ? (
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                      <XAxis dataKey="date" stroke="#666" fontSize={11} />
                      <YAxis stroke="#666" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #232323' }} />
                      <Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="muted">Not enough logged weigh-ins yet for a graph.</p>}
            </div>

            <div className="widget">
              <h3>Strength Progression</h3>
              {exerciseOptions.length ? (
                <>
                  <select value={selectedExercise} onChange={(e) => setSelectedExercise(e.target.value)} style={{ marginBottom: 14, padding: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: '#fff', width: '100%' }}>
                    {exerciseOptions.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                  {strengthData.length >= 2 ? (
                    <div style={{ width: '100%', height: 220 }}>
                      <ResponsiveContainer>
                        <LineChart data={strengthData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                          <XAxis dataKey="date" stroke="#666" fontSize={11} />
                          <YAxis stroke="#666" fontSize={11} domain={['dataMin - 5', 'dataMax + 5']} />
                          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #232323' }} />
                          <Line type="monotone" dataKey="weight" stroke="#34d399" strokeWidth={2} dot={{ r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  ) : <p className="muted">Needs at least 2 logged sessions of this exercise for a graph.</p>}
                </>
              ) : <p className="muted">This client hasn't logged any exercise performance yet.</p>}
            </div>

            <div className="widget">
              <h3>Transformation Photos</h3>
              {photos.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {photos.map((p) => (
                    p.signedUrl && <img key={p.id} src={p.signedUrl} alt={p.label || 'progress photo'} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />
                  ))}
                </div>
              ) : <p className="muted">No photos uploaded yet.</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div className="widget">
              <h3>Client Info</h3>
              <p className="muted" style={{ fontSize: 13 }}>{client.email}</p>
            </div>
            <div className="widget">
              <h3>Send a Message</h3>
              <form className="form" onSubmit={sendMessage}>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a note to your client…" />
                <button className="btn blue" disabled={sending}>{sending ? 'Sending…' : 'Send'}</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
