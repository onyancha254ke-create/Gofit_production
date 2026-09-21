import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function TrainerTestimonials() {
  const supabase = getSupabaseBrowserClient();
  const [testimonials, setTestimonials] = useState([]);
  const [form, setForm] = useState({ client_name: '', quote: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    setTestimonials(data || []);
  }
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('testimonials').insert({
      client_name: form.client_name, quote: form.quote, created_by: session.user.id, approved: true,
    });
    setSaving(false);
    if (error) return alert(error.message);
    setForm({ client_name: '', quote: '' });
    load();
  }

  async function toggleApproved(id, approved) {
    await supabase.from('testimonials').update({ approved: !approved }).eq('id', id);
    load();
  }

  async function remove(id) {
    if (!confirm('Delete this testimonial?')) return;
    await supabase.from('testimonials').delete().eq('id', id);
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
        <Link href="/trainer/programs">Programs</Link>
        <button className="on">Testimonials</button>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <Link href="/trainer/messages">Messages</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">HOME PAGE</p><h1>Testimonials</h1></div></div>

        <div className="widget" style={{ marginBottom: 20 }}>
          <h3>Add a Real Client Testimonial</h3>
          <p className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
            Only add quotes from real clients who agreed to be featured — this appears publicly on the home page.
          </p>
          <form className="form" onSubmit={add}>
            <label>Client name<input value={form.client_name} onChange={(e) => setForm({ ...form, client_name: e.target.value })} required /></label>
            <label>Quote<textarea value={form.quote} onChange={(e) => setForm({ ...form, quote: e.target.value })} required /></label>
            <button className="btn blue" disabled={saving}>{saving ? 'Saving…' : '＋ Add testimonial'}</button>
          </form>
        </div>

        <div className="widget">
          <h3>All Testimonials</h3>
          {testimonials.length ? testimonials.map((t) => (
            <div className="row" key={t.id}>
              <div>
                <b>{t.client_name}</b>
                <small>"{t.quote}" {!t.approved && '· Hidden'}</small>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="mini" onClick={() => toggleApproved(t.id, t.approved)}>{t.approved ? 'Hide' : 'Show'}</button>
                <button className="mini danger" onClick={() => remove(t.id)}>Delete</button>
              </div>
            </div>
          )) : <p className="muted">No testimonials yet — add one above.</p>}
        </div>
      </section>
    </main>
  );
}
