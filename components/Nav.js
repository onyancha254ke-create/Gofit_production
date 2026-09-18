import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { useCart } from '../lib/cartContext';

export default function Nav() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState(null);
  const { count } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="nav">
      <Link className="logo" href="/">G<span>o</span>Fit</Link>
      <nav>
        <Link href="/training">Training</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/booking">Book</Link>
      </nav>
      <div className="nav-right">
        <Link href="/cart" className="cartbtn">Cart{count > 0 && <b>{count}</b>}</Link>
        <Link href={session ? '/account' : '/login'}>{session ? 'Account' : 'Login'}</Link>
        {session && <Link className="adminlink" href="/admin">Admin</Link>}
      </div>
    </header>
  );
}
