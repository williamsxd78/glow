import React, { createContext, useContext, useEffect, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "glowcamp_cart_v1";

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  function add(offer, qty = 1) {
    setItems((cur) => {
      const idx = cur.findIndex((x) => x.offer_key === offer.key);
      if (idx >= 0) {
        const copy = [...cur];
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + qty };
        return copy;
      }
      return [
        ...cur,
        {
          offer_key: offer.key,
          title: offer.title,
          unit_price: offer.price,
          quantity: qty,
        },
      ];
    });
  }

  function setQty(offer_key, quantity) {
    setItems((cur) =>
      cur
        .map((x) => (x.offer_key === offer_key ? { ...x, quantity: Math.max(0, quantity) } : x))
        .filter((x) => x.quantity > 0)
    );
  }

  function remove(offer_key) {
    setItems((cur) => cur.filter((x) => x.offer_key !== offer_key));
  }

  function clear() { setItems([]); }

  const subtotal = items.reduce((s, x) => s + x.unit_price * x.quantity, 0);
  const totalQty = items.reduce((s, x) => s + x.quantity, 0);

  return (
    <CartContext.Provider value={{ items, add, setQty, remove, clear, subtotal, totalQty }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
