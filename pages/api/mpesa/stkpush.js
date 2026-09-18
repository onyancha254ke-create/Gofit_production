import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';
import { stkPush } from '../../../lib/mpesa';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  const supabase = createPagesServerClient(req, res);
  const { data: { session: authSession } } = await supabase.auth.getSession();
  if (!authSession) return res.status(401).json({ error: 'Sign in required' });

  const { items, phone } = req.body; // items: [{ product_id, quantity }]
  if (!Array.isArray(items) || !items.length) return res.status(400).json({ error: 'Cart is empty' });
  if (!phone || phone.replace(/\D/g, '').length < 9) return res.status(400).json({ error: 'Enter a valid M-Pesa phone number' });

  const admin = getSupabaseAdminClient();
  const ids = items.map((i) => i.product_id);
  const { data: products, error } = await admin.from('products').select('id,name,price_kes,stock').in('id', ids);
  if (error) return res.status(500).json({ error: error.message });

  for (const item of items) {
    const p = products.find((p) => p.id === item.product_id);
    if (!p) return res.status(400).json({ error: 'Unknown product' });
    if (!p.price_kes) return res.status(400).json({ error: `"${p.name}" doesn't have a KES price set yet — pay with card instead, or ask the admin to add one.` });
    if (item.quantity > p.stock) return res.status(400).json({ error: `Only ${p.stock} of "${p.name}" left in stock.` });
  }

  const total = items.reduce((sum, item) => {
    const p = products.find((p) => p.id === item.product_id);
    return sum + p.price_kes * item.quantity;
  }, 0);

  const { data: order, error: orderErr } = await admin
    .from('orders')
    .insert({ customer_id: authSession.user.id, total, currency: 'kes', customer_phone: phone, status: 'Pending' })
    .select()
    .single();
  if (orderErr) return res.status(500).json({ error: orderErr.message });

  await admin.from('order_items').insert(
    items.map((item) => ({
      order_id: order.id,
      product_id: item.product_id,
      quantity: item.quantity,
      unit_price: products.find((p) => p.id === item.product_id).price_kes,
    }))
  );

  try {
    const callbackUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/mpesa/callback?secret=${process.env.MPESA_CALLBACK_SECRET}`;
    const stk = await stkPush({
      phone,
      amount: total,
      accountReference: `GoFit-${order.id.slice(0, 8)}`,
      description: 'GoFit order',
      callbackUrl,
    });
    await admin.from('orders').update({ mpesa_checkout_request_id: stk.CheckoutRequestID }).eq('id', order.id);
    res.status(200).json({ orderId: order.id, checkoutRequestId: stk.CheckoutRequestID });
  } catch (err) {
    await admin.from('orders').update({ status: 'Cancelled' }).eq('id', order.id);
    res.status(500).json({ error: err.message });
  }
}
