import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';

function Ring({ pct, label, value }) {
  const r = 45, c = 2 * Math.PI * r;
  const offset = c - (pct / 100) * c;
  return (
    <div style={{ textAlign: 'center' }}>
      <svg width="110" height="110" viewBox="0 0 110 110">
        <circle className="ring-track" cx="55" cy="55" r={r} strokeWidth="9" fill="none" />
        <circle className="ring-fill" cx="55" cy="55" r={r} strokeWidth="9" fill="none"
          strokeDasharray={c} strokeDashoffset={offset} />
      </svg>
      <div style={{ marginTop: -70, fontWeight: 800, fontSize: 20 }}>{value}</div>
      <div style={{ marginTop: 46, color: 'var(--muted)', fontSize: 11 }}>{label}</div>
    </div>
  );
}

export default function ClientDashboard() {
  const supabase = getSupabaseBrowserClient();
  const [data, setData] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const uid = session.user.id;
      const today = new Date().toISOString().slice(0, 10);

      const [workoutRes, mealRes, progressRes, streakRes, bookingRes, msgRes] = await Promise.all([
        supabase.from('client_workouts').select('*, workouts(title, notes)').eq('client_id', uid).eq('scheduled_date', today).maybeSingle(),
        supabase.from('client_meal_plans').select('*, meal_plans(title, daily_calories, protein_g, carbs_g, fat_g)').eq('client_id', uid).eq('active', true).maybeSingle(),
        supabase.from('progress_logs').select('*').eq('client_id', uid).order('log_date', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('client_workouts').select('scheduled_date, completed').eq('client_id', uid).order('scheduled_date', { ascending: false }).limit(14),
        supabase.from('bookings').select('*, availability(slot_date, slot_time)').eq('customer_id', uid).eq('status', 'Approved').order('created_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('messages').select('*, profiles!messages_sender_id_fkey(full_name)').eq('recipient_id', uid).order('created_at', { ascending: false }).limit(3),
      ]);

      let streak = 0;
      const days = streakRes.data || [];
      for (const d of days) { if (d.completed) streak++; else break; }

      setData({
        workout: workoutRes.data,
        meal: mealRes.data,
        progress: progressRes.data,
        streak,
        booking: bookingRes.data,
        messages: msgRes.data || [],
      });
    })();
  }, []);

  if (!data) return <main className="page"><p className="muted">Loading your dashboard…</p></main>;

  const { workout, meal, progress, streak, booking, messages } = data;

  return (
    <main className="dash">
      <aside className="dash-side">
        <p className="eyebrow" style={{ marginBottom: 20 }}>MY GOFIT</p>
        <button className="on">Dashboard</button>
        <Link href="/progress">Progress</Link>
        <Link href="/booking">Book a Session</Link>
        <Link href="/shop">Shop</Link>
        <Link href="/account">Account</Link>
      </aside>
      <section className="dash-main">
        <div className="admin-head">
          <div><p className="eyebrow">TODAY</p><h1>Your Dashboard</h1></div>
        </div>

        <div className="dash-grid">
          <div style={{ display: 'grid', gap: 20 }}>
            <div className="widget">
              <h3>Today's Workout</h3>
              {workout ? (
                <>
                  <p style={{ fontSize: 20, fontWeight: 700, margin: '0 0 6px' }}>{workout.workouts?.title}</p>
                  <p className="muted" style={{ marginBottom: 16 }}>{workout.workouts?.notes}</p>
                  <span className="status">{workout.completed ? 'Completed' : 'Pending'}</span>
                </>
              ) : <p className="muted">No workout scheduled for today. Rest day, or check with your trainer.</p>}
            </div>

            <div className="widget">
              <h3>Today's Meal Plan</h3>
              {meal ? (
                <>
                  <p style={{ fontWeight: 700, marginBottom: 10 }}>{meal.meal_plans?.title}</p>
                  <div className="ring-wrap">
                    <div><b>{meal.meal_plans?.daily_calories || '—'}</b><small style={{ display: 'block', color: 'var(--muted)' }}>kcal target</small></div>
                    <div><b>{meal.meal_plans?.protein_g || '—'}g</b><small style={{ display: 'block', color: 'var(--muted)' }}>protein</small></div>
                    <div><b>{meal.meal_plans?.carbs_g || '—'}g</b><small style={{ display: 'block', color: 'var(--muted)' }}>carbs</small></div>
                    <div><b>{meal.meal_plans?.fat_g || '—'}g</b><small style={{ display: 'block', color: 'var(--muted)' }}>fat</small></div>
                  </div>
                </>
              ) : <p className="muted">No active meal plan. Ask your trainer to assign one.</p>}
            </div>

            <div className="widget">
              <h3>Messages from your Trainer</h3>
              {messages.length ? messages.map((m) => (
                <div className="msg-bubble" key={m.id}>
                  {m.body}
                  <small>{m.profiles?.full_name || 'Trainer'} · {new Date(m.created_at).toLocaleDateString()}</small>
                </div>
              )) : <p className="muted">No messages yet.</p>}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 20 }}>
            <div className="widget" style={{ textAlign: 'center' }}>
              <h3 style={{ textAlign: 'left' }}>Workout Streak</h3>
              <div className="streak-flame">🔥</div>
              <div style={{ fontSize: 32, fontWeight: 800 }}>{streak}</div>
              <div className="muted" style={{ fontSize: 12 }}>day{streak === 1 ? '' : 's'} in a row</div>
            </div>

            <div className="widget">
              <h3>Latest Weigh-In</h3>
              {progress ? (
                <>
                  <div style={{ fontSize: 30, fontWeight: 800 }}>{progress.weight_kg} kg</div>
                  <p className="muted" style={{ fontSize: 12 }}>{new Date(progress.log_date).toLocaleDateString()}</p>
                </>
              ) : <p className="muted">No progress logged yet.</p>}
              <Link href="/progress" style={{ color: 'var(--accent)', fontSize: 12, fontWeight: 600 }}>Log progress / view graph →</Link>
            </div>

            <div className="widget">
              <h3>Upcoming Session</h3>
              {booking ? (
                <>
                  <p style={{ fontWeight: 700 }}>{booking.availability?.slot_date}</p>
                  <p className="muted">{booking.availability?.slot_time}</p>
                </>
              ) : <p className="muted">Nothing booked. <Link href="/booking" style={{ color: 'var(--accent)' }}>Book one →</Link></p>}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
