import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { CreditCard, Truck, Lock } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../lib/cart";
import { useSettings } from "../lib/hooks";
import { api } from "../lib/api";
import { TID } from "../constants/testIds";

const US_STATES = ["AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY"];

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { data: s } = useSettings();
  const nav = useNavigate();
  const [f, setF] = useState({
    full_name: "", phone: "", email: "", address: "", city: "", state: "CA", pincode: "",
    landmark: "", payment_method: "cod", notes: "",
  });
  const [busy, setBusy] = useState(false);

  if (items.length === 0) {
    return (
      <main className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-10 text-center">
          <p className="text-neutral-400 mb-5">No items to checkout.</p>
          <button onClick={() => nav("/")} className="btn-primary">Back to shop</button>
        </div>
      </main>
    );
  }

  const shipping = !s ? 0 : subtotal >= s.free_shipping_threshold ? 0 : s.shipping_charge;
  const total = subtotal + shipping;

  const change = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (!f.full_name || !f.phone || !f.email || !f.address || !f.city || !f.state || !f.pincode) {
      toast.error("Please fill all required fields");
      return;
    }
    setBusy(true);
    try {
      const payload = {
        ...f,
        items: items.map((it) => ({
          offer_key: it.offer_key,
          title: it.title,
          quantity: it.quantity,
          unit_price: it.unit_price,
          line_total: it.unit_price * it.quantity,
        })),
      };
      const { data } = await api.post("/orders", payload);
      clear();
      nav(`/thank-you/${data.order_number}`, { state: { order: data } });
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to place order");
    } finally {
      setBusy(false);
    }
  }

  const pm = s?.payment_options || {};
  const methods = [
    pm.cod && { v: "cod", label: "Cash on Delivery", icon: Truck, hint: "Pay when it arrives" },
    pm.paypal && { v: "paypal", label: "PayPal", icon: CreditCard, hint: "Secure online payment" },
    pm.stripe && { v: "stripe", label: "Credit / Debit Card", icon: CreditCard, hint: "Stripe checkout" },
    pm.razorpay && { v: "razorpay", label: "Razorpay", icon: CreditCard, hint: "UPI, cards, netbanking" },
    pm.manual_upi && { v: "manual_upi", label: "Manual UPI", icon: CreditCard, hint: "Pay via UPI ID" },
  ].filter(Boolean);

  const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-4 py-3 text-sm w-full focus:border-amber-500 focus:outline-none transition";

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-24">
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Checkout</h1>
      <p className="text-sm text-neutral-500 mb-10 flex items-center gap-1.5"><Lock size={12} /> Encrypted & secure</p>
      <form onSubmit={submit} className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-6">
            <h2 className="font-display text-xl mb-5">Contact & Shipping</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input className={inputCls} placeholder="Full Name *" value={f.full_name} onChange={change("full_name")} required />
              <input className={inputCls} placeholder="Phone *" value={f.phone} onChange={change("phone")} required />
              <input type="email" className={`${inputCls} sm:col-span-2`} placeholder="Email *" value={f.email} onChange={change("email")} required />
              <input className={`${inputCls} sm:col-span-2`} placeholder="Full Address *" value={f.address} onChange={change("address")} required />
              <input className={inputCls} placeholder="City *" value={f.city} onChange={change("city")} required />
              <select className={inputCls} value={f.state} onChange={change("state")}>
                {US_STATES.map((st) => <option key={st} value={st}>{st}</option>)}
              </select>
              <input className={inputCls} placeholder="ZIP / Pincode *" value={f.pincode} onChange={change("pincode")} required />
              <input className={inputCls} placeholder="Landmark (optional)" value={f.landmark} onChange={change("landmark")} />
              <textarea rows={2} className={`${inputCls} sm:col-span-2`} placeholder="Order notes (optional)" value={f.notes} onChange={change("notes")} />
            </div>
          </section>

          <section className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-6">
            <h2 className="font-display text-xl mb-5">Payment Method</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {methods.map((m) => {
                const Icon = m.icon;
                const active = f.payment_method === m.v;
                return (
                  <label key={m.v} className={`cursor-pointer flex items-start gap-3 p-4 rounded-xl border transition ${active ? "border-amber-500 bg-amber-500/5" : "border-ink-500/60 hover:border-ink-500"}`}>
                    <input type="radio" name="pm" value={m.v} checked={active} onChange={change("payment_method")} className="mt-1 accent-amber-500" />
                    <Icon size={18} className={active ? "text-amber-500" : "text-neutral-400"} />
                    <div>
                      <div className="text-sm font-medium">{m.label}</div>
                      <div className="text-xs text-neutral-500">{m.hint}</div>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="mt-4 text-[11px] text-neutral-500">
              Online gateways are currently in test mode — order will be created and our team will reach out to confirm payment.
            </p>
          </section>
        </div>

        <aside className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-6 h-fit space-y-3 sticky top-20">
          <h3 className="font-display text-xl mb-2">Summary</h3>
          {items.map((it) => (
            <div key={it.offer_key} className="flex justify-between text-sm">
              <span className="text-neutral-300">{it.title} × {it.quantity}</span>
              <span>${(it.unit_price * it.quantity).toFixed(2)}</span>
            </div>
          ))}
          <div className="border-t border-ink-500/60 pt-3 space-y-2">
            <div className="flex justify-between text-sm"><span className="text-neutral-400">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-neutral-400">Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
            <div className="flex justify-between font-display text-xl pt-2"><span>Total</span><span>${total.toFixed(2)}</span></div>
          </div>
          <button type="submit" disabled={busy} data-testid={TID.checkoutSubmit} className="btn-primary w-full justify-center mt-4 disabled:opacity-60">
            {busy ? "Placing..." : "Place Order"}
          </button>
        </aside>
      </form>
    </main>
  );
}
