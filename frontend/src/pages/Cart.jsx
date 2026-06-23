import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "../lib/cart";
import { useSettings } from "../lib/hooks";
import { TID } from "../constants/testIds";

export default function Cart() {
  const { items, setQty, remove, subtotal } = useCart();
  const { data: s } = useSettings();
  const nav = useNavigate();
  const shipping = !s ? 0 : subtotal >= s.free_shipping_threshold || subtotal === 0 ? 0 : s.shipping_charge;
  const total = subtotal + shipping;

  return (
    <main data-testid={TID.cartPage} className="min-h-[70vh] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
      <h1 className="font-display text-3xl sm:text-4xl mb-10">Your Cart</h1>
      {items.length === 0 ? (
        <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-12 text-center">
          <p className="text-neutral-400 mb-6">Your cart is empty.</p>
          <Link to="/" className="btn-primary inline-flex">Discover GlowCamp</Link>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-3">
            {items.map((it) => (
              <div key={it.offer_key} className="flex items-center gap-4 bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-4">
                <img src={s?.product?.main_image} alt={it.title} className="w-16 h-16 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <div className="font-display text-base">{it.title}</div>
                  <div className="text-xs text-neutral-500">${it.unit_price.toFixed(2)} each</div>
                </div>
                <div className="flex items-center border border-ink-500 rounded-full">
                  <button onClick={() => setQty(it.offer_key, it.quantity - 1)} className="px-3 py-1.5 hover:text-amber-500"><Minus size={14} /></button>
                  <span className="w-6 text-center text-sm">{it.quantity}</span>
                  <button onClick={() => setQty(it.offer_key, it.quantity + 1)} className="px-3 py-1.5 hover:text-amber-500"><Plus size={14} /></button>
                </div>
                <div className="w-16 text-right text-sm">${(it.unit_price * it.quantity).toFixed(2)}</div>
                <button onClick={() => remove(it.offer_key)} className="text-neutral-500 hover:text-red-400 ml-1"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <aside className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-6 h-fit space-y-3">
            <h3 className="font-display text-xl mb-2">Order Summary</h3>
            <div className="flex justify-between text-sm"><span className="text-neutral-400">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-neutral-400">Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
            <div className="border-t border-ink-500/60 pt-3 flex justify-between font-display text-xl"><span>Total</span><span>${total.toFixed(2)}</span></div>
            <button onClick={() => nav("/checkout")} className="btn-primary w-full justify-center mt-4">
              Proceed to Checkout <ArrowRight size={16} />
            </button>
            {subtotal < (s?.free_shipping_threshold || 0) && (
              <p className="text-xs text-amber-500/80 text-center mt-2">
                Spend ${((s?.free_shipping_threshold || 0) - subtotal).toFixed(2)} more for free shipping
              </p>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
