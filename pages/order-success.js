import { useRouter } from 'next/router';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function OrderSuccess() {
  const { query } = useRouter();
  return (
    <>
      <Nav />
      <main className="page narrow">
        <div className="page-head">
          <p className="eyebrow">ORDER CONFIRMED</p>
          <h1>Thank you.</h1>
          <p>
            Your order (#{String(query.order || '').slice(0, 8)}) is confirmed. It will show as
            "Paid" in your account once Stripe's webhook finishes processing — usually within seconds.
          </p>
        </div>
        <a className="btn blue" href="/account">View your account →</a>
      </main>
      <Footer />
    </>
  );
}
