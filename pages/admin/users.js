import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

const ROLES = ['client', 'trainer', 'admin'];

export default function ManageUsers() {
  const supabase = getSupabaseBrowserClient();
  const [profiles, setProfiles] = useState([]);
  const [filter, setFilter] = useState('all');
  const [myId, setMyId] = useState(null);

  async function load() {
    const { data: { session } } = await supabase.auth.getSession();
    setMyId(session?.user?.id);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setProfiles(data || []);
  }
  useEffect(() => { load(); }, []);

  async function changeRole(id, newRole) {
    if (id === myId && newRole !== 'admin') {
      if (!confirm("You're changing your own role away from admin — you'll lose admin access immediately. Continue?")) return;
    }
    const { error } = await supabase.from('profiles').update({ role: newRole }).eq('id', id);
    if (error) return alert(error.message);
    load();
  }

  const filtered = filter === 'all' ? profiles : profiles.filter((p) => p.role === filter);
  const counts = profiles.reduce((acc, p) => { acc[p.role] = (acc[p.role] || 0) + 1; return acc; }, {});

  return (
    <AdminLayout active="users">
      <div className="metric-grid" style={{ marginBottom: 20 }}>
        <div><span>Total Users</span><b>{profiles.length}</b></div>
        <div><span>Clients</span><b>{counts.client || 0}</b></div>
        <div><span>Trainers</span><b>{counts.trainer || 0}</b></div>
        <div><span>Admins</span><b>{counts.admin || 0}</b></div>
      </div>

      <div className="filters" style={{ marginBottom: 20 }}>
        {['all', ...ROLES].map((r) => (
          <a key={r} href="#" onClick={(e) => { e.preventDefault(); setFilter(r); }} className={filter === r ? 'selected' : ''} style={{ textTransform: 'capitalize' }}>{r}</a>
        ))}
      </div>

      <div className="widget">
        <h3>All Users</h3>
        {filtered.length ? filtered.map((p) => (
          <div className="row" key={p.id}>
            <div>
              <b>{p.full_name || '(no name)'}</b>
              <small>{p.email}</small>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <select
                value={p.role}
                onChange={(e) => changeRole(p.id, e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)', textTransform: 'capitalize' }}
              >
                {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        )) : <p className="muted">No users match this filter.</p>}
      </div>
    </AdminLayout>
  );
}
