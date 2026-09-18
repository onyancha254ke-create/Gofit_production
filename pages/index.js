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
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">TRAIN • FUEL • ACHIEVE</p>
          <h1>Better habits.<br />Bigger results.</h1>
          <p className="lead">Personal training, premium coffee and nutrition built for people who move, build and never settle.</p>
          <div className="actions">
            <a className="btn blue" href="/training">Get started →</a>
            <a className="btn outline" href="/shop">Explore shop</a>
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
