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
            <a href="https://wa.me/qr/UTLSEJ4EQTG7A1" aria-label="WhatsApp" target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15L2 22l5.2-1.4A10 10 0 1 0 12 2Zm0 18.2a8.1 8.1 0 0 1-4.2-1.2l-.3-.2-3.1.8.8-3-.2-.3A8.2 8.2 0 1 1 12 20.2Zm4.5-6.1c-.2-.1-1.4-.7-1.7-.8-.2-.1-.4-.1-.6.1-.2.2-.6.8-.8 1-.1.2-.3.2-.5.1-.2-.1-1-.4-1.9-1.2-.7-.6-1.2-1.4-1.3-1.6-.1-.2 0-.4.1-.5l.4-.5c.1-.1.2-.3.2-.4.1-.2 0-.3 0-.4-.1-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 1.9s.8 2.2.9 2.4c.1.2 1.6 2.5 4 3.5.6.2 1 .4 1.3.5.6.2 1.1.1 1.5-.1.5-.2 1.4-.6 1.6-1.1.2-.5.2-1 .1-1.1-.1-.1-.2-.2-.4-.3Z"/></svg>
            </a>
            <a href="https://instagram.com/stoic_alpha" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.2" cy="6.8" r="1"/></svg>
            </a>
            <a href="https://tiktok.com/@thejudge254" aria-label="TikTok" target="_blank" rel="noopener noreferrer">
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
