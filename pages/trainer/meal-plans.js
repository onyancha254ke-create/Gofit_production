import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function MealPlans() {
  const supabase = getSupabaseBrowserClient();
  const [plans, setPlans] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ title: '', daily_calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' });
  const [items, setItems] = useState([{ meal_label: 'Breakfast', description: '', calories: '' }]);
  const [saving, setSaving] = useState(false);

  const [assignPlan, setAssignPlan] = useState('');
  const [assignClient, setAssignClient] = useState('');

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const [planRes, clRes] = await Promise.all([
      supabase.from('meal_plans').select('id,title').eq('trainer_id', session.user.id).order('created_at', { ascending: false }),
      supabase.from('trainer_clients').select('client_id, profiles!trainer_clients_client_id_fkey(full_name)').eq('trainer_id', session.user.id),
    ]);
    setPlans(planRes.data || []);
    setClients(clRes.data || []);
  }
  useEffect(() => { load(); }, []);

  function updateItem(i, field, value) {
    setItems((r) => r.map((row, idx) => (idx === i ? { ...row, [field]: value } : row)));
  }
  function addItem() { setItems((r) => [...r, { meal_label: '', description: '', calories: '' }]); }
  function removeItem(i) { setItems((r) => r.filter((_, idx) => idx !== i)); }

  async function savePlan(e) {
    e.preventDefault();
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { data: plan, error } = await supabase.from('meal_plans').insert({
      trainer_id: session.user.id,
      title: form.title,
      daily_calories: form.daily_calories ? Number(form.daily_calories) : null,
      protein_g: form.protein_g ? Number(form.protein_g) : null,
      carbs_g: form.carbs_g ? Number(form.carbs_g) : null,
      fat_g: form.fat_g ? Number(form.fat_g) : null,
      notes: form.notes,
    }).select().single();
    if (error) { setSaving(false); return alert(error.message); }

    const validItems = items.filter((i) => i.description);
    await supabase.from('meal_plan_items').insert(
      validItems.map((it, i) => ({
        meal_plan_id: plan.id, meal_label: it.meal_label, description: it.description,
        calories: it.calories ? Number(it.calories) : null, order_index: i,
      }))
    );
    setSaving(false);
    setForm({ title: '', daily_calories: '', protein_g: '', carbs_g: '', fat_g: '', notes: '' });
    setItems([{ meal_label: 'Breakfast', description: '', calories: '' }]);
    load();
  }

  async function assign(e) {
    e.preventDefault();
    if (!assignPlan || !assignClient) return;
    // Deactivate any current active plan for this client, then assign the new one.
    await supabase.from('client_meal_plans').update({ active: false }).eq('client_id', assignClient).eq('active', true);
    const { error } = await supabase.from('client_meal_plans').insert({ client_id: assignClient, meal_plan_id: assignPlan });
    if (error) return alert(error.message);
    alert('Meal plan assigned.');
  }

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>COMMAND CENTER</p>
        <Link href="/trainer">Dashboard</Link>
        <Link href="/trainer/clients">Clients</Link>
        <Link href="/trainer/workout-builder">Workout Builder</Link>
        <Link href="/trainer/exercises">Exercise Library</Link>
        <button className="on">Meal Plans</button>
        <Link href="/trainer/programs">Programs</Link>
        <Link href="/trainer/testimonials">Testimonials</Link>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <Link href="/trainer/messages">Messages</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">TRAINER</p><h1>Meal Plans</h1></div></div>

        <div className="widget" style={{ marginBottom: 20 }}>
          <h3>Build a Meal Plan</h3>
          <form className="form" onSubmit={savePlan}>
            <label>Title<input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></label>
            <div className="form-grid">
              <label>Daily Calories<input type="number" value={form.daily_calories} onChange={(e) => setForm({ ...form, daily_calories: e.target.value })} /></label>
              <label>Protein (g)<input type="number" value={form.protein_g} onChange={(e) => setForm({ ...form, protein_g: e.target.value })} /></label>
              <label>Carbs (g)<input type="number" value={form.carbs_g} onChange={(e) => setForm({ ...form, carbs_g: e.target.value })} /></label>
              <label>Fat (g)<input type="number" value={form.fat_g} onChange={(e) => setForm({ ...form, fat_g: e.target.value })} /></label>
            </div>
            <label>Notes<textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></label>

            {items.map((it, i) => (
              <div key={i} className="form-grid" style={{ borderTop: '1px solid var(--line)', paddingTop: 16 }}>
                <label>Meal<input value={it.meal_label} onChange={(e) => updateItem(i, 'meal_label', e.target.value)} placeholder="Breakfast" /></label>
                <label style={{ gridColumn: 'span 2' }}>Description<input value={it.description} onChange={(e) => updateItem(i, 'description', e.target.value)} placeholder="e.g. 3 eggs, oats, banana" /></label>
                <label>Calories<input type="number" value={it.calories} onChange={(e) => updateItem(i, 'calories', e.target.value)} /></label>
                {items.length > 1 && <button type="button" className="mini danger" onClick={() => removeItem(i)} style={{ gridColumn: '1 / -1', justifySelf: 'start' }}>Remove</button>}
              </div>
            ))}
            <button type="button" className="btn outline" onClick={addItem}>＋ Add meal</button>
            <button className="btn blue" disabled={saving}>{saving ? 'Saving…' : 'Save meal plan'}</button>
          </form>
        </div>

        <div className="widget">
          <h3>Assign a Meal Plan to a Client</h3>
          <form className="form-grid" onSubmit={assign}>
            <label>Meal Plan
              <select value={assignPlan} onChange={(e) => setAssignPlan(e.target.value)} required>
                <option value="">Select…</option>
                {plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
              </select>
            </label>
            <label>Client
              <select value={assignClient} onChange={(e) => setAssignClient(e.target.value)} required>
                <option value="">Select…</option>
                {clients.map((c) => <option key={c.client_id} value={c.client_id}>{c.profiles?.full_name}</option>)}
              </select>
            </label>
            <button className="btn blue" style={{ gridColumn: '1 / -1' }}>Assign (replaces their current active plan)</button>
          </form>
        </div>
      </section>
    </main>
  );
}
