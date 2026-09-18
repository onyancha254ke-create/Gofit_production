import { createContext, useContext, useState } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState([]); // [{ product_id, name, price, price_kes, image_url, qty }]
  const [currency, setCurrency] = useState('usd'); // 'usd' (Stripe) or 'kes' (M-Pesa)

  function addItem(product) {
    setItems((prev) => {
      const existing = prev.find((i) => i.product_id === product.id);
      if (existing) {
        return prev.map((i) => (i.product_id === product.id ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...prev, {
        product_id: product.id,
        name: product.name,
        price: product.price,
        price_kes: product.price_kes,
        image_url: product.image_url,
        qty: 1,
      }];
    });
  }

  function changeQty(productId, delta) {
    setItems((prev) => prev
      .map((i) => (i.product_id === productId ? { ...i, qty: i.qty + delta } : i))
      .filter((i) => i.qty > 0));
  }

  function removeItem(productId) {
    setItems((prev) => prev.filter((i) => i.product_id !== productId));
  }

  function clear() { setItems([]); }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);
  const totalKes = items.reduce((sum, i) => sum + (i.price_kes || 0) * i.qty, 0);
  const allHaveKesPricing = items.length > 0 && items.every((i) => i.price_kes);
  const count = items.reduce((sum, i) => sum + i.qty, 0);

  return (
    <CartContext.Provider value={{
      items, addItem, changeQty, removeItem, clear, total, totalKes, allHaveKesPricing, count,
      currency, setCurrency,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
