import Link from 'next/link';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const money = (n) => '$' + Number(n).toFixed(2);

const programs = [
  { id: 'tr1', title: '1:1 Personal Training', price: 80, unit: '/ session', copy: 'Individual coaching, custom programming and accountability.' },
  { id: 'tr2', title: '4-Week Strength System', price: 39, unit: '', copy: 'Progressive training structure for building strength and confidence.' },
  { id: 'tr3', title: 'Online Coaching', price: 120, unit: '/ month', copy: 'Remote programming, check-ins and ongoing progression.' },
];

export default function Training() {
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
          {programs.map((p) => (
            <article className="program" key={p.id}>
              <span>GOFIT / {p.id.toUpperCase()}</span>
              <h2>{p.title}</h2>
              <p>{p.copy}</p>
              <b>{money(p.price)} <small>{p.unit}</small></b>
              <Link href={`/booking?program=${p.id}`} className="btn blue">Book / enquire →</Link>
            </article>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}
