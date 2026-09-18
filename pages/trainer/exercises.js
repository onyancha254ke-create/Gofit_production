import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function ExerciseLibrary() {
  const supabase = getSupabaseBrowserClient();
  const [exercises, setExercises] = useState([]);
  const [form, setForm] = useState({ name: '', muscle_group: '', equipment: '', video_url: '', instructions: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from('exercises').select('*').order('name');
    setExercises(data || []);
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('exercises').insert({ ...form, created_by: session.user.id });
    setSaving(false);
    if (error) return alert(error.message);
    setForm({ name: '', muscle_group: '', equipment: '', video_url: '', instructions: '' });
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this exercise?')) return;
    await supabase.from('exercises').delete().eq('id', id);
    load();
  }

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>COMMAND CENTER</p>
        <Link href="/trainer">Dashboard</Link>
        <Link href="/trainer/clients">Clients</Link>
        <Link href="/trainer/workout-builder">Workout Builder</Link>
        <button className="on">Exercise Library</button>
        <Link href="/trainer/meal-plans">Meal Plans</Link>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <Link href="/trainer/messages">Messages</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">TRAINER</p><h1>Exercise Library</h1></div></div>

        <div className="widget" style={{ marginBottom: 20 }}>
          <h3>Add Exercise</h3>
          <form className="form-grid" onSubmit={add}>
            <label>Name<input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></label>
            <label>Muscle Group<input value={form.muscle_group} onChange={(e) => setForm({ ...form, muscle_group: e.target.value })} placeholder="e.g. Chest, Legs, Back" /></label>
            <label>Equipment<input value={form.equipment} onChange={(e) => setForm({ ...form, equipment: e.target.value })} placeholder="e.g. Barbell, Bodyweight" /></label>
            <label>Video URL<input value={form.video_url} onChange={(e) => setForm({ ...form, video_url: e.target.value })} placeholder="YouTube link, optional" /></label>
            <label style={{ gridColumn: '1 / -1' }}>Instructions<textarea value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} /></label>
            <button className="btn blue" disabled={saving} style={{ gridColumn: '1 / -1' }}>{saving ? 'Saving…' : '＋ Add exercise'}</button>
          </form>
        </div>

        <div className="widget">
          <h3>All Exercises ({exercises.length})</h3>
          {exercises.map((ex) => (
            <div className="row" key={ex.id}>
              <div>
                <b>{ex.name}</b>
                <small>{ex.muscle_group} {ex.equipment ? `· ${ex.equipment}` : ''}</small>
              </div>
              <button className="mini danger" onClick={() => remove(ex.id)}>Delete</button>
            </div>
          ))}
          {!exercises.length && <p className="muted">No exercises yet — add your first one above.</p>}
        </div>
      </section>
    </main>
  );
}
