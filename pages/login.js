import { useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function Login() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } =
      mode === 'signup'
        ? await supabase.auth.signUp({
            email,
            password,
            options: { data: { full_name: fullName } },
          })
        : await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return setError(error.message);
    router.push(router.query.next || '/account');
  }

  return (
    <>
      <Nav />
      <main className="page narrow">
        <div className="auth">
          <p className="eyebrow">GOFIT ACCOUNT</p>
          <h1>{mode === 'signup' ? 'Create your account.' : 'Welcome back.'}</h1>
          <p className="muted">
            Real authentication via Supabase — passwords are hashed and never touch our own servers.
          </p>
          <form className="form" onSubmit={submit}>
            {mode === 'signup' && (
              <label>
                Full name
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />
              </label>
            )}
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </label>
            <label>
              Password
              <input
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>
            {error && <p style={{ color: '#ff7777', fontSize: 12 }}>{error}</p>}
            <button className="btn blue" disabled={loading}>
              {loading ? 'Please wait…' : mode === 'signup' ? 'Create account →' : 'Sign in →'}
            </button>
          </form>
          <p className="muted" style={{ marginTop: 16 }}>
            {mode === 'signup' ? 'Already have an account? ' : "Don't have an account? "}
            <a href="#" onClick={(e) => { e.preventDefault(); setMode(mode === 'signup' ? 'signin' : 'signup'); }}>
              {mode === 'signup' ? 'Sign in' : 'Create one'}
            </a>
          </p>
        </div>
      </main>
      <Footer />
    </>
  );
}
