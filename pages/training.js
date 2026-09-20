import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const money = (n) => '$' + Number(n).toFixed(2);

export default function Training() {
  const supabase = getSupabaseBrowserClient();
  const [programs, setPrograms] = useState([]);

  useEffect(() => {
    supabase.from('programs').select('*').eq('active', true).order('created_at')
      .then(({ data }) => setPrograms(data || []));
  }, []);

  return (
    <>
      <Nav />
      <main className="page">
        <div className="page-head">
          <p className="eyebrow">COACHING</p>
          <h1>Training designed<br /><em>for progress.</em></h1>
          <p>Choose a coaching path and book your first session.</p>
        </div>
        <div className="programs">
          {programs.map((p, i) => (
            <article className="program" key={p.id}>
              <span>GOFIT / {String(i + 1).padStart(2, '0')}</span>
              <h2>{p.title}</h2>
              <p>{p.description}</p>
              <b>{money(p.price)} <small>{p.unit}</small></b>
              <Link href="/booking" className="btn blue">Book / enquire →</Link>
            </article>
          ))}
        </div>
        {!programs.length && <p className="muted">No programs available right now — check back soon.</p>}
      </main>
      <Footer />
    </>
  );
}
