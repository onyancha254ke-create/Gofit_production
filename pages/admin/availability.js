import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

const TIMES = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function AdminAvailability() {
  const supabase = getSupabaseBrowserClient();
  const [slots, setSlots] = useState([]);
  const [date, setDate] = useState(todayISO());
  const [selectedTimes, setSelectedTimes] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    const { data } = await supabase
      .from('availability')
      .select('*')
      .gte('slot_date', todayISO())
      .order('slot_date')
      .order('slot_time');
    setSlots(data || []);
  }

  useEffect(() => { load(); }, []);

  function toggleTime(t) {
    setSelectedTimes((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  }

  async function addSlots(e) {
    e.preventDefault();
    if (!selectedTimes.length) return;
    setError('');
    setSaving(true);
    const rows = selectedTimes.map((t) => ({ slot_date: date, slot_time: t }));
    // Duplicate (date, time) pairs are rejected by the unique constraint in
    // schema.sql — ignoreDuplicates just means re-clicking an already-added
    // time for the same day is a harmless no-op instead of an error.
    const { error } = await supabase
      .from('availability')
      .upsert(rows, { onConflict: 'slot_date,slot_time', ignoreDuplicates: true });
    setSaving(false);
    if (error) return setError(error.message);
    setSelectedTimes([]);
    load();
  }

  async function removeSlot(id, isBooked) {
    if (isBooked) return; // never let admin silently delete a slot a customer already booked
    await supabase.from('availability').delete().eq('id', id);
    load();
  }

  const grouped = slots.reduce((acc, s) => {
    (acc[s.slot_date] = acc[s.slot_date] || []).push(s);
    return acc;
  }, {});

  return (
    <AdminLayout active="availability">
      <div className="panel">
        <div className="panel-head"><h2>Add open slots</h2></div>
        <form className="form-grid" onSubmit={addSlots}>
          <label>
            Date
            <input type="date" min={todayISO()} value={date} onChange={(e) => setDate(e.target.value)} required />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>
            Times
            <div className="filters" style={{ marginTop: 8 }}>
              {TIMES.map((t) => (
                <a
                  key={t}
                  href="#"
                  onClick={(e) => { e.preventDefault(); toggleTime(t); }}
                  className={selectedTimes.includes(t) ? 'selected' : ''}
                >
                  {t}
                </a>
              ))}
            </div>
          </label>
          {error && <p style={{ color: '#c0392b', fontSize: 12, gridColumn: '1 / -1' }}>{error}</p>}
          <button className="btn blue" disabled={saving || !selectedTimes.length} style={{ gridColumn: '1 / -1' }}>
            {saving ? 'Adding…' : `＋ Add ${selectedTimes.length || ''} slot${selectedTimes.length === 1 ? '' : 's'}`.trim()}
          </button>
        </form>
      </div>

      <div className="panel">
        <div className="panel-head"><h2>Upcoming slots</h2></div>
        {Object.keys(grouped).length ? Object.entries(grouped).map(([d, daySlots]) => (
          <div key={d} style={{ marginBottom: 18 }}>
            <p className="muted" style={{ fontSize: 11, letterSpacing: 1, marginBottom: 8 }}>{d}</p>
            {daySlots.map((s) => (
              <div className="row" key={s.id}>
                <div>
                  <b>{s.slot_time}</b>
                  {s.is_booked && <small style={{ color: 'var(--success-ink)' }}>Booked</small>}
                </div>
                {!s.is_booked && (
                  <button className="mini danger" onClick={() => removeSlot(s.id, s.is_booked)}>Remove</button>
                )}
              </div>
            ))}
          </div>
        )) : <p className="muted">No upcoming slots. Add some above.</p>}
      </div>
    </AdminLayout>
  );
}
