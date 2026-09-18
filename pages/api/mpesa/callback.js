import { getSupabaseAdminClient } from '../../../lib/supabaseAdmin';

// Safaricom's callback has no signature to verify (unlike Stripe's webhook),
// so this route relies on a secret query param plus matching a real
// CheckoutRequestID already stored on a pending order — not perfect, but a
// reasonable safeguard for this API's real-world limitations.
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();

  if (req.query.secret !== process.env.MPESA_CALLBACK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const callback = req.body?.Body?.stkCallback;
  if (!callback) return res.status(400).json({ error: 'Malformed callback' });

  const admin = getSupabaseAdminClient();
  const { data: order } = await admin
    .from('orders')
    .select('*')
    .eq('mpesa_checkout_request_id', callback.CheckoutRequestID)
    .single();

  if (!order) {
    // Unknown CheckoutRequestID — acknowledge so Safaricom doesn't retry, but do nothing.
    return res.status(200).json({ received: true });
  }

  if (callback.ResultCode === 0) {
    const items = callback.CallbackMetadata?.Item || [];
    const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;

    await admin.from('orders').update({ status: 'Paid', mpesa_receipt: receipt }).eq('id', order.id);

    // Same stock-decrement logic as the Stripe webhook — only happens on confirmed payment.
    const { data: orderItems } = await admin.from('order_items').select('product_id, quantity').eq('order_id', order.id);
    for (const item of orderItems || []) {
      const { data: product } = await admin.from('products').select('stock').eq('id', item.product_id).single();
      if (product) {
        const newStock = Math.max(0, product.stock - item.quantity);
        await admin.from('products').update({ stock: newStock }).eq('id', item.product_id);
      }
    }
  } else {
    // User cancelled, entered wrong PIN, or timed out — ResultCode is non-zero.
    await admin.from('orders').update({ status: 'Cancelled' }).eq('id', order.id);
  }

  res.status(200).json({ received: true });
}
