import { useState } from 'react';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function Checkout({ cart }) {
  // `cart` here represents wherever your cart state lives (React context,
  // Zustand, etc.) — wire it to your existing cart implementation.
  const [loading, setLoading] = useState(false);

  async function pay() {
    setLoading(true);
    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: cart || [] }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url; // redirect to real Stripe Checkout
    else alert(data.error || 'Something went wrong');
  }

  return (
    <>
      <Nav />
      <main className="page narrow">
        <div className="page-head">
          <p className="eyebrow">CHECKOUT</p>
          <h1>Complete your<br /><em>GoFit order.</em></h1>
        </div>
        <button className="btn blue" onClick={pay} disabled={loading}>
          {loading ? 'Redirecting to Stripe…' : 'Pay with Stripe →'}
        </button>
        <p className="muted">You'll be redirected to Stripe's secure checkout page — card details never touch this site.</p>
      </main>
      <Footer />
    </>
  );
}
