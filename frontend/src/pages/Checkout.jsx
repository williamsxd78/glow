import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CreditCard, Truck, Lock, ShieldCheck, Tag, ChevronDown, ChevronUp,
  User, Phone, Mail, MapPin, Wallet, Banknote, Check,
} from "lucide-react";
import { useCart } from "../lib/cart";
import { useSettings } from "../lib/hooks";
import { api } from "../lib/api";
import { TID } from "../constants/testIds";
import { statesFor, pincodeLabel } from "../lib/regions";
import PayPalButton from "../components/PayPalButton";

const fieldDef = (key, label, placeholder, opts = {}) => ({ key, label, placeholder, ...opts });

const STEP_PILLS = ["Cart", "Shipping", "Payment"];

function Section({ title, step, children }) {
  return (
    <section className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl overflow-hidden">
      <header className="px-5 sm:px-6 py-4 border-b border-ink-500/40 flex items-center gap-3">
        {step && (
          <span className="w-7 h-7 rounded-full bg-amber-500 text-black flex items-center justify-center text-xs font-semibold">{step}</span>
        )}
        <h2 className="font-display text-lg sm:text-xl">{title}</h2>
      </header>
      <div className="p-5 sm:p-6">{children}</div>
    </section>
  );
}

function Field({ label, error, required, children }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-widest text-neutral-400 mb-1.5 block">
        {label} {required && <span className="text-amber-500">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-400 mt-1.5">{error}</p>}
    </div>
  );
}

function Input({ icon: Icon, error, ...props }) {
  return (
    <div className={`relative flex items-center bg-[#161616] border ${error ? "border-red-500/60" : "border-ink-500/70"} rounded-xl transition-all focus-within:border-amber-500 focus-within:shadow-[0_0_0_3px_rgba(255,170,0,0.08)]`}>
      {Icon && <Icon size={16} className="ml-3.5 text-neutral-500" />}
      <input
        {...props}
        className={`flex-1 bg-transparent px-3.5 py-3.5 sm:py-4 text-sm sm:text-[15px] placeholder:text-neutral-600 focus:outline-none ${Icon ? "pl-2.5" : ""}`}
      />
    </div>
  );
}

function PaymentTile({ active, icon: Icon, title, desc, badge, onSelect, "data-testid": testId }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      data-testid={testId}
      className={`text-left w-full p-4 rounded-xl border transition-all relative ${
        active
          ? "border-amber-500 bg-amber-500/[0.06] shadow-[0_0_30px_-10px_rgba(255,170,0,0.4)]"
          : "border-ink-500/60 hover:border-ink-500 bg-[#121212]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 shrink-0 rounded-lg flex items-center justify-center ${active ? "bg-amber-500/15 text-amber-500" : "bg-white/[0.04] text-neutral-400"}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="text-sm font-semibold">{title}</div>
            {badge && <span className="text-[10px] uppercase tracking-widest bg-amber-500/10 text-amber-500 px-1.5 py-0.5 rounded">{badge}</span>}
          </div>
          <div className="text-xs text-neutral-500 mt-0.5">{desc}</div>
        </div>
        <div className={`w-5 h-5 shrink-0 rounded-full border flex items-center justify-center ${active ? "border-amber-500 bg-amber-500 text-black" : "border-ink-500"}`}>
          {active && <Check size={12} />}
        </div>
      </div>
    </button>
  );
}

export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { data: s } = useSettings();
  const nav = useNavigate();

  // restore coupon from session (set in Cart page)
  const [coupon, setCoupon] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("glowcamp_coupon") || "null"); } catch { return null; }
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);

  const [openSummary, setOpenSummary] = useState(false);

  const country = s?.store_country || "US";
  const states = statesFor(country, s?.custom_states || []);

  const [f, setF] = useState({
    full_name: "", phone: "", email: "", address: "", city: "",
    state: states[0]?.[0] || "", pincode: "", landmark: "", payment_method: "card", notes: "",
    card_name: "", card_number: "", card_exp: "", card_cvv: "",
  });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null); // when PayPal is selected we create order first

  // Re-validate coupon if subtotal changes
  useEffect(() => {
    if (!coupon) return;
    api.post("/coupons/validate", { code: coupon.code, subtotal })
      .then(({ data }) => setCoupon(data))
      .catch(() => { setCoupon(null); sessionStorage.removeItem("glowcamp_coupon"); });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtotal]);

  if (items.length === 0 && !createdOrder) {
    return (
      <main className="min-h-[60vh] flex items-center justify-center px-4 pb-32">
        <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-10 text-center max-w-md w-full">
          <p className="text-neutral-300 mb-5">No items to checkout.</p>
          <button onClick={() => nav("/")} className="btn-primary">Back to shop</button>
        </div>
      </main>
    );
  }

  const discount = coupon ? coupon.discount : 0;
  const discounted = Math.max(0, subtotal - discount);
  const freeShipThreshold = s?.free_shipping_threshold || 50;
  const shippingCharge = s?.shipping_charge || 5;
  const shipping = discounted === 0 ? 0 : discounted >= freeShipThreshold ? 0 : shippingCharge;
  const total = discounted + shipping;

  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));
  const clearErr = (k) => () => setErr((x) => { const c = { ...x }; delete c[k]; return c; });

  function validate() {
    const e = {};
    if (!f.full_name.trim()) e.full_name = "Please enter your name";
    if (!f.phone.trim() || f.phone.replace(/\D/g, "").length < 7) e.phone = "Enter a valid phone number";
    if (!f.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = "Enter a valid email";
    if (!f.address.trim()) e.address = "Address is required";
    if (!f.city.trim()) e.city = "City is required";
    if (!f.state) e.state = "Select your state";
    if (!f.pincode.trim()) e.pincode = `${pincodeLabel(country)} is required`;
    if (f.payment_method === "card") {
      if (!f.card_name.trim()) e.card_name = "Name on card required";
      if (!f.card_number.trim() || f.card_number.replace(/\s/g, "").length < 12) e.card_number = "Enter a valid card number";
      if (!f.card_exp.trim() || !/^\d{2}\/\d{2}$/.test(f.card_exp)) e.card_exp = "MM/YY";
      if (!f.card_cvv.trim() || f.card_cvv.length < 3) e.card_cvv = "CVV";
    }
    setErr(e);
    return Object.keys(e).length === 0;
  }

  async function applyCouponInline(e) {
    e.preventDefault();
    if (!couponCode.trim()) return;
    setCouponBusy(true);
    try {
      const { data } = await api.post("/coupons/validate", { code: couponCode.trim(), subtotal });
      setCoupon(data);
      sessionStorage.setItem("glowcamp_coupon", JSON.stringify(data));
      setCouponCode("");
      toast.success(`Coupon ${data.code} applied`);
    } catch (err2) {
      toast.error(err2?.response?.data?.detail || "Invalid coupon");
    } finally {
      setCouponBusy(false);
    }
  }

  async function placeOrder(paymentOverride) {
    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return null;
    }
    setBusy(true);
    try {
      const payload = {
        full_name: f.full_name, phone: f.phone, email: f.email, address: f.address,
        city: f.city, state: f.state, pincode: f.pincode, landmark: f.landmark,
        payment_method: paymentOverride || f.payment_method,
        notes: f.notes,
        coupon_code: coupon?.code || "",
        items: items.map((it) => ({
          offer_key: it.offer_key, title: it.title, quantity: it.quantity,
          unit_price: it.unit_price, line_total: it.unit_price * it.quantity,
        })),
      };
      const { data } = await api.post("/orders", payload);
      return data;
    } catch (err2) {
      toast.error(err2?.response?.data?.detail || "Failed to place order");
      return null;
    } finally {
      setBusy(false);
    }
  }

  async function submitNonPaypal(e) {
    e.preventDefault();
    const order = await placeOrder();
    if (!order) return;
    sessionStorage.removeItem("glowcamp_coupon");
    clear();
    nav(`/thank-you/${order.order_number}`, { state: { order } });
  }

  // PayPal: create order first, then render buttons
  async function startPaypal() {
    if (createdOrder) return;
    const order = await placeOrder("paypal");
    if (order) setCreatedOrder(order);
  }

  async function onPaypalApproved({ captureId, payerEmail }) {
    try {
      await api.post(`/orders/${createdOrder.id}/paypal-capture`, { capture_id: captureId, payer_email: payerEmail });
      sessionStorage.removeItem("glowcamp_coupon");
      clear();
      nav(`/thank-you/${createdOrder.order_number}`, { state: { order: { ...createdOrder, payment_status: "paid" } } });
    } catch (e) {
      toast.error("Capture failed - please contact support");
    }
  }

  const pm = s?.payment_options || {};
  const methods = [
    pm.stripe && { v: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Visa, Mastercard, Amex" },
    pm.paypal && { v: "paypal", label: "PayPal", icon: Wallet, desc: "Pay with your PayPal balance", badge: "Popular" },
    pm.cod && { v: "cod", label: "Cash on Delivery", icon: Banknote, desc: "Pay when it arrives" },
    pm.razorpay && { v: "razorpay", label: "Razorpay", icon: CreditCard, desc: "UPI / cards / netbanking" },
    pm.manual_upi && { v: "manual_upi", label: "Manual UPI", icon: CreditCard, desc: `Send to ${s.payment_options.manual_upi_id || "UPI ID"}` },
  ].filter(Boolean);

  // If only Stripe disabled add a fallback "Card (test)" so user can always check out
  if (!methods.find((m) => m.v === "card")) {
    methods.unshift({ v: "card", label: "Credit / Debit Card", icon: CreditCard, desc: "Demo card form (test)" });
  }

  const fmtCardNumber = (v) => v.replace(/\D/g, "").slice(0, 19).replace(/(\d{4})(?=\d)/g, "$1 ");
  const fmtExp = (v) => v.replace(/\D/g, "").slice(0, 4).replace(/^(\d{2})(\d)/, "$1/$2");

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-10 pb-40 sm:pb-32">
      <div className="mb-6 sm:mb-8">
        <h1 className="font-display text-3xl sm:text-4xl mb-1">Secure Checkout</h1>
        <p className="text-xs sm:text-sm text-neutral-500 flex items-center gap-1.5">
          <Lock size={12} className="text-amber-500" /> Encrypted & secure
        </p>
      </div>

      {/* progress pills */}
      <div className="flex items-center gap-2 sm:gap-3 mb-6 sm:mb-8">
        {STEP_PILLS.map((p, i) => {
          const active = i === 1;
          const done = i === 0;
          return (
            <React.Fragment key={p}>
              <div className={`flex items-center gap-2 text-xs sm:text-sm ${active ? "text-amber-500" : done ? "text-neutral-300" : "text-neutral-600"}`}>
                <span className={`w-6 h-6 rounded-full border flex items-center justify-center text-[11px] font-semibold ${active ? "border-amber-500 bg-amber-500/15" : done ? "border-neutral-400 bg-neutral-400 text-black" : "border-ink-500"}`}>
                  {done ? <Check size={12} /> : i + 1}
                </span>
                <span className="font-medium">{p}</span>
              </div>
              {i < STEP_PILLS.length - 1 && <div className={`flex-1 h-px ${done ? "bg-neutral-400/60" : active ? "bg-amber-500/40" : "bg-ink-500/40"}`} />}
            </React.Fragment>
          );
        })}
      </div>

      {/* Mobile order summary collapsible */}
      <div className="lg:hidden mb-5">
        <button
          onClick={() => setOpenSummary((x) => !x)}
          className="w-full bg-[#0E0E0E] border border-ink-500/60 rounded-xl px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm flex items-center gap-2">
            <Tag size={14} className="text-amber-500" />
            {openSummary ? "Hide order summary" : "Show order summary"}
          </span>
          <span className="flex items-center gap-2">
            <span className="font-display text-base text-amber-500">${total.toFixed(2)}</span>
            {openSummary ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </button>
        {openSummary && <div className="mt-3"><SummaryCard {...{ items, s, subtotal, discount, shipping, total, coupon, couponCode, setCouponCode, applyCouponInline, couponBusy }} /></div>}
      </div>

      <form onSubmit={submitNonPaypal} className="grid lg:grid-cols-[1fr_400px] gap-6 lg:gap-8">
        <div className="space-y-5">
          {/* Shipping */}
          <Section title="Contact & Shipping" step={1}>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Full Name" required error={err.full_name}>
                <Input icon={User} placeholder="Enter your full name" value={f.full_name} onChange={set("full_name")} onFocus={clearErr("full_name")} error={err.full_name} />
              </Field>
              <Field label="Phone Number" required error={err.phone}>
                <Input icon={Phone} placeholder="(555) 123-4567" value={f.phone} onChange={set("phone")} onFocus={clearErr("phone")} error={err.phone} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Email" required error={err.email}>
                  <Input icon={Mail} type="email" placeholder="you@example.com" value={f.email} onChange={set("email")} onFocus={clearErr("email")} error={err.email} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Full Address" required error={err.address}>
                  <Input icon={MapPin} placeholder="House #, Street, Area" value={f.address} onChange={set("address")} onFocus={clearErr("address")} error={err.address} />
                </Field>
              </div>
              <Field label="City" required error={err.city}>
                <Input placeholder="City" value={f.city} onChange={set("city")} onFocus={clearErr("city")} error={err.city} />
              </Field>
              <Field label="State" required error={err.state}>
                <div className="relative bg-[#161616] border border-ink-500/70 rounded-xl focus-within:border-amber-500">
                  <select value={f.state} onChange={set("state")} className="appearance-none w-full bg-transparent px-3.5 py-3.5 sm:py-4 text-sm focus:outline-none pr-8">
                    {states.map(([code, name]) => <option key={code} value={code} className="bg-[#161616]">{name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 pointer-events-none" />
                </div>
              </Field>
              <Field label={pincodeLabel(country)} required error={err.pincode}>
                <Input placeholder={country === "IN" ? "560001" : "94103"} value={f.pincode} onChange={set("pincode")} onFocus={clearErr("pincode")} error={err.pincode} />
              </Field>
              <Field label="Landmark (optional)">
                <Input placeholder="Near park / cafe" value={f.landmark} onChange={set("landmark")} />
              </Field>
              <div className="sm:col-span-2">
                <Field label="Order notes (optional)">
                  <textarea rows={2} value={f.notes} onChange={set("notes")} placeholder="Anything we should know?" className="w-full bg-[#161616] border border-ink-500/70 rounded-xl px-3.5 py-3 text-sm placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none" />
                </Field>
              </div>
            </div>
          </Section>

          {/* Payment */}
          <Section title="Payment Method" step={2}>
            <div className="space-y-2.5">
              {methods.map((m) => (
                <PaymentTile
                  key={m.v}
                  active={f.payment_method === m.v}
                  icon={m.icon}
                  title={m.label}
                  desc={m.desc}
                  badge={m.badge}
                  onSelect={() => setF((x) => ({ ...x, payment_method: m.v }))}
                  data-testid={`pm-${m.v}`}
                />
              ))}
            </div>

            {f.payment_method === "card" && (
              <div className="mt-5 grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <Field label="Name on Card" required error={err.card_name}>
                    <Input placeholder="As printed on card" value={f.card_name} onChange={set("card_name")} onFocus={clearErr("card_name")} error={err.card_name} />
                  </Field>
                </div>
                <div className="sm:col-span-2">
                  <Field label="Card Number" required error={err.card_number}>
                    <Input icon={CreditCard} placeholder="1234 1234 1234 1234" value={f.card_number} onChange={(e) => setF((x) => ({ ...x, card_number: fmtCardNumber(e.target.value) }))} onFocus={clearErr("card_number")} error={err.card_number} />
                  </Field>
                </div>
                <Field label="Expiry (MM/YY)" required error={err.card_exp}>
                  <Input placeholder="12/27" value={f.card_exp} onChange={(e) => setF((x) => ({ ...x, card_exp: fmtExp(e.target.value) }))} onFocus={clearErr("card_exp")} error={err.card_exp} />
                </Field>
                <Field label="CVV" required error={err.card_cvv}>
                  <Input placeholder="123" type="password" maxLength={4} value={f.card_cvv} onChange={(e) => setF((x) => ({ ...x, card_cvv: e.target.value.replace(/\D/g, "").slice(0, 4) }))} onFocus={clearErr("card_cvv")} error={err.card_cvv} />
                </Field>
                <p className="sm:col-span-2 text-[11px] text-amber-500/70 bg-amber-500/5 border border-amber-500/15 rounded-lg p-3">
                  This card form is in demo mode for testing. Your card details are not transmitted to any processor. Configure Stripe in admin to enable live card capture.
                </p>
              </div>
            )}

            {f.payment_method === "paypal" && (
              <div className="mt-5">
                {!createdOrder ? (
                  <button
                    type="button"
                    onClick={startPaypal}
                    disabled={busy}
                    className="btn-primary w-full justify-center"
                  >
                    {busy ? "Preparing PayPal..." : "Continue to PayPal"}
                  </button>
                ) : (
                  <PayPalButton
                    clientId={s?.paypal_client_id}
                    amount={total}
                    onApproved={onPaypalApproved}
                    onError={() => toast.error("PayPal error - please try another method")}
                  />
                )}
                <p className="mt-3 text-[11px] text-neutral-500">
                  You'll be redirected to PayPal Smart Checkout. After approval you'll return here automatically.
                </p>
              </div>
            )}

            {f.payment_method === "manual_upi" && s?.payment_options?.manual_upi_id && (
              <div className="mt-5 bg-amber-500/5 border border-amber-500/20 rounded-xl p-4 text-sm">
                <div className="text-xs text-amber-500 mb-1 tracking-widest uppercase">UPI Pay</div>
                Send ${total.toFixed(2)} to <span className="font-mono text-amber-500">{s.payment_options.manual_upi_id}</span> and share the screenshot with our WhatsApp support.
              </div>
            )}
          </Section>

          {/* Submit (hidden for paypal which uses its own buttons after order created) */}
          {f.payment_method !== "paypal" && (
            <div>
              <button
                type="submit"
                disabled={busy}
                data-testid={TID.checkoutSubmit}
                className="btn-primary w-full justify-center text-base sm:text-lg py-4 disabled:opacity-60"
              >
                <Lock size={16} /> {busy ? "Placing order..." : `Place Order Securely · $${total.toFixed(2)}`}
              </button>
              <p className="text-[11px] text-neutral-500 text-center mt-3 flex items-center justify-center gap-1.5">
                <ShieldCheck size={11} /> Your details are encrypted and secure.
              </p>
            </div>
          )}
        </div>

        {/* Desktop summary */}
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <SummaryCard {...{ items, s, subtotal, discount, shipping, total, coupon, couponCode, setCouponCode, applyCouponInline, couponBusy }} />
          </div>
        </aside>
      </form>
    </main>
  );
}

function SummaryCard({ items, s, subtotal, discount, shipping, total, coupon, couponCode, setCouponCode, applyCouponInline, couponBusy }) {
  return (
    <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 sm:p-6 space-y-4">
      <h3 className="font-display text-xl">Order Summary</h3>
      <div className="space-y-3">
        {items.map((it) => (
          <div key={it.offer_key} className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden border border-ink-500/60 shrink-0">
              <img src={s?.product?.main_image} alt={it.title} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{it.title}</div>
              <div className="text-xs text-neutral-500">Qty {it.quantity}</div>
            </div>
            <div className="text-sm">${(it.unit_price * it.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>
      {coupon ? (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2 text-xs flex items-center justify-between">
          <span><span className="text-amber-500 font-semibold">{coupon.code}</span> applied</span>
          <span className="text-amber-500">−${coupon.discount.toFixed(2)}</span>
        </div>
      ) : (
        <form onSubmit={applyCouponInline} className="flex gap-2">
          <input
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            placeholder="Coupon code"
            className="flex-1 bg-[#161616] border border-ink-500/70 rounded-lg px-3 py-2 text-xs font-mono focus:border-amber-500 focus:outline-none"
          />
          <button disabled={couponBusy || !couponCode.trim()} className="text-xs px-3 py-2 rounded-lg border border-ink-500 hover:border-amber-500 disabled:opacity-50">
            Apply
          </button>
        </form>
      )}
      <div className="space-y-2 text-sm border-t border-ink-500/40 pt-3">
        <div className="flex justify-between"><span className="text-neutral-400">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        {discount > 0 && (
          <div className="flex justify-between text-amber-500"><span>Discount</span><span>−${discount.toFixed(2)}</span></div>
        )}
        <div className="flex justify-between"><span className="text-neutral-400">Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
        <div className="flex justify-between font-display text-2xl text-amber-500 pt-3 border-t border-ink-500/40">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[11px] text-neutral-500 pt-1">
        <Truck size={12} className="text-amber-500" /> Estimated delivery: 4-7 business days
      </div>
    </div>
  );
}
