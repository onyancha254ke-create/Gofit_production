import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function LogWorkout() {
  const supabase = getSupabaseBrowserClient();
  const [uid, setUid] = useState(null);
  const [pending, setPending] = useState([]);
  const [selected, setSelected] = useState(null); // client_workout row with nested exercises
  const [entries, setEntries] = useState({}); // { workout_exercise_id: { weight_kg, reps, sets } }
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  async function loadPending() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setUid(session.user.id);
    const { data } = await supabase
      .from('client_workouts')
      .select('*, workouts(id, title, notes)')
      .eq('client_id', session.user.id)
      .eq('completed', false)
      .order('scheduled_date');
    setPending(data || []);
  }
  useEffect(() => { loadPending(); }, []);

  async function openWorkout(cw) {
    const { data: exRows } = await supabase
      .from('workout_exercises')
      .select('*, exercises(id, name)')
      .eq('workout_id', cw.workout_id)
      .order('order_index');
    setSelected({ ...cw, exerciseRows: exRows || [] });
    const initial = {};
    (exRows || []).forEach((r) => { initial[r.id] = { weight_kg: '', reps: r.reps || '', sets: r.sets || 3 }; });
    setEntries(initial);
    setDone(false);
  }

  function updateEntry(rowId, field, value) {
    setEntries((prev) => ({ ...prev, [rowId]: { ...prev[rowId], [field]: value } }));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true);
    const rows = selected.exerciseRows
      .filter((r) => entries[r.id]?.weight_kg)
      .map((r) => ({
        client_id: uid,
        exercise_id: r.exercise_id,
        client_workout_id: selected.id,
        weight_kg: Number(entries[r.id].weight_kg),
        reps: Number(entries[r.id].reps) || null,
        sets: Number(entries[r.id].sets) || null,
      }));

    if (rows.length) {
      const { error } = await supabase.from('exercise_logs').insert(rows);
      if (error) { setSaving(false); return alert(error.message); }
    }

    const { error: compErr } = await supabase
      .from('client_workouts')
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq('id', selected.id);
    setSaving(false);
    if (compErr) return alert(compErr.message);

    setDone(true);
    setSelected(null);
    loadPending();
  }

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>MY GOFIT</p>
        <Link href="/dashboard">Dashboard</Link>
        <Link href="/progress">Progress</Link>
        <button className="on">Log Workout</button>
        <Link href="/booking">Book a Session</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/account">Account</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">WORKOUT</p><h1>Log Your Session</h1></div></div>

        {done && <p style={{ color: 'var(--success)', marginBottom: 16 }}>Workout logged — nice work.</p>}

        {!selected ? (
          <div className="widget">
            <h3>Pending Workouts</h3>
            {pending.length ? pending.map((cw) => (
              <div className="row" key={cw.id}>
                <div>
                  <b>{cw.workouts?.title}</b>
                  <small>{new Date(cw.scheduled_date).toLocaleDateString()}</small>
                </div>
                <button className="mini" onClick={() => openWorkout(cw)}>Log this workout</button>
              </div>
            )) : <p className="muted">No pending workouts. Ask your trainer to assign one, or check back later.</p>}
          </div>
        ) : (
          <div className="widget">
            <h3>{selected.workouts?.title}</h3>
            <p className="muted" style={{ marginBottom: 16 }}>{selected.workouts?.notes}</p>
            <form className="form" onSubmit={submit}>
              {selected.exerciseRows.map((r) => (
                <div key={r.id} className="form-grid" style={{ borderTop: '1px solid var(--line)', paddingTop: 14 }}>
                  <label style={{ gridColumn: '1 / -1' }}><b>{r.exercises?.name}</b> <span className="muted" style={{ fontWeight: 400 }}>(target: {r.sets}×{r.reps})</span></label>
                  <label>Weight (kg)<input type="number" step="0.5" value={entries[r.id]?.weight_kg || ''} onChange={(e) => updateEntry(r.id, 'weight_kg', e.target.value)} /></label>
                  <label>Reps<input type="number" value={entries[r.id]?.reps || ''} onChange={(e) => updateEntry(r.id, 'reps', e.target.value)} /></label>
                  <label>Sets<input type="number" value={entries[r.id]?.sets || ''} onChange={(e) => updateEntry(r.id, 'sets', e.target.value)} /></label>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 10 }}>
                <button className="btn blue" disabled={saving}>{saving ? 'Saving…' : 'Complete workout'}</button>
                <button type="button" className="btn outline" onClick={() => setSelected(null)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
      </section>
    </main>
  );
}
