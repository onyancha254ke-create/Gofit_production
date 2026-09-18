import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const programs = [
  { id: 'tr1', title: '1:1 Personal Training' },
  { id: 'tr2', title: '4-Week Strength System' },
  { id: 'tr3', title: 'Online Coaching' },
];

export default function Booking() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [slots, setSlots] = useState([]);
  const [program, setProgram] = useState(programs[0].id);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    supabase
      .from('availability')
      .select('*')
      .eq('is_booked', false)
      .gte('slot_date', new Date().toISOString().slice(0, 10))
      .order('slot_date')
      .order('slot_time')
      .then(({ data }) => setSlots(data || []));
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus('Booking…');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login?next=/booking');

    // Calls the SQL function in schema.sql — it locks the row and fails
    // cleanly if someone else grabbed the same slot a moment earlier.
    const { error } = await supabase.rpc('create_booking', {
      p_program_id: program,
      p_availability_id: selectedSlot,
      p_note: note,
    });
    if (error) return setStatus(error.message);
    router.push('/account');
  }

  return (
    <>
      <Nav />
      <main className="page narrow">
        <div className="page-head">
          <p className="eyebrow">BOOKING</p>
          <h1>Reserve your<br /><em>GoFit session.</em></h1>
          <p>Slots below come straight from the trainer's live calendar — once you book one, no one else can.</p>
        </div>
        <form className="form" onSubmit={submit}>
          <label>
            Program
            <select value={program} onChange={(e) => setProgram(e.target.value)}>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.title}</option>
              ))}
            </select>
          </label>
          <label>
            Available slot
            <select value={selectedSlot || ''} onChange={(e) => setSelectedSlot(e.target.value)} required>
              <option value="" disabled>Choose a date & time</option>
              {slots.map((s) => (
                <option key={s.id} value={s.id}>{s.slot_date} — {s.slot_time}</option>
              ))}
            </select>
          </label>
          <label>
            Goal / note
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell the trainer what you want to achieve." />
          </label>
          {status && <p className="muted">{status}</p>}
          <button className="btn blue" disabled={!selectedSlot}>Send booking request →</button>
        </form>
      </main>
      <Footer />
    </>
  );
}
