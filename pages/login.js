import { useState } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function Login() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);

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
    if (router.query.next) {
      router.push(router.query.next);
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', session.user.id).single();
      if (profile?.role === 'admin') router.push('/admin');
      else if (profile?.role === 'trainer') router.push('/trainer');
      else router.push('/dashboard');
    }
  }

  async function submitForgot(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return setError(error.message);
    setResetSent(true);
  }

  return (
    <>
      <Nav />
      <main className="page narrow">
        <div className="auth">
          <p className="eyebrow">GOFIT ACCOUNT</p>

          {mode !== 'forgot' && (
            <div className="filters" style={{ marginTop: 16, marginBottom: 4 }}>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setMode('signin'); setError(''); }}
                className={mode === 'signin' ? 'selected' : ''}
                style={{ fontWeight: 800, fontSize: 14, padding: '12px 24px' }}
              >
                Log In
              </a>
              <a
                href="#"
                onClick={(e) => { e.preventDefault(); setMode('signup'); setError(''); }}
                className={mode === 'signup' ? 'selected' : ''}
                style={{ fontWeight: 800, fontSize: 14, padding: '12px 24px' }}
              >
                Sign Up
              </a>
            </div>
          )}

          {mode === 'forgot' ? (
            <>
              <h1>Reset your password.</h1>
              {resetSent ? (
                <p className="muted">
                  If an account exists for <b>{email}</b>, a reset link has been sent — check your email.
                </p>
              ) : (
                <form className="form" onSubmit={submitForgot}>
                  <label>Email
                    <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </label>
                  {error && <p style={{ color: '#ff7777', fontSize: 12 }}>{error}</p>}
                  <button className="btn blue" disabled={loading}>{loading ? 'Sending…' : 'Send reset link →'}</button>
                </form>
              )}
              <p className="muted" style={{ marginTop: 16 }}>
                <a href="#" onClick={(e) => { e.preventDefault(); setMode('signin'); setError(''); setResetSent(false); }}>← Back to log in</a>
              </p>
            </>
          ) : (
            <>
              <h1 style={{ marginTop: 20 }}>{mode === 'signup' ? 'Create your account.' : 'Welcome back.'}</h1>
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
                {mode === 'signin' && (
                  <p style={{ margin: '-8px 0 0', textAlign: 'right' }}>
                    <a href="#" onClick={(e) => { e.preventDefault(); setMode('forgot'); setError(''); }} style={{ fontSize: 12, color: 'var(--muted)' }}>Forgot password?</a>
                  </p>
                )}
                {error && <p style={{ color: '#ff7777', fontSize: 12 }}>{error}</p>}
                <button className="btn blue" disabled={loading}>
                  {loading ? 'Please wait…' : mode === 'signup' ? 'Create account →' : 'Sign in →'}
                </button>
              </form>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
