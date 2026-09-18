import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../../lib/supabaseClient';

export default function ClientDetail() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { id } = router.query;
  const [client, setClient] = useState(null);
  const [progress, setProgress] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  async function load() {
    if (!id) return;
    const [profileRes, progressRes, photoRes] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', id).single(),
      supabase.from('progress_logs').select('*').eq('client_id', id).order('log_date', { ascending: false }).limit(10),
      supabase.from('transformation_photos').select('*').eq('client_id', id).order('taken_date', { ascending: false }).limit(6),
    ]);
    setClient(profileRes.data);
    setProgress(progressRes.data || []);
    setPhotos(photoRes.data || []);
  }
  useEffect(() => { load(); }, [id]);

  async function sendMessage(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    const { error } = await supabase.from('messages').insert({ sender_id: session.user.id, recipient_id: id, body: message });
    setSending(false);
    if (error) return alert(error.message);
    setMessage('');
    alert('Message sent.');
  }

  if (!client) return <main className="page"><p className="muted">Loading…</p></main>;

  const latest = progress[0];
  const first = progress[progress.length - 1];
  const weightChange = latest && first && latest.id !== first.id ? (latest.weight_kg - first.weight_kg).toFixed(1) : null;

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>COMMAND CENTER</p>
        <Link href="/trainer">Dashboard</Link>
        <Link href="/trainer/clients">Clients</Link>
        <Link href="/trainer/workout-builder">Workout Builder</Link>
        <Link href="/trainer/exercises">Exercise Library</Link>
        <Link href="/trainer/meal-plans">Meal Plans</Link>
        <Link href="/trainer/analytics">Progress Analytics</Link>
        <Link href="/trainer/messages">Messages</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head"><div><p className="eyebrow">CLIENT</p><h1>{client.full_name}</h1></div></div>

        <div className="dash-grid">
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="widget">
              <h3>Progress History</h3>
              {progress.length ? progress.map((p) => (
                <div className="row" key={p.id}>
                  <div><b>{p.weight_kg} kg</b><small>{new Date(p.log_date).toLocaleDateString()}</small></div>
                  <small className="muted">
                    {p.waist_cm ? `Waist ${p.waist_cm}cm` : ''} {p.chest_cm ? `· Chest ${p.chest_cm}cm` : ''}
                  </small>
                </div>
              )) : <p className="muted">No progress logged by this client yet.</p>}
              {weightChange !== null && (
                <p style={{ marginTop: 14 }}>
                  Change over this period: <b style={{ color: weightChange < 0 ? 'var(--success)' : 'var(--accent)' }}>{weightChange > 0 ? '+' : ''}{weightChange} kg</b>
                </p>
              )}
            </div>

            <div className="widget">
              <h3>Transformation Photos</h3>
              {photos.length ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {photos.map((p) => (
                    <img key={p.id} src={p.photo_url} alt={p.label || 'progress photo'} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 10, border: '1px solid var(--line)' }} />
                  ))}
                </div>
              ) : <p className="muted">No photos uploaded yet.</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div className="widget">
              <h3>Client Info</h3>
              <p className="muted" style={{ fontSize: 13 }}>{client.email}</p>
            </div>
            <div className="widget">
              <h3>Send a Message</h3>
              <form className="form" onSubmit={sendMessage}>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Write a note to your client…" />
                <button className="btn blue" disabled={sending}>{sending ? 'Sending…' : 'Send'}</button>
              </form>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
