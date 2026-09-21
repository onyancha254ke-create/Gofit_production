import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

export default function TrainerMessages() {
  const supabase = getSupabaseBrowserClient();
  const [clients, setClients] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [thread, setThread] = useState([]);
  const [body, setBody] = useState('');
  const [myId, setMyId] = useState(null);

  async function loadClients() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    setMyId(session.user.id);
    const { data } = await supabase.from('trainer_clients').select('client_id, profiles!trainer_clients_client_id_fkey(full_name)').eq('trainer_id', session.user.id);
    setClients(data || []);
    if (data?.length && !activeId) setActiveId(data[0].client_id);
  }
  useEffect(() => { loadClients(); }, []);

  async function loadThread() {
    if (!activeId || !myId) return;
    const { data } = await supabase
      .from('messages')
      .select('*')
      .or(`and(sender_id.eq.${myId},recipient_id.eq.${activeId}),and(sender_id.eq.${activeId},recipient_id.eq.${myId})`)
      .order('created_at');
    setThread(data || []);
  }
  useEffect(() => { loadThread(); }, [activeId, myId]);

  async function send(e) {
    e.preventDefault();
    if (!body.trim()) return;
    const { error } = await supabase.from('messages').insert({ sender_id: myId, recipient_id: activeId, body });
    if (error) return alert(error.message);
    setBody('');
    loadThread();
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
        <Link href="/trainer/testimonials">Testimonials</Link>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <button className="on">Messages</button>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">TRAINER</p><h1>Messages</h1></div></div>

        <div className="dash-grid">
          <div className="widget">
            <h3>Conversation</h3>
            <div style={{ maxHeight: 420, overflowY: 'auto', marginBottom: 16 }}>
              {thread.length ? thread.map((m) => (
                <div key={m.id} className="msg-bubble" style={{ marginLeft: m.sender_id === myId ? '20%' : 0, background: m.sender_id === myId ? 'var(--accent)' : 'var(--panel2)', color: m.sender_id === myId ? '#fff' : 'inherit' }}>
                  {m.body}
                  <small style={{ color: m.sender_id === myId ? '#ffffffcc' : 'var(--muted)' }}>{new Date(m.created_at).toLocaleString()}</small>
                </div>
              )) : <p className="muted">No messages in this conversation yet.</p>}
            </div>
            <form onSubmit={send} style={{ display: 'flex', gap: 10 }}>
              <input style={{ flex: 1, padding: 12, borderRadius: 8, border: '1px solid var(--line)', background: 'var(--panel)', color: '#fff' }} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Type a message…" />
              <button className="btn blue">Send</button>
            </form>
          </div>

          <div className="widget">
            <h3>Clients</h3>
            {clients.map((c) => (
              <div key={c.client_id} className="row" style={{ cursor: 'pointer', color: c.client_id === activeId ? 'var(--accent)' : 'inherit' }} onClick={() => setActiveId(c.client_id)}>
                <b>{c.profiles?.full_name}</b>
              </div>
            ))}
            {!clients.length && <p className="muted">No clients assigned yet.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}
