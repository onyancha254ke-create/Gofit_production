import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function WorkoutBuilder() {
  const supabase = getSupabaseBrowserClient();
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [clients, setClients] = useState([]);

  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [rows, setRows] = useState([{ exercise_id: '', sets: 3, reps: '10', rest_seconds: 60 }]);
  const [saving, setSaving] = useState(false);

  const [assignWorkout, setAssignWorkout] = useState('');
  const [assignClient, setAssignClient] = useState('');
  const [assignDate, setAssignDate] = useState(new Date().toISOString().slice(0, 10));

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const [exRes, woRes, clRes] = await Promise.all([
      supabase.from('exercises').select('id,name').order('name'),
      supabase.from('workouts').select('id,title').eq('trainer_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('trainer_clients').select('client_id, profiles!trainer_clients_client_id_fkey(full_name)').eq('trainer_id', session.user.id),
    ]);
    setExercises(exRes.data || []);
    setWorkouts(woRes.data || []);
    setClients(clRes.data || []);
  }
  useEffect(() => { load(); }, []);

  function updateRow(i, field, value) {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }
  function addRow() { setRows((r) => [...r, { exercise_id: '', sets: 3, reps: '10', rest_seconds: 60 }]); }
  function removeRow(i) { setRows((r) => r.filter((_, idx) => idx !== i)); }

  async function saveWorkout(e) {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data: workout, error } = await supabase
      .from('workouts')
      .insert({ trainer_id: session.user.id, title, notes })
      .select()
      .single();
    if (error) { setSaving(false); return alert(error.message); }

    const validRows = rows.filter((r) => r.exercise_id);
    await supabase.from('workout_exercises').insert(
      validRows.map((r, i) => ({
        workout_id: workout.id,
        exercise_id: r.exercise_id,
        sets: Number(r.sets),
        reps: r.reps,
        rest_seconds: Number(r.rest_seconds),
        order_index: i,
      }))
    );
    setSaving(false);
    setTitle(''); setNotes(''); setRows([{ exercise_id: '', sets: 3, reps: '10', rest_seconds: 60 }]);
    load();
  }

  async function assign(e) {
    e.preventDefault();
    if (!assignWorkout || !assignClient) return;
    const { error } = await supabase.from('client_workouts').insert({
      client_id: assignClient, workout_id: assignWorkout, scheduled_date: assignDate,
    });
    if (error) return alert(error.message);
    alert('Workout assigned.');
  }

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>COMMAND CENTER</p>
        <Link href="/trainer">Dashboard</Link>
        <Link href="/trainer/clients">Clients</Link>
        <button className="on">Workout Builder</button>
        <Link href="/trainer/exercises">Exercise Library</Link>
        <Link href="/trainer/meal-plans">Meal Plans</Link>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <Link href="/trainer/messages">Messages</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">TRAINER</p><h1>Workout Builder</h1></div></div>

        <div className="widget" style={{ marginBottom: 20 }}>
          <h3>Build a Workout</h3>
          <form className="form" onSubmit={saveWorkout}>
            <label>Title<input value={title} onChange={(e) => setTitle(e.target.value)} required /></label>
            <label>Notes<textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Warm-up instructions, focus for the day, etc." /></label>

            {rows.map((row, i) => (
              <div key={i} className="form-grid" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <label>Exercise
                  <select value={row.exercise_id} onChange={(e) => updateRow(i, 'exercise_id', e.target.value)}>
                    <option value="">Select…</option>
                    {exercises.map((ex) => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                  </select>
                </label>
                <label>Sets<input type="number" value={row.sets} onChange={(e) => updateRow(i, 'sets', e.target.value)} /></label>
                <label>Reps<input value={row.reps} onChange={(e) => updateRow(i, 'reps', e.target.value)} /></label>
                <label>Rest (sec)<input type="number" value={row.rest_seconds} onChange={(e) => updateRow(i, 'rest_seconds', e.target.value)} /></label>
                {rows.length > 1 && <button type="button" className="mini danger" onClick={() => removeRow(i)} style={{ gridColumn: '1 / -1', justifySelf: 'start' }}>Remove exercise</button>}
              </div>
            ))}
            <button type="button" className="btn outline" onClick={addRow}>＋ Add another exercise</button>
            <button className="btn blue" disabled={saving}>{saving ? 'Saving…' : 'Save workout'}</button>
          </form>
        </div>

        <div className="widget">
          <h3>Assign a Workout to a Client</h3>
          <form className="form-grid" onSubmit={assign}>
            <label>Workout
              <select value={assignWorkout} onChange={(e) => setAssignWorkout(e.target.value)} required>
                <option value="">Select…</option>
                {workouts.map((w) => <option key={w.id} value={w.id}>{w.title}</option>)}
              </select>
            </label>
            <label>Client
              <select value={assignClient} onChange={(e) => setAssignClient(e.target.value)} required>
                <option value="">Select…</option>
                {clients.map((c) => <option key={c.client_id} value={c.client_id}>{c.profiles?.full_name}</option>)}
              </select>
            </label>
            <label>Date<input type="date" value={assignDate} onChange={(e) => setAssignDate(e.target.value)} required /></label>
            <button className="btn blue" style={{ gridColumn: '1 / -1' }}>Assign</button>
          </form>
          {!clients.length && <p className="muted" style={{ marginTop: 12 }}>No clients assigned to you yet — go to <Link href="/trainer/clients" style={{ color: 'var(--accent)' }}>Clients</Link> first.</p>}
        </div>
      </section>
    </main>
  );
}
