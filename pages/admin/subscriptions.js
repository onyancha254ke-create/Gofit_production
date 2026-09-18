import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

export default function AdminSubscriptions() {
  const supabase = getSupabaseBrowserClient();
  const [subs, setSubs] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ client_id: '', plan_name: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    const [subRes, clientRes] = await Promise.all([
      supabase.from('subscriptions').select('*, profiles!subscriptions_client_id_fkey(full_name, email)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, full_name').eq('role', 'client'),
    ]);
    setSubs(subRes.data || []);
    setClients(clientRes.data || []);
  }
  useEffect(() => { load(); }, []);

  async function addSub(e) {
    e.preventDefault();
    if (!form.client_id || !form.plan_name) return;
    setSaving(true);
    const { error } = await supabase.from('subscriptions').insert({ client_id: form.client_id, plan_name: form.plan_name, status: 'active' });
    setSaving(false);
    if (error) return alert(error.message);
    setForm({ client_id: '', plan_name: '' });
    load();
  }

  async function setStatus(id, status) {
    await supabase.from('subscriptions').update({ status }).eq('id', id);
    load();
  }

  return (
    <AdminLayout active="subscriptions">
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head"><h2>Add a subscription</h2></div>
        <form className="form-grid" onSubmit={addSub}>
          <label>Client
            <select value={form.client_id} onChange={(e) => setForm({ ...form, client_id: e.target.value })} required>
              <option value="">Select…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.full_name}</option>)}
            </select>
          </label>
          <label>Plan name
            <input value={form.plan_name} onChange={(e) => setForm({ ...form, plan_name: e.target.value })} placeholder="e.g. Monthly Coaching" required />
          </label>
          <button className="btn blue" disabled={saving} style={{ gridColumn: '1 / -1' }}>{saving ? 'Saving…' : '＋ Add subscription'}</button>
        </form>
        <p className="muted" style={{ fontSize: 11, marginTop: 10 }}>
          This tracks who has an active coaching subscription. It does not yet charge recurring payments automatically —
          that needs a Stripe Subscription (not Checkout) integration as a follow-up.
        </p>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>All Subscriptions</h2></div>
        {subs.length ? subs.map((s) => (
          <div className="row" key={s.id}>
            <div>
              <b>{s.profiles?.full_name}</b>
              <small>{s.plan_name} · {s.profiles?.email}</small>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span className="status" style={{ background: s.status === 'active' ? 'var(--accent)' : '#333' }}>{s.status}</span>
              {s.status === 'active' && <button className="mini" onClick={() => setStatus(s.id, 'paused')}>Pause</button>}
              {s.status !== 'active' && <button className="mini" onClick={() => setStatus(s.id, 'active')}>Reactivate</button>}
              <button className="mini danger" onClick={() => setStatus(s.id, 'cancelled')}>Cancel</button>
            </div>
          </div>
        )) : <p className="muted">No subscriptions yet.</p>}
      </div>
    </AdminLayout>
  );
}
