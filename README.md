# GoFit — Production Build

This replaces the localStorage-only prototype with a real backend:

| Piece | What's used | Where |
|---|---|---|
| Database | Postgres (Supabase) | `supabase/schema.sql` |
| Auth | Supabase Auth (real signup/login, hashed passwords) | `pages/login.js` |
| Admin gate | Server-side session + role check (not client-side) | `middleware.js` |
| Payments | Stripe Checkout + webhook | `pages/api/checkout.js`, `pages/api/stripe-webhook.js` |
| Image uploads | Supabase Storage | `pages/admin/products.js` |
| Booking calendar | Real availability table + atomic booking function | `pages/booking.js`, `create_booking()` in schema |
| Order management | Live orders table, admin fulfillment UI | `pages/admin/orders.js` |
| Deployment | Vercel + custom domain | see below |

## 1. Set up Supabase (database + auth + storage)
1. Create a project at supabase.com (free tier is fine to start).
2. Open **SQL Editor** → paste the entire contents of `supabase/schema.sql` → Run.
3. Go to **Storage** → create a bucket named `product-images` → set it **public** for reads.
   Under the bucket's policies, add a policy restricting `INSERT`/`UPDATE`/`DELETE` to
   `(select role from profiles where id = auth.uid()) = 'admin'`.
4. Go to **Project Settings → API** and copy: Project URL, `anon` public key, `service_role` key.

## 2. Set up Stripe (payments)
1. Create a Stripe account, switch to **Test mode** while developing.
2. Go to **Developers → API keys** → copy the Secret key and Publishable key.
3. After your first deploy, go to **Developers → Webhooks → Add endpoint**:
   URL = `https://yourdomain.com/api/stripe-webhook`, event = `checkout.session.completed`.
   Copy the **Signing secret** it gives you.

## 3. Configure environment variables
Copy `.env.local.example` to `.env.local` and fill in every value from steps 1–2.
On Vercel, add the same variables under **Project Settings → Environment Variables**
(the `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` must be server-only — never
prefix them with `NEXT_PUBLIC_`, or they'd be shipped to every visitor's browser).

## 4. Run it locally
```
npm install
npm run dev
```
Visit `http://localhost:3000`. Sign up for an account, then in the Supabase SQL
Editor run:
```sql
update public.profiles set role = 'admin' where email = 'you@example.com';
```
That's your only admin account — promote any other staff the same way.

## 5. Seed booking availability
Bookings pull from a real calendar table, so add some open slots:
```sql
insert into public.availability (slot_date, slot_time)
values ('2026-09-22','08:00'), ('2026-09-22','18:00'), ('2026-09-23','10:00');
```
In the real product, build a small admin page for this the same way `pages/admin/products.js`
manages products — the pattern is identical (insert/select/delete against `availability`).

## 6. Deploy
1. Push this project to a GitHub repo.
2. Import it at vercel.com → New Project → select the repo.
3. Add the environment variables from step 3.
4. Deploy. Vercel gives you a `.vercel.app` URL immediately.
5. **Custom domain**: Project → Settings → Domains → add `yourgofitdomain.com` →
   follow the DNS records it shows you (usually one A record + one CNAME) at your
   domain registrar. HTTPS is issued automatically.
6. Go back to Stripe's webhook settings and make sure the endpoint URL points at
   your real domain, not `localhost`.

## What's intentionally left for you to finish
- **Admin availability UI** — currently you seed slots via SQL; a simple CRUD page
  (copy `pages/admin/products.js`'s pattern) turns this into a click-based calendar.
- **Email/SMS notifications** — hook a provider (Resend, Postmark, Twilio) into the
  webhook handler and the `create_booking` flow to notify the trainer and customer.
- **Refunds/cancellations** — add a Stripe refund call plus an order status of `Refunded`.
- **Rate limiting on `/api/checkout`** — add if you're worried about abuse at scale.

## Files carried over unchanged
`styles/globals.css` is your original GoFit visual system — no design changes were made,
only the data layer underneath it.
