import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';

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

export default function Progress() {
  const supabase = getSupabaseBrowserClient();
  const [uid, setUid] = useState(null);
  const [logs, setLogs] = useState([]);
  const [photos, setPhotos] = useState([]); // [{...row, signedUrl}]
  const [exerciseLogs, setExerciseLogs] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState('');
  const [form, setForm] = useState({ weight_kg: '', waist_cm: '', chest_cm: '', hips_cm: '', arm_cm: '', notes: '' });
  const [file, setFile] = useState(null);
  const [label, setLabel] = useState('front');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUid(session.user.id);

    const [logRes, photoRes, exLogRes] = await Promise.all([
      supabase.from('progress_logs').select('*').eq('client_id', session.user.id).order('log_date'),
      supabase.from('transformation_photos').select('*').eq('client_id', session.user.id).order('taken_date', { ascending: false }),
      supabase.from('exercise_logs').select('*, exercises(name)').eq('client_id', session.user.id).order('log_date'),
    ]);
    setLogs(logRes.data || []);
    setExerciseLogs(exLogRes.data || []);

    // Photos are in a private bucket — generate a temporary signed URL for each one.
    const withUrls = await Promise.all((photoRes.data || []).map(async (p) => {
      const path = p.photo_url; // stores the storage path, not a public URL
      const { data } = await supabase.storage.from('transformation-photos').createSignedUrl(path, 3600);
      return { ...p, signedUrl: data?.signedUrl };
    }));
    setPhotos(withUrls);
  }
  useEffect(() => { load(); }, []);

  async function logEntry(e) {
    e.preventDefault();
    if (!form.weight_kg) return;
    setSaving(true);
    const today = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('progress_logs').upsert({
      client_id: uid,
      log_date: today,
      weight_kg: Number(form.weight_kg),
      waist_cm: form.waist_cm ? Number(form.waist_cm) : null,
      chest_cm: form.chest_cm ? Number(form.chest_cm) : null,
      hips_cm: form.hips_cm ? Number(form.hips_cm) : null,
      arm_cm: form.arm_cm ? Number(form.arm_cm) : null,
      notes: form.notes,
    }, { onConflict: 'client_id,log_date' });
    setSaving(false);
    if (error) return alert(error.message);
    setForm({ weight_kg: '', waist_cm: '', chest_cm: '', hips_cm: '', arm_cm: '', notes: '' });
    load();
  }

  async function uploadPhoto(e) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    const path = `${uid}/${Date.now()}-${file.name}`;
    const { error: upErr } = await supabase.storage.from('transformation-photos').upload(path, file);
    if (upErr) { setUploading(false); return alert(upErr.message); }
    const { error } = await supabase.from('transformation_photos').insert({ client_id: uid, photo_url: path, label });
    setUploading(false);
    if (error) return alert(error.message);
    setFile(null);
    load();
  }

  const chartData = logs.map((l) => ({ date: new Date(l.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), weight: l.weight_kg }));
  const change30 = changeOverWindow(logs, 30);
  const change60 = changeOverWindow(logs, 60);
  const change90 = changeOverWindow(logs, 90);

  const exerciseNames = [...new Map(exerciseLogs.map((l) => [l.exercise_id, l.exercises?.name])).entries()];
  const activeExercise = selectedExercise || exerciseNames[0]?.[0] || '';
  const strengthData = exerciseLogs
    .filter((l) => l.exercise_id === activeExercise)
    .map((l) => ({ date: new Date(l.log_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }), weight: l.weight_kg }));

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>MY GOFIT</p>
        <Link href="/dashboard">Dashboard</Link>
        <button className="on">Progress</button>
        <Link href="/booking">Book a Session</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/account">Account</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">TRANSFORMATION</p><h1>Your Progress</h1></div></div>

        <div className="metric-grid" style={{ marginBottom: 20 }}>
          <div><span>30-Day Change</span><b>{change30 !== null ? `${change30 > 0 ? '+' : ''}${change30} kg` : '—'}</b></div>
          <div><span>60-Day Change</span><b>{change60 !== null ? `${change60 > 0 ? '+' : ''}${change60} kg` : '—'}</b></div>
          <div><span>90-Day Change</span><b>{change90 !== null ? `${change90 > 0 ? '+' : ''}${change90} kg` : '—'}</b></div>
          <div><span>Total Logs</span><b>{logs.length}</b></div>
        </div>

        <div className="widget" style={{ marginBottom: 20 }}>
          <h3>Strength Progression</h3>
          {exerciseNames.length ? (
            <>
              <select value={activeExercise} onChange={(e) => setSelectedExercise(e.target.value)} style={{ marginBottom: 14, padding: 10, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: '#fff' }}>
                {exerciseNames.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
              </select>
              {strengthData.length >= 2 ? (
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer>
                    <LineChart data={strengthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                      <XAxis dataKey="date" stroke="#666" fontSize={11} />
                      <YAxis stroke="#666" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #232323' }} />
                      <Line type="monotone" dataKey="weight" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : <p className="muted">Log this exercise at least twice (via "Log Workout") to see progression.</p>}
            </>
          ) : <p className="muted">No exercises logged yet — complete a workout under "Log Workout" to start tracking strength.</p>}
        </div>

        <div className="widget" style={{ marginBottom: 20 }}>
          <h3>Weight Over Time</h3>
          {logs.length >= 2 ? (
            <div style={{ width: '100%', height: 260 }}>
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
          ) : <p className="muted">Log at least 2 weigh-ins to see your graph.</p>}
        </div>

        <div className="dash-grid">
          <div className="widget">
            <h3>Log Today's Weigh-In</h3>
            <form className="form-grid" onSubmit={logEntry}>
              <label>Weight (kg)<input type="number" step="0.1" value={form.weight_kg} onChange={(e) => setForm({ ...form, weight_kg: e.target.value })} required /></label>
              <label>Waist (cm)<input type="number" step="0.1" value={form.waist_cm} onChange={(e) => setForm({ ...form, waist_cm: e.target.value })} /></label>
              <label>Chest (cm)<input type="number" step="0.1" value={form.chest_cm} onChange={(e) => setForm({ ...form, chest_cm: e.target.value })} /></label>
              <label>Hips (cm)<input type="number" step="0.1" value={form.hips_cm} onChange={(e) => setForm({ ...form, hips_cm: e.target.value })} /></label>
              <label>Arm (cm)<input type="number" step="0.1" value={form.arm_cm} onChange={(e) => setForm({ ...form, arm_cm: e.target.value })} /></label>
              <label style={{ gridColumn: '1 / -1' }}>Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>
              <button className="btn blue" disabled={saving} style={{ gridColumn: '1 / -1' }}>{saving ? 'Saving…' : 'Log entry'}</button>
            </form>
            <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>Logging again today updates today's entry rather than creating a duplicate.</p>
          </div>

          <div className="widget">
            <h3>Upload a Transformation Photo</h3>
            <form className="form" onSubmit={uploadPhoto}>
              <label>Angle
                <select value={label} onChange={(e) => setLabel(e.target.value)}>
                  <option value="front">Front</option>
                  <option value="side">Side</option>
                  <option value="back">Back</option>
                </select>
              </label>
              <label>Photo<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /></label>
              <button className="btn blue" disabled={uploading || !file}>{uploading ? 'Uploading…' : 'Upload'}</button>
            </form>
            <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>Private — only visible to you and your trainer.</p>
          </div>
        </div>

        <div className="widget" style={{ marginTop: 20 }}>
          <h3>Your Photos</h3>
          {photos.length ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', gap: 10 }}>
              {photos.map((p) => (
                <div key={p.id}>
                  {p.signedUrl && <img src={p.signedUrl} alt={p.label} style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />}
                  <small className="muted" style={{ display: 'block', marginTop: 4, fontSize: 10 }}>{p.label} · {new Date(p.taken_date).toLocaleDateString()}</small>
                </div>
              ))}
            </div>
          ) : <p className="muted">No photos yet.</p>}
        </div>
      </section>
    </main>
  );
}
