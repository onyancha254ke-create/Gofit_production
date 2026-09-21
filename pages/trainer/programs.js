import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function TrainerPrograms() {
  const supabase = getSupabaseBrowserClient();
  const [programs, setPrograms] = useState([]);
  const [form, setForm] = useState({ title: '', price: '', unit: '', description: '', image_url: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from('programs').select('*').order('created_at', { ascending: false });
    setPrograms(data || []);
  }
  useEffect(() => { load(); }, []);

  async function addProgram(e) {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();

    let image_url = null;
    if (file) {
      const path = `programs/${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file);
      if (upErr) { setSaving(false); return alert(upErr.message); }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      image_url = data.publicUrl;
    }

    const { error } = await supabase.from('programs').insert({
      title: form.title,
      price: Number(form.price),
      unit: form.unit,
      description: form.description,
      image_url,
      created_by: session.user.id,
    });
    setSaving(false);
    if (error) return alert(error.message);
    setForm({ title: '', price: '', unit: '', description: '', image_url: '' });
    setFile(null);
    load();
  }

  async function toggleActive(id, active) {
    await supabase.from('programs').update({ active: !active }).eq('id', id);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this program?')) return;
    await supabase.from('programs').delete().eq('id', id);
    load();
  }

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>COMMAND CENTER</p>
        <Link href="/trainer">Dashboard</Link>
        <Link href="/trainer/clients">Clients</Link>
        <Link href="/trainer/workout-builder">Workout Builder</Link>
        <Link href="/trainer/exercises">Exercise Library</Link>
        <Link href="/trainer/meal-plans">Meal Plans</Link>
        <button className="on">Programs</button>
        <Link href="/trainer/testimonials">Testimonials</Link>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <Link href="/trainer/messages">Messages</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">TRAINING</p><h1>Programs</h1></div></div>

        <div className="widget" style={{ marginBottom: 20 }}>
          <h3>Add a Program</h3>
          <form className="form-grid" onSubmit={addProgram}>
            <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <label>Price (USD)<input type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required /></label>
            <label>Unit (e.g. "/ session", "/ month", or leave blank)<input value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} /></label>
            <label>Photo (optional)<input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} /></label>
            <label style={{ gridColumn: '1 / -1' }}>Description<textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></label>
            <button className="btn blue" disabled={saving} style={{ gridColumn: '1 / -1' }}>{saving ? 'Saving…' : '＋ Add program'}</button>
          </form>
        </div>

        <div className="widget">
          <h3>All Programs</h3>
          {programs.length ? programs.map((p) => (
            <div className="row" key={p.id}>
              <div>
                <b>{p.title}</b>
                <small>${p.price} {p.unit} {!p.active && '· Inactive'}</small>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="mini" onClick={() => toggleActive(p.id, p.active)}>{p.active ? 'Deactivate' : 'Activate'}</button>
                <button className="mini danger" onClick={() => remove(p.id)}>Delete</button>
              </div>
            </div>
          )) : <p className="muted">No programs yet — add one above.</p>}
        </div>
      </section>
    </main>
  );
}
