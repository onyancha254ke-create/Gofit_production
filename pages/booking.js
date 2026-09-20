import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function Booking() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const [programs, setPrograms] = useState([]);
  const [program, setProgram] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    supabase.from('programs').select('*').eq('active', true).order('created_at')
      .then(({ data }) => { setPrograms(data || []); if (data?.length) setProgram(data[0].title); });
  }, []);

  async function submit(e) {
    e.preventDefault();
    setStatus('Sending your request…');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return router.push('/login?next=/booking');

    const { error } = await supabase.from('bookings').insert({
      customer_id: session.user.id,
      program_id: program,
      preferred_date: preferredDate,
      preferred_time: preferredTime,
      note,
      status: 'Pending',
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
          <p>Pick a program and tell us your preferred date and time — your trainer will confirm it with you shortly after.</p>
        </div>
        <form className="form" onSubmit={submit}>
          <label>
            Program
            <select value={program} onChange={(e) => setProgram(e.target.value)} required>
              {programs.map((p) => (
                <option key={p.id} value={p.title}>{p.title}</option>
              ))}
            </select>
          </label>
          <div className="form-grid">
            <label>
              Preferred date
              <input type="date" min={new Date().toISOString().slice(0, 10)} value={preferredDate} onChange={(e) => setPreferredDate(e.target.value)} required />
            </label>
            <label>
              Preferred time
              <input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} required />
            </label>
          </div>
          <label>
            Goal / note
            <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Tell your trainer what you want to achieve, or any scheduling flexibility." />
          </label>
          {status && <p className="muted">{status}</p>}
          <button className="btn blue">Send booking request →</button>
        </form>
      </main>
      <Footer />
    </>
  );
}
