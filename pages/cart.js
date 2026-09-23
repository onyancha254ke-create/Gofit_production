import Link from 'next/link';
import { useCart } from '../lib/cartContext';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

const moneyUsd = (n) => '$' + Number(n).toFixed(2);
const moneyKes = (n) => 'KSh ' + Number(n).toLocaleString();

export default function Cart() {
  const { items, changeQty, removeItem, total, totalKes, currency } = useCart();
  const money = currency === 'kes' ? moneyKes : moneyUsd;

  return (
    <>
      <Nav />
      <main className="page narrow">
        <div className="page-head">
          <p className="eyebrow">YOUR CART</p>
          <h1>Review your<br /><em>order.</em></h1>
        </div>

        {items.length ? (
          <>
            {items.map((i) => {
              const priceForCurrency = currency === 'kes' ? i.price_kes : i.price;
              return (
                <div className="cart-row" key={i.product_id}>
                  {i.image_url ? <img src={i.image_url} alt={i.name} /> : <div style={{ width: 65, height: 65, background: 'var(--panel)', borderRadius: 8 }} />}
                  <div>
                    <b>{i.name}</b>
                    <small>{priceForCurrency ? `${money(priceForCurrency)} each` : `No ${currency.toUpperCase()} price set`}</small>
                    <div className="qty">
                      <button onClick={() => changeQty(i.product_id, -1)} aria-label="Decrease quantity">−</button>
                      {i.qty}
                      <button onClick={() => changeQty(i.product_id, 1)} aria-label="Increase quantity">+</button>
                    </div>
                  </div>
                  <button onClick={() => removeItem(i.product_id)} aria-label="Remove item">×</button>
                </div>
              );
            })}
            <div className="cart-total"><span>Total</span><b>{money(currency === 'kes' ? totalKes : total)}</b></div>
            <Link href="/checkout" className="btn blue full" style={{ textAlign: 'center' }}>Proceed to checkout →</Link>
          </>
        ) : (
          <div className="empty">
            <p className="muted">Your cart is empty.</p>
            <Link href="/shop" className="btn blue" style={{ marginTop: 16, display: 'inline-block' }}>Browse the shop →</Link>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}
