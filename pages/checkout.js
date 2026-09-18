import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { useCart } from '../lib/cartContext';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const money = (n) => '$' + Number(n).toFixed(2);

export default function Checkout() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { items, total } = useCart();
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);

    // Check locally first so we can send them to login with a clear path
    // back here, instead of firing the request and getting a raw 401.
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLoading(false);
      router.push('/login?next=/checkout');
      return;
    }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((i) => ({ product_id: i.product_id, quantity: i.qty })) }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url; // redirect to real Stripe Checkout
    else alert(data.error || 'Something went wrong');
  }

  if (!items.length) {
    return (
      <>
        <Nav />
        <main className="page narrow">
          <div className="page-head"><p className="eyebrow">CHECKOUT</p><h1>Your cart is empty.</h1></div>
          <Link href="/shop" className="btn blue">Browse the shop →</Link>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Nav />
      <main className="page narrow">
        <div className="page-head">
          <p className="eyebrow">CHECKOUT</p>
          <h1>Complete your<br /><em>GoFit order.</em></h1>
        </div>

        <div className="summary" style={{ marginBottom: 24 }}>
          {items.map((i) => (
            <div key={i.product_id}><span>{i.name} × {i.qty}</span><b>{money(i.price * i.qty)}</b></div>
          ))}
          <hr />
          <div><span>Total</span><b>{money(total)}</b></div>
        </div>

        <button className="btn blue" onClick={pay} disabled={loading}>
          {loading ? 'Please wait…' : 'Pay with Stripe →'}
        </button>
        <p className="muted">You'll be redirected to Stripe's secure checkout page — card details never touch this site.</p>
      </main>
      <Footer />
    </>
  );
}
