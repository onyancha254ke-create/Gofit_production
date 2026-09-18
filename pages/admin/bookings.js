import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

export default function AdminBookings() {
  const supabase = getSupabaseBrowserClient();
  const [bookings, setBookings] = useState([]);

  async function load() {
    const { data } = await supabase
      .from('bookings')
      .select('*, profiles(full_name,email), availability(slot_date,slot_time)')
      .order('created_at', { ascending: false });
    setBookings(data || []);
  }

  useEffect(() => { load(); }, []);

  async function setStatus(id, status) {
    await supabase.from('bookings').update({ status }).eq('id', id);
    load();
  }

  return (
    <AdminLayout active="bookings">
      <div className="panel">
        <div className="panel-head"><h2>Booking requests</h2></div>
        {bookings.length ? bookings.map((b) => (
          <div className="row" key={b.id}>
            <div>
              <b>{b.profiles?.full_name || 'Customer'}</b>
              <small>
                {b.availability?.slot_date} • {b.availability?.slot_time}<br />
                {b.profiles?.email}
              </small>
            </div>
            <div>
              <span className="status">{b.status}</span>{' '}
              {b.status === 'Pending' && (
                <>
                  <button className="mini" onClick={() => setStatus(b.id, 'Approved')}>Approve</button>{' '}
                  <button className="mini danger" onClick={() => setStatus(b.id, 'Declined')}>Decline</button>
                </>
              )}
            </div>
          </div>
        )) : <p className="muted">No booking requests yet.</p>}
      </div>
    </AdminLayout>
  );
}
