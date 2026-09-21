import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import { useCart } from '../lib/cartContext';
import Logo from './Logo';
import Icon from './Icon';

export default function Nav() {
  const supabase = getSupabaseBrowserClient();
  const [session, setSession] = useState(null);
  const [role, setRole] = useState(null);
  const { count } = useCart();

  useEffect(() => {
    async function loadRole(s) {
      setSession(s);
      if (s) {
        const { data } = await supabase.from('profiles').select('role').eq('id', s.user.id).single();
        setRole(data?.role || null);
      } else {
        setRole(null);
      }
    }
    supabase.auth.getSession().then(({ data }) => loadRole(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => loadRole(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  return (
    <header className="nav">
      <Link href="/"><Logo /></Link>
      <nav>
        <Link href="/">Home</Link>
        <Link href="/training">Programs</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/booking">Book</Link>
      </nav>
      <div className="nav-right">
        <Link href="/shop" className="nav-icon-btn" aria-label="Shop"><Icon name="search" size={17} /></Link>
        <Link href="/cart" className="cartbtn">Cart{count > 0 && <b>{count}</b>}</Link>
        <Link href={session ? '/account' : '/login'} style={{ fontSize: 14, fontWeight: 600 }}>{session ? 'Account' : 'Login'}</Link>
        {role === 'client' && <Link className="adminlink" href="/dashboard">Dashboard</Link>}
        {(role === 'trainer' || role === 'admin') && <Link className="adminlink" href="/trainer">Trainer</Link>}
        {role === 'admin' && <Link className="adminlink" href="/admin">Admin</Link>}
        {!session && <Link className="adminlink" href="/login">Get Started</Link>}
      </div>
    </header>
  );
}
