import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const money = (n) => '$' + Number(n).toFixed(2);

export default function Home() {
  const supabase = getSupabaseBrowserClient();
  const [products, setProducts] = useState([]);

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).limit(6).then(({ data }) => setProducts(data || []));
  }, []);

  return (
    <>
      <Nav />
      <section className="hero-full">
        <img className="hero-full-bg" src="/hero-trainer.jpg" alt="GoFit trainer" />
        <div className="hero-full-overlay" />
        <div className="hero-full-content">
          <p className="eyebrow">TRAIN • FUEL • ACHIEVE</p>
          <h1 className="hero-wordmark">GoFit</h1>
          <p className="lead">Personal training, premium coffee and nutrition built for people who move, build and never settle.</p>
          <div className="actions">
            <a className="btn blue" href="/training">Get started →</a>
            <a className="btn outline" href="/shop">Explore shop</a>
          </div>

          <div className="hero-about">
            <p><strong>The trainer.</strong> Hands-on coaching built on real accountability — every plan is built around you, not a template.</p>
            <p><strong>Our mission.</strong> Helping everyday people build strength, discipline and confidence through training, nutrition and community.</p>
          </div>

          <div className="social-row">
            {/* TODO: swap these placeholder # links for your real profile URLs */}
            <a href="#" aria-label="X (Twitter)" target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-6.6L4.5 22H1.3l8.1-9.3L1 2h7l4.9 6.1L18.9 2Zm-1.2 18h1.9L7.4 3.9H5.4L17.7 20Z"/></svg>
            </a>
            <a href="#" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>
            </a>
            <a href="#" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M16.5 2h-3v13.2a3.1 3.1 0 1 1-2.2-3v-3.1a6.1 6.1 0 1 0 5.2 6V9.3a7.7 7.7 0 0 0 4.5 1.4V7.7A4.8 4.8 0 0 1 16.5 2Z"/></svg>
            </a>
          </div>
        </div>
      </section>
      <section className="product-grid" style={{ maxWidth: 1240, margin: '0 auto 90px' }}>
        {products.map((p) => (
          <article className="product" key={p.id}>
            <div className="art">
              {p.image_url && <img src={p.image_url} alt={p.name} />}
              <i>{p.tag}</i>
            </div>
            <div className="pbody">
              <div className="prow"><h3>{p.name}</h3><b>{money(p.price)}</b></div>
              <p>{p.description}</p>
            </div>
          </article>
        ))}
      </section>
      <Footer />
    </>
  );
}
