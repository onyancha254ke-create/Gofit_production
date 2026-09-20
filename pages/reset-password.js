import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { getSupabaseBrowserClient } from '../lib/supabaseClient';
import Nav from '../components/Nav';
import Footer from '../components/Footer';

export default function ResetPassword() {
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase puts the person into a temporary "recovery" session when they
    // land here from the emailed link — this event confirms that happened.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setReady(true);
    });
    // In case the event already fired before this listener attached.
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError("Passwords don't match.");
    if (password.length < 8) return setError('Password must be at least 8 characters.');
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return setError(error.message);
    setDone(true);
    setTimeout(() => router.push('/login'), 2500);
  }

  return (
    <>
      <Nav />
      <main className="page narrow">
        <div className="auth">
          <p className="eyebrow">GOFIT ACCOUNT</p>
          <h1>Set a new password.</h1>

          {done ? (
            <p className="muted">Password updated — redirecting you to log in…</p>
          ) : !ready ? (
            <p className="muted">Verifying your reset link…</p>
          ) : (
            <form className="form" onSubmit={submit}>
              <label>New password
                <input type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} required />
              </label>
              <label>Confirm new password
                <input type="password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </label>
              {error && <p style={{ color: '#ff7777', fontSize: 12 }}>{error}</p>}
              <button className="btn blue" disabled={loading}>{loading ? 'Saving…' : 'Update password →'}</button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
