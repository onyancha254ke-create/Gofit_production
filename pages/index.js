import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const money = (n) => '$' + Number(n).toFixed(2);

const FEATURES = [
  { icon: '💪', title: 'Expert Coaching', copy: 'Certified, experienced fitness professional.' },
  { icon: '🎯', title: 'Personalized Plans', copy: 'Tailored to your goals and fitness level.' },
  { icon: '🥗', title: 'Nutrition Guidance', copy: 'Fuel your body for better results.' },
  { icon: '💻', title: 'Online & In-Person', copy: 'Train from anywhere or at your side.' },
  { icon: '📈', title: 'Real Results', copy: 'Progress you can measure, week over week.' },
];

const WHY = [
  { icon: '🎯', title: 'Goal Focused', copy: 'We build plans around your unique goals.' },
  { icon: '🤝', title: 'Personal Support', copy: "You're never alone on this journey." },
  { icon: '📊', title: 'Sustainable Results', copy: 'No quick fixes. Just real, lasting change.' },
  { icon: '🔄', title: 'Ongoing Coaching', copy: 'Plans evolve with you as you progress.' },
];

export default function Home() {
  const supabase = getSupabaseBrowserClient();
  const [products, setProducts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [testimonials, setTestimonials] = useState([]);

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).limit(4).then(({ data }) => setProducts(data || []));
    supabase.from('programs').select('*').eq('active', true).order('created_at').then(({ data }) => setPrograms(data || []));
    supabase.from('testimonials').select('*').eq('approved', true).order('created_at', { ascending: false }).limit(3)
      .then(({ data }) => setTestimonials(data || []));
  }, []);

  return (
    <>
      <Nav />

      {/* HERO */}
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
            <a href="https://x.com/onyanchah0254" aria-label="X (Twitter)" target="_blank" rel="noopener noreferrer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-7.6 8.7L23 22h-6.9l-5.4-6.6L4.5 22H1.3l8.1-9.3L1 2h7l4.9 6.1L18.9 2Zm-1.2 18h1.9L7.4 3.9H5.4L17.7 20Z"/></svg>
            </a>
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

      {/* FEATURE STRIP */}
      <section className="cards">
        {FEATURES.map((f) => (
          <article key={f.title}>
            <span>{f.icon}</span>
            <h3>{f.title}</h3>
            <p>{f.copy}</p>
          </article>
        ))}
      </section>

      {/* PROGRAMS */}
      <div className="section-title">
        <div>
          <p className="eyebrow" style={{ color: 'var(--muted)' }}>OUR PROGRAMS</p>
          <h2>Built for<br />your goals.</h2>
        </div>
        <Link href="/training">View all programs →</Link>
      </div>
      <div className="programs">
        {programs.slice(0, 4).map((p) => (
          <article className="program" key={p.id}>
            {p.image_url ? (
              <div className="art" style={{ height: 140, margin: '-26px -26px 16px' }}>
                <img src={p.image_url} alt={p.title} />
              </div>
            ) : (
              <div className="art" style={{ height: 140, margin: '-26px -26px 16px', background: 'var(--bg-dark)' }} />
            )}
            <span>PROGRAM</span>
            <h2 style={{ marginTop: 10 }}>{p.title}</h2>
            <p>{p.description}</p>
            <b>{money(p.price)} <small>{p.unit}</small></b>
            <Link href="/booking" className="btn blue full" style={{ textAlign: 'center' }}>Book / enquire →</Link>
          </article>
        ))}
        {!programs.length && <p className="muted">No programs published yet.</p>}
      </div>

      {/* ABOUT (dark split) */}
      <section className="coffee">
        <div className="split">
          <img className="feature-img" src="/hero-trainer.jpg" alt="Coaching session" />
          <div>
            <p className="eyebrow">ABOUT GOFIT</p>
            <h2>More than<br />just a workout.</h2>
            <p style={{ color: '#c9c9c0' }}>
              GoFit is built on the belief that fitness changes lives. We're here to help you overcome plateaus,
              get stronger, and achieve your goals with expert coaching, personalized support, and a results-driven approach.
            </p>
            <div className="checks">
              <span>👤 Men &amp; Women</span>
              <span>📍 Kenya &amp; Online</span>
              <span>🏆 Real Results</span>
            </div>
            <Link href="/training" className="btn blue" style={{ marginTop: 20, display: 'inline-block' }}>Learn more →</Link>
          </div>
        </div>
      </section>

      {/* WHY CHOOSE US */}
      <div className="section-title">
        <div>
          <p className="eyebrow" style={{ color: 'var(--muted)' }}>WHY CHOOSE US</p>
          <h2>Your success is<br />our priority.</h2>
        </div>
      </div>
      <div className="quote">
        <div className="quote-grid">
          {WHY.map((w) => (
            <div key={w.title}>
              <div className="quote-icon">{w.icon}</div>
              <p>{w.title}</p>
              <small>{w.copy}</small>
            </div>
          ))}
        </div>
      </div>

      {/* SHOP PREVIEW */}
      {products.length > 0 && (
        <section className="shop-preview">
          <div className="section-title" style={{ margin: '0 auto 32px' }}>
            <div>
              <p className="eyebrow" style={{ color: 'var(--muted)' }}>SHOP</p>
              <h2>Coffee &amp;<br />nutrition.</h2>
            </div>
            <Link href="/shop">Shop all →</Link>
          </div>
          <div className="product-grid" style={{ marginBottom: 0 }}>
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
          </div>
        </section>
      )}

      {/* TESTIMONIALS */}
      <div className="section-title">
        <div>
          <p className="eyebrow" style={{ color: 'var(--muted)' }}>REAL STORIES</p>
          <h2>What our<br />clients say.</h2>
        </div>
      </div>
      <div className="newsletter">
        {testimonials.length ? testimonials.map((t) => (
          <div className="msg-bubble" key={t.id}>
            <p>"{t.quote}"</p>
            <small>{t.client_name}</small>
          </div>
        )) : (
          <p className="muted" style={{ gridColumn: '1 / -1' }}>No client testimonials published yet.</p>
        )}
      </div>

      {/* CTA BAND */}
      <section className="cta-band">
        <p className="eyebrow">READY TO START?</p>
        <h2>Let's build the stronger,<br />healthier you.</h2>
        <Link href="/training" className="btn blue">Get started today →</Link>
      </section>

      <Footer />
    </>
  );
}
