import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { useCart } from '../lib/cartContext';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const moneyUsd = (n) => '$' + Number(n).toFixed(2);
const moneyKes = (n) => 'KSh ' + Number(n).toLocaleString();

export default function Checkout() {
  const supabase = getSupabaseBrowserClient();
  const router = useRouter();
  const { items, total, totalKes, allHaveKesPricing, currency, clear } = useCart();
  const [loading, setLoading] = useState(false);
  const [phone, setPhone] = useState('');
  const [mpesaStatus, setMpesaStatus] = useState(null); // null | 'waiting' | 'paid' | 'failed'
  const [mpesaOrderId, setMpesaOrderId] = useState(null);
  const pollRef = useRef(null);

  useEffect(() => () => clearInterval(pollRef.current), []);

  async function requireSession() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login?next=/checkout');
      return null;
    }
    return session;
  }

  async function payWithStripe() {
    setLoading(true);
    const session = await requireSession();
    if (!session) { setLoading(false); return; }

    const res = await fetch('/api/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((i) => ({ product_id: i.product_id, quantity: i.qty })) }),
    });
    const data = await res.json();
    setLoading(false);
    if (data.url) window.location.href = data.url;
    else alert(data.error || 'Something went wrong');
  }

  async function payWithMpesa(e) {
    e.preventDefault();
    setLoading(true);
    const session = await requireSession();
    if (!session) { setLoading(false); return; }

    const res = await fetch('/api/mpesa/stkpush', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items: items.map((i) => ({ product_id: i.product_id, quantity: i.qty })), phone }),
    });
    const data = await res.json();
    setLoading(false);

    if (data.error) { alert(data.error); return; }

    setMpesaOrderId(data.orderId);
    setMpesaStatus('waiting');

    // Poll the order's own status — the customer can read their own order
    // via RLS, so no extra API route is needed just to check progress.
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts += 1;
      const { data: order } = await supabase.from('orders').select('status').eq('id', data.orderId).single();
      if (order?.status === 'Paid') {
        clearInterval(pollRef.current);
        setMpesaStatus('paid');
        clear();
      } else if (order?.status === 'Cancelled') {
        clearInterval(pollRef.current);
        setMpesaStatus('failed');
      } else if (attempts > 40) { // ~2 minutes at 3s intervals
        clearInterval(pollRef.current);
        setMpesaStatus('failed');
      }
    }, 3000);
  }

  if (!items.length && mpesaStatus !== 'paid') {
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

        {mpesaStatus === 'paid' ? (
          <div className="widget">
            <h3 style={{ color: 'var(--success)' }}>Payment received ✓</h3>
            <p className="muted">Your M-Pesa payment went through. Thank you!</p>
            <Link href="/account" className="btn blue" style={{ marginTop: 16, display: 'inline-block' }}>View your account →</Link>
          </div>
        ) : (
          <>
            <div className="summary" style={{ marginBottom: 24 }}>
              {items.map((i) => {
                const p = currency === 'kes' ? i.price_kes : i.price;
                const money = currency === 'kes' ? moneyKes : moneyUsd;
                return <div key={i.product_id}><span>{i.name} × {i.qty}</span><b>{p ? money(p * i.qty) : '—'}</b></div>;
              })}
              <hr />
              <div><span>Total</span><b>{currency === 'kes' ? moneyKes(totalKes) : moneyUsd(total)}</b></div>
            </div>

            {currency === 'usd' ? (
              <>
                <button className="btn blue" onClick={payWithStripe} disabled={loading}>
                  {loading ? 'Please wait…' : 'Pay with Card (Stripe) →'}
                </button>
                <p className="muted">You'll be redirected to Stripe's secure checkout page — card details never touch this site.</p>
              </>
            ) : (
              <>
                {!allHaveKesPricing && (
                  <p style={{ color: '#f0b24b', fontSize: 13, marginBottom: 14 }}>
                    One or more items in your cart don't have a KES price set yet — M-Pesa checkout won't work until they do.
                  </p>
                )}
                {mpesaStatus === 'waiting' ? (
                  <div className="widget">
                    <h3>Check your phone</h3>
                    <p className="muted">An M-Pesa prompt was sent to <b>{phone}</b>. Enter your M-Pesa PIN to complete the payment of {moneyKes(totalKes)}.</p>
                    <p className="muted" style={{ marginTop: 10 }}>Waiting for confirmation…</p>
                  </div>
                ) : mpesaStatus === 'failed' ? (
                  <div className="widget">
                    <h3 style={{ color: '#ff6b6b' }}>Payment not completed</h3>
                    <p className="muted">The M-Pesa request wasn't confirmed — it may have timed out, been cancelled, or the PIN was wrong. You can try again below.</p>
                    <button className="btn blue" style={{ marginTop: 12 }} onClick={() => setMpesaStatus(null)}>Try again</button>
                  </div>
                ) : (
                  <form onSubmit={payWithMpesa} className="form">
                    <label>M-Pesa phone number
                      <input type="tel" placeholder="07XX XXX XXX" value={phone} onChange={(e) => setPhone(e.target.value)} required />
                    </label>
                    <button className="btn blue" disabled={loading || !allHaveKesPricing}>
                      {loading ? 'Sending prompt…' : `Pay ${moneyKes(totalKes)} with M-Pesa →`}
                    </button>
                  </form>
                )}
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}
