import { useEffect, useState } from 'react';
import { getSupabaseBrowserClient } from '../../lib/supabaseClient';
import AdminLayout from '../../components/AdminLayout';

const money = (n) => '$' + Number(n).toFixed(2);

export default function AdminProducts() {
  const supabase = getSupabaseBrowserClient();
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({ name: '', category: 'Coffee', price: '', description: '' });
  const [file, setFile] = useState(null);
  const [saving, setSaving] = useState(false);

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
      // Uploads straight to cloud storage under the admin's authenticated
      // session — the 'product-images' bucket's storage policy (set in the
      // Supabase dashboard) only allows writes from role = 'admin'.
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
      image_url,
    });
    setSaving(false);
    if (error) return alert(error.message);
    setForm({ name: '', category: 'Coffee', price: '', description: '' });
    setFile(null);
    load();
  }

  async function deleteProduct(id) {
    if (!confirm('Delete this product?')) return;
    await supabase.from('products').delete().eq('id', id);
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
        <div className="panel-head"><h2>Products</h2></div>
        {products.map((p) => (
          <div className="row" key={p.id}>
            <div><b>{p.name}</b><small>{p.category} • {money(p.price)}</small></div>
            <button className="mini danger" onClick={() => deleteProduct(p.id)}>Delete</button>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
