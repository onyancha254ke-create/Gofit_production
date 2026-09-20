import Stripe from 'stripe';
import { getSupabaseAdminClient } from '../../lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  // The client sends its own access token explicitly (see lib/supabaseClient.js
  // getAccessToken) instead of relying on a session cookie reaching this API
  // route — cookie-based session sync between the browser and API routes
  // proved unreliable in this deployment, so token-in-header is used instead.
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Sign in required' });

  const admin = getSupabaseAdminClient();
  const { data: { user }, error: authError } = await admin.auth.getUser(token);
  if (authError || !user) return res.status(401).json({ error: 'Sign in required' });

  const { items } = req.body; // [{ product_id, quantity }]
  if (!Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: 'Cart is empty' });
  }

  const ids = items.map((i) => i.product_id);
  const { data: products, error } = await admin
    .from('products')
    .select('id,name,price,stock')
    .in('id', ids);
  if (error) return res.status(500).json({ error: error.message });

  for (const item of items) {
    const p = products.find((p) => p.id === item.product_id);
    if (!p) return res.status(400).json({ error: 'Unknown product' });
    if (item.quantity > p.stock) {
      return res.status(400).json({ error: `Only ${p.stock} of "${p.name}" left in stock.` });
    }
  }

  // Prices are re-read from the database here, never trusted from the client,
  // so a tampered request body can't change what actually gets charged.
  const line_items = items.map((item) => {
    const p = products.find((p) => p.id === item.product_id);
    return {
      price_data: {
        currency: 'usd',
        product_data: { name: p.name },
        unit_amount: Math.round(p.price * 100),
      },
      quantity: item.quantity,
    };
  });

  const total = items.reduce((sum, item) => {
    const p = products.find((p) => p.id === item.product_id);
    return sum + p.price * item.quantity;
  }, 0);

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({ customer_id: user.id, total, currency: 'usd', status: 'Pending' })
    .select()
    .single();
  if (orderErr) return res.status(500).json({ error: orderErr.message });

  await admin.from('order_items').insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: products.find((p) => p.id === item.product_id).price,
    }))
  );

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items,
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/order-success?order=${order.id}`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/checkout`,
    metadata: { order_id: order.id },
  });

  await admin.from('orders').update({ stripe_session_id: checkoutSession.id }).eq('id', order.id);

  res.status(200).json({ url: checkoutSession.url });
}
