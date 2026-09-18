import Stripe from 'stripe';
import { buffer } from 'micro';
import { getSupabaseAdminClient } from '../../lib/supabaseAdmin';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Stripe requires the raw, unparsed request body to verify the signature.
export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const sig = req.headers['stripe-signature'];
  const rawBody = await buffer(req);

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // Signature didn't match — reject. This is what stops anyone from faking
    // a "payment succeeded" call by hitting this URL directly.
    return res.status(400).send(`Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const admin = getSupabaseAdminClient();

    const { data: order } = await admin
      .from('orders')
      .update({ status: 'Paid' })
      .eq('stripe_session_id', session.id)
      .select()
      .single();

    if (order) {
      // Stock only moves once here, when payment is actually confirmed —
      // never at checkout-start, so an abandoned Stripe session can't
      // wrongly reduce inventory.
      const { data: items } = await admin
        .from('order_items')
        .select('product_id, quantity')
        .eq('order_id', order.id);

      for (const item of items || []) {
        const { data: product } = await admin.from('products').select('stock').eq('id', item.product_id).single();
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await admin.from('products').update({ stock: newStock }).eq('id', item.product_id);
        }
      }
    }
  }

  res.status(200).json({ received: true });
}
