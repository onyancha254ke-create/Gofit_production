import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { useCart } from '../lib/cartContext';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const money = (n) => '$' + Number(n).toFixed(2);
const CATEGORIES = ['All', 'Coffee', 'Training', 'Meal Plans'];

export default function Shop() {
  const supabase = getSupabaseBrowserClient();
  const { addItem, items } = useCart();
  const [products, setProducts] = useState([]);
  const [category, setCategory] = useState('All');
  const [added, setAdded] = useState(null);

  useEffect(() => {
    supabase.from('products').select('*').eq('active', true).order('created_at', { ascending: false })
      .then(({ data }) => setProducts(data || []));
  }, []);

  const filtered = category === 'All' ? products : products.filter((p) => p.category === category);

  function handleAdd(p) {
    const inCart = items.find((i) => i.product_id === p.id)?.qty || 0;
    if (inCart >= p.stock) {
      alert(`Only ${p.stock} in stock — you already have the max in your cart.`);
      return;
    }
    addItem(p);
    setAdded(p.id);
    setTimeout(() => setAdded(null), 1200);
  }

  return (
    <>
      <Nav />
      <main className="page">
        <div className="page-head">
          <p className="eyebrow">SHOP</p>
          <h1>Coffee, training<br /><em>and nutrition.</em></h1>
          <p>Everything GoFit sells, all in one place.</p>
        </div>

        <div className="filters">
          {CATEGORIES.map((c) => (
            <a key={c} href="#" onClick={(e) => { e.preventDefault(); setCategory(c); }} className={category === c ? 'selected' : ''}>{c}</a>
          ))}
        </div>

        <div className="product-grid">
          {filtered.map((p) => {
            const outOfStock = p.stock <= 0;
            const lowStock = !outOfStock && p.stock <= p.low_stock_threshold;
            return (
              <article className="product" key={p.id}>
                <div className="art">
                  {p.image_url && <img src={p.image_url} alt={p.name} />}
                  <i>{outOfStock ? 'OUT OF STOCK' : p.tag}</i>
                </div>
                <div className="pbody">
                  <div className="prow"><h3>{p.name}</h3><b>{money(p.price)}</b></div>
                  <p>{p.description}</p>
                  {lowStock && <p style={{ color: '#f0b24b', fontSize: 12, fontWeight: 700, margin: '4px 0' }}>Only {p.stock} left</p>}
                  <button className="btn blue full" onClick={() => handleAdd(p)} disabled={outOfStock}>
                    {outOfStock ? 'Out of stock' : added === p.id ? 'Added ✓' : 'Add to cart'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
        {!filtered.length && <p className="muted">No products in this category yet.</p>}
      </main>
      <Footer />
    </>
  );
}
