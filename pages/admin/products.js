import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

const money = (n) => '$' + Number(n).toFixed(2);

export default function AdminProducts() {
  const supabase = getSupabaseBrowserClient();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'Coffee', price: '', description: '', stock: '100' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);
  const [stockEdits, setStockEdits] = useState({}); // { productId: newStockValue }

  async function load() {
    const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false });
    setProducts(data || []);
  }
  useEffect(() => { load(); }, []);

  async function addProduct(e) {
    e.preventDefault();
    setSaving(true);
    let image_url = null;

    if (file) {
      const path = `${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from('product-images').upload(path, file);
      if (upErr) { setSaving(false); return alert(upErr.message); }
      const { data } = supabase.storage.from('product-images').getPublicUrl(path);
      image_url = data.publicUrl;
    }

    const { error } = await supabase.from('products').insert({
      name: form.name,
      category: form.category,
      price: Number(form.price),
      description: form.description,
      stock: Number(form.stock) || 0,
      image_url,
    });
    setSaving(false);
    if (error) return alert(error.message);
    setForm({ name: '', category: 'Coffee', price: '', description: '', stock: '100' });
    setFile(null);
    load();
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
    load();
  }

  async function saveStock(id) {
    const value = stockEdits[id];
    if (value === undefined || value === '') return;
    const { error } = await supabase.from('products').update({ stock: Number(value) }).eq('id', id);
    if (error) return alert(error.message);
    setStockEdits((prev) => { const next = { ...prev }; delete next[id]; return next; });
    load();
  }

  return (
    <AdminLayout active="products">
      <div className="panel">
        <div className="panel-head"><h2>Add product</h2></div>
        <form className="form-grid" onSubmit={addProduct}>
          <label>Name
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </label>
          <label>Category
            <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option>Coffee</option><option>Training</option><option>Meal Plans</option>
            </select>
          </label>
          <label>Price (USD)
            <input type="number" min="0.01" step="0.01" value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </label>
          <label>Starting stock
            <input type="number" min="0" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} />
          </label>
          <label>Photo
            <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
          </label>
          <label style={{ gridColumn: '1 / -1' }}>Description
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <button className="btn blue" disabled={saving} style={{ gridColumn: '1 / -1' }}>
            {saving ? 'Saving…' : '＋ Add product'}
          </button>
        </form>
      </div>
      <div className="panel">
        <div className="panel-head"><h2>Products & Inventory</h2></div>
        {products.map((p) => (
          <div className="row" key={p.id}>
            <div>
              <b>{p.name}</b>
              <small>
                {p.category} • {money(p.price)}
                {p.stock <= 0 && <span style={{ color: '#ff6b6b', fontWeight: 700 }}> · OUT OF STOCK</span>}
                {p.stock > 0 && p.stock <= p.low_stock_threshold && <span style={{ color: '#f0b24b', fontWeight: 700 }}> · Low stock ({p.stock})</span>}
              </small>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="number"
                placeholder={String(p.stock)}
                value={stockEdits[p.id] ?? ''}
                onChange={(e) => setStockEdits((prev) => ({ ...prev, [p.id]: e.target.value }))}
                style={{ width: 70, padding: 6, borderRadius: 6, border: '1px solid var(--line)', background: 'var(--panel2)', color: '#fff' }}
              />
              <button className="mini" onClick={() => saveStock(p.id)}>Update</button>
              <button className="mini danger" onClick={() => deleteProduct(p.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
