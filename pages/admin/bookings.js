import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

export default function AdminBookings() {
  const supabase = getSupabaseBrowserClient();
  const [bookings, setBookings] = useState([]);
  const [confirmEdits, setConfirmEdits] = useState({}); // { bookingId: { date, time } }

  async function load() {
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles(full_name,email)')
      .order('created_at', { ascending: false });
    setBookings(data || []);
  }

  useEffect(() => { load(); }, []);

  function updateEdit(id, field, value) {
    setConfirmEdits((prev) => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  }

  async function approveAndConfirm(b) {
    const edit = confirmEdits[b.id] || {};
    const confirmed_date = edit.date || b.preferred_date;
    const confirmed_time = edit.time || b.preferred_time;
    await supabase.from('bookings').update({ status: 'Approved', confirmed_date, confirmed_time }).eq('id', b.id);
    setConfirmEdits((prev) => { const next = { ...prev }; delete next[b.id]; return next; });
    load();
  }

  async function decline(id) {
    await supabase.from('bookings').update({ status: 'Declined' }).eq('id', id);
    load();
  }

  return (
    <AdminLayout active="bookings">
      <div className="panel">
        <div className="panel-head"><h2>Booking requests</h2></div>
        {bookings.length ? bookings.map((b) => (
          <div key={b.id} style={{ borderBottom: '1px solid #1a1a1a', padding: '16px 0' }}>
            <div className="row" style={{ border: 'none', padding: 0 }}>
              <div>
                <b>{b.profiles?.full_name || 'Customer'}</b>
                <small>
                  {b.program_id}<br />
                  Requested: {b.preferred_date || '—'} at {b.preferred_time || '—'}<br />
                  {b.profiles?.email}
                  {b.note && <><br /><i>"{b.note}"</i></>}
                </small>
              </div>
              <span className="status">{b.status}</span>
            </div>

            {b.status === 'Pending' && (
              <div style={{ display: 'flex', gap: 8, alignItems: 'end', marginTop: 10, flexWrap: 'wrap' }}>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Confirm date
                  <input type="date" defaultValue={b.preferred_date || ''} onChange={(e) => updateEdit(b.id, 'date', e.target.value)}
                    style={{ display: 'block', marginTop: 4, padding: 8, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)' }} />
                </label>
                <label style={{ fontSize: 11, color: 'var(--muted)' }}>
                  Confirm time
                  <input type="time" defaultValue={b.preferred_time || ''} onChange={(e) => updateEdit(b.id, 'time', e.target.value)}
                    style={{ display: 'block', marginTop: 4, padding: 8, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--panel)', color: 'var(--text)' }} />
                </label>
                <button className="mini" onClick={() => approveAndConfirm(b)}>Approve & Confirm</button>
                <button className="mini danger" onClick={() => decline(b.id)}>Decline</button>
              </div>
            )}
            {b.status === 'Approved' && (
              <p style={{ marginTop: 8, fontSize: 12, color: 'var(--success)' }}>
                Confirmed: {b.confirmed_date} at {b.confirmed_time}
              </p>
            )}
          </div>
        )) : <p className="muted">No booking requests yet.</p>}
      </div>
    </AdminLayout>
  );
}
