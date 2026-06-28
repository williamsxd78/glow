import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  CreditCard, Lock, ShieldCheck, ChevronDown, ChevronUp, Check, Truck, Wallet, Banknote, Info,
} from "lucide-react";
import { useCart } from "../lib/cart";
import { useSettings } from "../lib/hooks";
import { api, apiErrorMessage, resolveImageUrl } from "../lib/api";
import { TID } from "../constants/testIds";
import { statesFor, pincodeLabel } from "../lib/regions";
import PayPalButton from "../components/PayPalButton";
import PaymentProcessing from "../components/PaymentProcessing";
import CheckoutHeader from "../components/CheckoutHeader";

/**
 * Apply a format mask to a digits-only string.
 *
 * Behavior:
 *   - If the mask contains any `#` characters, ONLY `#` is treated as a digit slot;
 *     literal digits in the mask (e.g. the `1` in `+1 (###) ### - ####`) are kept as-is.
 *   - Otherwise (no `#` in mask), every digit in the mask is treated as a slot — this
 *     lets the admin paste a sample phone number directly: `+1 (617) - 377 - 3737`.
 */
function applyMask(digits, mask) {
  if (!mask) return digits;
  const d = String(digits).replace(/\D/g, "");
  if (!d) return "";
  const hasHash = mask.includes("#");
  const isSlot = (ch) => (hasHash ? ch === "#" : /\d/.test(ch));
  let out = "";
  let di = 0;
  for (const ch of mask) {
    if (isSlot(ch)) {
      if (di >= d.length) break;
      out += d[di++];
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * Inverse of applyMask — pull the user-typed digits back out of a formatted value
 * by walking the mask in parallel. Literal digits in the mask are skipped.
 */
function extractSlotDigits(formatted, mask) {
  const text = String(formatted || "");
  if (!mask) return text.replace(/\D/g, "");
  const hasHash = mask.includes("#");
  if (!hasHash) return text.replace(/\D/g, "");
  let out = "";
  let fi = 0;
  for (const mc of mask) {
    if (mc === "#") {
      while (fi < text.length && !/\d/.test(text[fi])) fi++;
      if (fi >= text.length) break;
      out += text[fi++];
    } else {
      // best-effort: advance past matching literal if present
      if (fi < text.length && text[fi] === mc) fi++;
    }
  }
  return out;
}

/* ============================== Floating Label Input ============================== */
function FloatInput({ id, label, error, hint, ...rest }) {
  return (
    <div className="w-full">
      <div
        className={`relative bg-white border rounded-lg transition-all ${
          error ? "border-red-500/70" : "border-[#8C9196] focus-within:border-amber-500"
        }`}
      >
        <input
          id={id}
          placeholder=" "
          {...rest}
          className="peer w-full h-14 bg-transparent px-3.5 pt-5 pb-1 text-[15px] text-[#202223] placeholder-transparent focus:outline-none"
        />
        <label
          htmlFor={id}
          className="absolute left-3.5 top-1.5 text-[10px] uppercase tracking-widest text-[#8C9196]
                     peer-placeholder-shown:top-1/2 peer-placeholder-shown:-translate-y-1/2 peer-placeholder-shown:text-sm peer-placeholder-shown:normal-case peer-placeholder-shown:tracking-normal peer-placeholder-shown:text-[#8C9196]
                     peer-focus:top-1.5 peer-focus:translate-y-0 peer-focus:text-[10px] peer-focus:uppercase peer-focus:tracking-widest peer-focus:text-amber-500
                     transition-all pointer-events-none"
        >
          {label}
        </label>
      </div>
      {error ? <p className="text-xs text-red-400 mt-1.5 px-1">{error}</p> : hint ? <p className="text-[11px] text-[#8C9196] mt-1.5 px-1">{hint}</p> : null}
    </div>
  );
}

function FloatSelect({ id, label, value, onChange, options }) {
  const hasValue = !!value;
  return (
    <div className="relative bg-white border border-[#8C9196] rounded-lg focus-within:border-amber-500 transition-all">
      <select
        id={id}
        value={value}
        onChange={onChange}
        className="peer appearance-none w-full h-14 bg-transparent px-3.5 pt-5 pb-1 text-[15px] text-[#202223] focus:outline-none"
      >
        {options.map(([v, n]) => (
          <option key={v} value={v} className="bg-white">{n}</option>
        ))}
      </select>
      <label
        htmlFor={id}
        className={`absolute left-3.5 top-1.5 text-[10px] uppercase tracking-widest pointer-events-none transition-all ${
          hasValue ? "text-amber-500" : "text-[#8C9196]"
        }`}
      >
        {label}
      </label>
      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8C9196] pointer-events-none" />
    </div>
  );
}

/* ============================== Section ============================== */
function Section({ title, subtitle, children }) {
  return (
    <section className="mb-8">
      <header className="mb-4 flex items-baseline justify-between">
        <h2 className="font-display text-xl sm:text-2xl text-[#202223]">{title}</h2>
        {subtitle && <span className="text-xs text-[#8C9196]">{subtitle}</span>}
      </header>
      <div>{children}</div>
    </section>
  );
}

/* ============================== Step Indicator ============================== */
const STEPS = [
  { label: "Cart", href: "/cart" },
  { label: "Information" },
  { label: "Shipping" },
  { label: "Payment" },
];

function StepIndicator({ current }) {
  return (
    <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-[#8C9196]">
      {STEPS.map((s, i) => {
        const isCurrent = i === current;
        const isPast = i < current;
        return (
          <li key={s.label} className="flex items-center gap-2">
            {s.href ? (
              <Link to={s.href} className="hover:text-amber-500">{s.label}</Link>
            ) : (
              <span className={isCurrent ? "text-[#202223] font-medium" : isPast ? "text-[#6D7175]" : ""}>{s.label}</span>
            )}
            {i < STEPS.length - 1 && <ChevronDown size={11} className="-rotate-90 text-[#C9CCCF]" />}
          </li>
        );
      })}
    </ol>
  );
}

/* ============================== Order Summary ============================== */
function OrderSummary({ items, s, subtotal, discount, shipping, total, coupon, couponCode, setCouponCode, applyCouponInline, removeCoupon, couponBusy }) {
  return (
    <div className="space-y-5">
      {/* Items */}
      <div className="space-y-4">
        {items.map((it) => (
          <div key={it.offer_key} className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-[#E1E3E5] shrink-0 bg-[#F6F6F7]">
              <img src={resolveImageUrl(s?.product?.main_image)} alt={it.title} className="w-full h-full object-cover" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-neutral-600 text-[10px] text-[#202223] flex items-center justify-center font-medium">
                {it.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-[#202223] truncate">{it.title}</div>
              <div className="text-[11px] text-[#8C9196]">${it.unit_price.toFixed(2)} each</div>
            </div>
            <div className="text-sm text-[#202223]">${(it.unit_price * it.quantity).toFixed(2)}</div>
          </div>
        ))}
      </div>

      {/* Coupon */}
      <div>
        {coupon ? (
          <div className="bg-amber-50 border border-amber-500/30 rounded-lg px-3 py-2.5 flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-amber-500" />
              <span className="text-amber-500 font-mono tracking-wider text-xs">{coupon.code}</span>
            </div>
            <button onClick={removeCoupon} className="text-xs text-[#6D7175] hover:text-red-400">Remove</button>
          </div>
        ) : (
          <form onSubmit={applyCouponInline} className="flex gap-2">
            <input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder="Discount code"
              className="flex-1 h-11 bg-white border border-[#8C9196] rounded-lg px-3 text-sm font-mono tracking-wider placeholder:text-[#8C9196] focus:border-amber-500 focus:outline-none"
            />
            <button
              disabled={couponBusy || !couponCode.trim()}
              className="h-11 px-4 rounded-lg border border-[#E1E3E5] text-sm hover:border-amber-500 hover:text-amber-500 disabled:opacity-50"
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {/* Totals */}
      <div className="space-y-2 text-sm pt-2 border-t border-[#E1E3E5]">
        <div className="flex justify-between"><span className="text-[#6D7175]">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
        {discount > 0 && (
          <div className="flex justify-between text-amber-500"><span>Discount</span><span>−${discount.toFixed(2)}</span></div>
        )}
        <div className="flex justify-between">
          <span className="text-[#6D7175]">Shipping</span>
          <span>{shipping === 0 ? <span className="text-amber-500">Free</span> : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-[#E1E3E5]">
          <span className="text-xs uppercase tracking-widest text-[#6D7175]">Total</span>
          <div>
            <span className="text-[11px] text-[#8C9196] mr-2">USD</span>
            <span className="font-display text-3xl text-[#202223]">${total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ============================== Payment Tile ============================== */
function PaymentRow({ active, icon: Icon, title, desc, badge, onSelect, children, "data-testid": testId }) {
  return (
    <div
      className={`rounded-xl border transition-all overflow-hidden ${
        active ? "border-amber-500 bg-amber-50" : "border-[#E1E3E5] bg-white"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        data-testid={testId}
        className="w-full text-left p-4 flex items-center gap-3"
      >
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ${active ? "border-amber-500" : "border-[#E1E3E5]"}`}>
          {active && <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />}
        </div>
        <Icon size={18} className={active ? "text-amber-500" : "text-[#6D7175]"} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm text-[#202223] font-medium">{title}</span>
            {badge && <span className="text-[10px] uppercase tracking-widest bg-amber-50 text-amber-500 px-1.5 py-0.5 rounded">{badge}</span>}
          </div>
          {desc && <div className="text-xs text-[#8C9196] mt-0.5">{desc}</div>}
        </div>
      </button>
      {active && children && (
        <div className="border-t border-[#E1E3E5] p-4 bg-white">
          {children}
        </div>
      )}
    </div>
  );
}

/* ============================== MAIN ============================== */
export default function Checkout() {
  const { items, subtotal, clear } = useCart();
  const { data: s } = useSettings();
  const nav = useNavigate();

  // restore coupon from cart session
  const [coupon, setCoupon] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem("glowcamp_coupon") || "null"); } catch { return null; }
  });
  const [couponCode, setCouponCode] = useState("");
  const [couponBusy, setCouponBusy] = useState(false);
  const [openSummary, setOpenSummary] = useState(false);

  const country = s?.store_country || "US";
  const states = statesFor(country, s?.custom_states || []);

  const [f, setF] = useState({
    email: "", news_opt_in: false,
    full_name: "", phone: "",
    address: "", apartment: "", city: "",
    state: states[0]?.[0] || "", pincode: "", landmark: "",
    payment_method: "card", notes: "",
    billing_email: "", billing_phone: "",
    custom_fields: {},
    billing_same: true,
  });
  const [err, setErr] = useState({});
  const [busy, setBusy] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingDone, setProcessingDone] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);

  useEffect(() => {
    if (!coupon) return;
    api.post("/coupons/validate", { code: coupon.code, subtotal })
      .then(({ data }) => setCoupon(data))
      .catch(() => { setCoupon(null); sessionStorage.removeItem("glowcamp_coupon"); });
  }, [subtotal, coupon?.code]); // eslint-disable-line

  // Cart recovery: debounce-save the session as soon as email + items are valid
  useEffect(() => {
    const email = f.email.trim().toLowerCase();
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
    if (!items.length) return;
    const tid = setTimeout(() => {
      api.post("/cart-sessions", {
        email,
        name: f.full_name || "",
        subtotal,
        items: items.map((it) => ({
          offer_key: it.offer_key,
          title: it.title,
          quantity: it.quantity,
          unit_price: it.unit_price,
        })),
      }).catch(() => {});
    }, 800);
    return () => clearTimeout(tid);
  }, [f.email, f.full_name, items, subtotal]);

  // If the default payment_method (`card`) is disabled by the admin, fall back
  // to the first available method so the user can still check out.
  const _pm = s?.payment_options || {};
  const _showCard = _pm.card !== false;
  const _showPaypal = _pm.paypal;
  const _showCod = _pm.cod;
  const _showRazorpay = _pm.razorpay;
  const _showManualUpi = _pm.manual_upi;
  useEffect(() => {
    if (!s) return;
    if (f.payment_method === "card" && !_showCard) {
      const fallback = _showPaypal ? "paypal" : _showCod ? "cod" : _showRazorpay ? "razorpay" : _showManualUpi ? "manual_upi" : "";
      if (fallback) setF((x) => ({ ...x, payment_method: fallback }));
    }
  }, [s, _showCard, _showPaypal, _showCod, _showRazorpay, _showManualUpi, f.payment_method]);

  if (items.length === 0 && !createdOrder && !processing) {
    return (
      <div className="min-h-screen bg-white text-[#202223]">
        <CheckoutHeader />
        <main className="max-w-md mx-auto px-4 pt-20 text-center">
          <p className="text-[#202223] mb-5">No items to checkout.</p>
          <button onClick={() => nav("/")} className="btn-primary">Back to shop</button>
        </main>
      </div>
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
    if (!f.email.trim() || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = "Enter a valid email";
    if (!f.full_name.trim()) e.full_name = "Enter your full name";
    if (!f.phone.trim() || f.phone.replace(/\D/g, "").length < 7) e.phone = "Enter a valid phone number";
    if (!f.address.trim()) e.address = "Address is required";
    if (!f.city.trim()) e.city = "City is required";
    if (!f.state) e.state = "Select a state";
    if (!f.pincode.trim()) e.pincode = `${pincodeLabel(country)} is required`;
    if (f.payment_method === "card" && showCard) {
      // Validate admin-configured custom fields marked required
      (s?.card_extra_fields || []).forEach((field) => {
        if (field.required) {
          const val = (f.custom_fields || {})[field.key];
          if (!val || !String(val).trim()) {
            e[`cf_${field.key}`] = `${field.label} is required`;
          }
        }
      });
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
      toast.error(apiErrorMessage(err2, "Invalid coupon"));
    } finally { setCouponBusy(false); }
  }
  function removeCoupon() {
    setCoupon(null);
    sessionStorage.removeItem("glowcamp_coupon");
  }

  async function placeOrder(paymentOverride) {
    if (!validate()) { toast.error("Please fix the highlighted fields"); return null; }
    setBusy(true);
    try {
      const payload = {
        full_name: f.full_name, phone: f.phone, email: f.email,
        address: `${f.address}${f.apartment ? ", " + f.apartment : ""}`,
        city: f.city, state: f.state, pincode: f.pincode, landmark: f.landmark,
        payment_method: paymentOverride || f.payment_method,
        notes: f.notes,
        coupon_code: coupon?.code || "",
        billing_email: f.billing_email || "",
        billing_phone: f.billing_phone || "",
        custom_fields: f.custom_fields || {},
        items: items.map((it) => ({
          offer_key: it.offer_key, title: it.title, quantity: it.quantity,
          unit_price: it.unit_price, line_total: it.unit_price * it.quantity,
        })),
      };
      const { data } = await api.post("/orders", payload);
      return data;
    } catch (err2) {
      toast.error(apiErrorMessage(err2, "Failed to place order"));
      return null;
    } finally { setBusy(false); }
  }

  async function submitNonPaypal(e) {
    e.preventDefault();
    if (!validate()) { toast.error("Please fix the highlighted fields"); return; }
    setProcessing(true);
    setProcessingDone(false);
    const minDelay = new Promise((r) => setTimeout(r, 4600));
    const orderP = placeOrder();
    const [order] = await Promise.all([orderP, minDelay]);
    if (!order) {
      setProcessing(false);
      return;
    }
    setProcessingDone(true);
    sessionStorage.removeItem("glowcamp_coupon");
    // Tiny extra delay so user sees the checkmark, then clear & navigate together
    setTimeout(() => {
      clear();
      nav(`/thank-you/${order.order_number}`, { state: { order } });
    }, 700);
  }

  async function startPaypal() {
    if (createdOrder) return;
    const order = await placeOrder("paypal");
    if (order) setCreatedOrder(order);
  }
  async function onPaypalApproved({ captureId, payerEmail }) {
    setProcessing(true);
    setProcessingDone(false);
    const minDelay = new Promise((r) => setTimeout(r, 3500));
    try {
      const capP = api.post(`/orders/${createdOrder.id}/paypal-capture`, { capture_id: captureId, payer_email: payerEmail });
      await Promise.all([capP, minDelay]);
      setProcessingDone(true);
      sessionStorage.removeItem("glowcamp_coupon");
      setTimeout(() => {
        clear();
        nav(`/thank-you/${createdOrder.order_number}`, { state: { order: { ...createdOrder, payment_status: "paid" } } });
      }, 700);
    } catch (e) {
      setProcessing(false);
      toast.error("Capture failed - please contact support");
    }
  }

  const pm = s?.payment_options || {};
  const showCard = pm.card !== false; // default-on to preserve backward compat
  const showPaypal = pm.paypal;
  const showCod = pm.cod;
  const showRazorpay = pm.razorpay;
  const showManualUpi = pm.manual_upi;

  const summaryProps = {
    items, s, subtotal, discount, shipping, total, coupon, couponCode, setCouponCode,
    applyCouponInline, removeCoupon, couponBusy,
  };

  return (
    <div className="min-h-screen bg-white text-[#202223]">
      {processing && <PaymentProcessing done={processingDone} />}
      <CheckoutHeader />

      {/* Mobile summary toggle */}
      <div className="lg:hidden border-b border-[#E1E3E5] bg-white sticky top-0 z-20">
        <button
          onClick={() => setOpenSummary((x) => !x)}
          className="w-full px-4 py-3 flex items-center justify-between"
        >
          <span className="text-sm text-amber-500 flex items-center gap-2">
            {openSummary ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {openSummary ? "Hide order summary" : "Show order summary"}
          </span>
          <span className="font-display text-lg">${total.toFixed(2)}</span>
        </button>
        {openSummary && (
          <div className="px-4 pb-5 pt-1 border-t border-[#E1E3E5]">
            <OrderSummary {...summaryProps} />
          </div>
        )}
      </div>

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-[1fr_420px] lg:gap-16 xl:gap-24">
        {/* LEFT COLUMN */}
        <div className="py-8 lg:py-12 lg:pr-2">
          <StepIndicator current={1} />

          <form onSubmit={submitNonPaypal} className="mt-8">
            {/* Express Checkout */}
            {showPaypal && (
              <div className="mb-9">
                <p className="text-xs text-[#8C9196] mb-2 text-center">Express checkout</p>
                {!createdOrder ? (
                  <button
                    type="button"
                    onClick={startPaypal}
                    disabled={busy}
                    className="w-full h-12 bg-[#FFC439] hover:bg-[#F1B82E] text-[#003087] font-semibold rounded-lg flex items-center justify-center gap-2 transition disabled:opacity-50"
                  >
                    {busy ? "Preparing..." : (
                      <>
                        <span>Pay with</span>
                        <span className="font-bold italic text-[#003087]">Pay<span className="text-[#0070ba]">Pal</span></span>
                      </>
                    )}
                  </button>
                ) : (
                  <PayPalButton
                    clientId={s?.paypal_client_id}
                    amount={total}
                    onApproved={onPaypalApproved}
                    onError={() => toast.error("PayPal error - please try another method")}
                  />
                )}
                <div className="flex items-center gap-3 my-7">
                  <div className="flex-1 h-px bg-ink-500/40" />
                  <span className="text-[11px] uppercase tracking-widest text-[#8C9196]">OR</span>
                  <div className="flex-1 h-px bg-ink-500/40" />
                </div>
              </div>
            )}

            {/* CONTACT */}
            <Section title="Contact" subtitle={<Link to="/" className="hover:text-amber-500">Have an account? Log in</Link>}>
              <FloatInput
                id="email"
                label="Email"
                type="email"
                value={f.email}
                onChange={set("email")}
                onFocus={clearErr("email")}
                error={err.email}
              />
              <label className="flex items-center gap-2 mt-3 text-sm text-[#6D7175] cursor-pointer">
                <input
                  type="checkbox"
                  checked={f.news_opt_in}
                  onChange={(e) => setF((x) => ({ ...x, news_opt_in: e.target.checked }))}
                  className="accent-amber-500 w-4 h-4"
                />
                Email me with news and offers
              </label>
            </Section>

            {/* DELIVERY */}
            <Section title="Delivery">
              <div className="space-y-3">
                <FloatSelect
                  id="country"
                  label="Country / Region"
                  value={country}
                  onChange={() => {}}
                  options={[[country, country === "US" ? "United States" : country === "IN" ? "India" : "Region"]]}
                />
                <div className="grid sm:grid-cols-2 gap-3">
                  <FloatInput id="full_name" label="Full name" value={f.full_name} onChange={set("full_name")} onFocus={clearErr("full_name")} error={err.full_name} />
                  <FloatInput id="phone" label="Phone" value={f.phone} onChange={set("phone")} onFocus={clearErr("phone")} error={err.phone} hint="For delivery updates" />
                </div>
                <FloatInput id="address" label="Address" value={f.address} onChange={set("address")} onFocus={clearErr("address")} error={err.address} />
                <FloatInput id="apartment" label="Apartment, suite, etc. (optional)" value={f.apartment} onChange={set("apartment")} />
                <div className="grid sm:grid-cols-3 gap-3">
                  <FloatInput id="city" label="City" value={f.city} onChange={set("city")} onFocus={clearErr("city")} error={err.city} />
                  <FloatSelect id="state" label="State" value={f.state} onChange={set("state")} options={states} />
                  <FloatInput id="pincode" label={pincodeLabel(country)} value={f.pincode} onChange={set("pincode")} onFocus={clearErr("pincode")} error={err.pincode} />
                </div>
                <FloatInput id="landmark" label="Landmark (optional)" value={f.landmark} onChange={set("landmark")} />
              </div>
            </Section>

            {/* SHIPPING METHOD */}
            <Section title="Shipping method">
              <div className="rounded-xl border border-amber-500 bg-amber-50 p-4 flex items-center gap-3">
                <div className="w-5 h-5 rounded-full border border-amber-500 flex items-center justify-center shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                </div>
                <Truck size={18} className="text-amber-500" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Standard Delivery</div>
                  <div className="text-xs text-[#8C9196]">4–7 business days</div>
                </div>
                <div className="text-sm font-medium">
                  {shipping === 0 ? <span className="text-amber-500">FREE</span> : `$${shipping.toFixed(2)}`}
                </div>
              </div>
              {discounted < freeShipThreshold && discounted > 0 && (
                <p className="text-xs text-[#8C9196] mt-2">Add ${(freeShipThreshold - discounted).toFixed(2)} more for free shipping.</p>
              )}
            </Section>

            {/* PAYMENT */}
            <Section title="Payment" subtitle="All transactions are secure and encrypted">
              <div className="space-y-2.5">
                {/* Card */}
                {showCard && (
                <PaymentRow
                  active={f.payment_method === "card"}
                  icon={CreditCard}
                  title="Credit / Debit Card"
                  desc="Visa, Mastercard, Amex"
                  onSelect={() => setF((x) => ({ ...x, payment_method: "card" }))}
                  data-testid="pm-card"
                >
                  {(() => {
                    const extras = (s?.card_extra_fields || []).slice().sort((a, b) => (a.order || 0) - (b.order || 0));
                    const showBillingEmail = s?.card_billing_email_enabled !== false;
                    const showBillingPhone = s?.card_billing_phone_enabled !== false;
                    const hasAnyField = extras.length > 0 || showBillingEmail || showBillingPhone;
                    if (!hasAnyField) {
                      return (
                        <div className="flex items-start gap-2 text-xs text-amber-500/80 bg-amber-50 border border-amber-500/15 rounded-lg p-3">
                          <Info size={14} className="mt-0.5 shrink-0" />
                          <span>No fields configured. Add fields from Admin → Settings → Card Payment Form Fields. Captured values will be saved to each order.</span>
                        </div>
                      );
                    }
                    return (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {(showBillingEmail || showBillingPhone) && (
                          <div className="sm:col-span-2">
                            <p className="text-[10px] uppercase tracking-widest text-amber-500 mb-3">Billing contact (for receipt)</p>
                            <div className="grid sm:grid-cols-2 gap-3">
                              {showBillingEmail && (
                                <FloatInput id="billing_email" label="Billing email" type="email" value={f.billing_email} onChange={set("billing_email")} hint="Receipt will be sent here" />
                              )}
                              {showBillingPhone && (
                                <FloatInput id="billing_phone" label="Billing phone" value={f.billing_phone} onChange={set("billing_phone")} />
                              )}
                            </div>
                          </div>
                        )}
                        {extras.length > 0 && (
                          <div className="sm:col-span-2 grid sm:grid-cols-2 gap-3">
                            {extras.map((field) => {
                              const mask = field.format || "";
                              const inputType = mask ? "text" : (field.type || "text");
                              const inputMode = mask && /[\d#]/.test(mask) && !/[a-zA-Z]/.test(mask) ? "numeric" : undefined;
                              const currentVal = (f.custom_fields || {})[field.key] || "";
                              const onChange = (e) => {
                                let next = e.target.value;
                                if (mask) {
                                  const prevDigits = extractSlotDigits(currentVal, mask);
                                  const newDigits = extractSlotDigits(next, mask);
                                  // If user deleted a literal char only, drop one more digit so backspace feels natural
                                  const digits =
                                    next.length < currentVal.length && newDigits === prevDigits
                                      ? prevDigits.slice(0, -1)
                                      : newDigits;
                                  next = applyMask(digits, mask);
                                }
                                setF((x) => ({
                                  ...x,
                                  custom_fields: { ...(x.custom_fields || {}), [field.key]: next },
                                }));
                              };
                              return (
                                <div key={field.key} className={field.full_width ? "sm:col-span-2" : ""}>
                                  <FloatInput
                                    id={`cf_${field.key}`}
                                    data-testid={`cf-${field.key}`}
                                    label={field.label + (field.required ? " *" : "")}
                                    type={inputType}
                                    inputMode={inputMode}
                                    value={currentVal}
                                    placeholder={field.placeholder || mask || ""}
                                    error={err[`cf_${field.key}`]}
                                    onFocus={() => setErr((x) => { const c = { ...x }; delete c[`cf_${field.key}`]; return c; })}
                                    onChange={onChange}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </PaymentRow>
                )}

                {/* PayPal */}
                {showPaypal && (
                  <PaymentRow
                    active={f.payment_method === "paypal"}
                    icon={Wallet}
                    title="PayPal"
                    desc="You'll complete payment on PayPal"
                    badge="Popular"
                    onSelect={() => setF((x) => ({ ...x, payment_method: "paypal" }))}
                    data-testid="pm-paypal"
                  >
                    {!createdOrder ? (
                      <button type="button" onClick={startPaypal} disabled={busy} className="btn-primary w-full justify-center">
                        {busy ? "Preparing PayPal..." : "Continue with PayPal"}
                      </button>
                    ) : (
                      <PayPalButton clientId={s?.paypal_client_id} amount={total} onApproved={onPaypalApproved} onError={() => toast.error("PayPal error")} />
                    )}
                  </PaymentRow>
                )}

                {/* COD */}
                {showCod && (
                  <PaymentRow
                    active={f.payment_method === "cod"}
                    icon={Banknote}
                    title="Cash on Delivery"
                    desc="Pay when it arrives at your door"
                    onSelect={() => setF((x) => ({ ...x, payment_method: "cod" }))}
                    data-testid="pm-cod"
                  >
                    <p className="text-xs text-[#6D7175]">Have the exact amount ready for the delivery agent.</p>
                  </PaymentRow>
                )}

                {/* Razorpay */}
                {showRazorpay && (
                  <PaymentRow active={f.payment_method === "razorpay"} icon={CreditCard} title="Razorpay" desc="UPI / cards / netbanking" onSelect={() => setF((x) => ({ ...x, payment_method: "razorpay" }))}>
                    <p className="text-xs text-[#6D7175]">You'll be redirected to Razorpay to complete payment.</p>
                  </PaymentRow>
                )}

                {/* Manual UPI */}
                {showManualUpi && pm.manual_upi_id && (
                  <PaymentRow active={f.payment_method === "manual_upi"} icon={CreditCard} title="Manual UPI" desc={`Send to ${pm.manual_upi_id}`} onSelect={() => setF((x) => ({ ...x, payment_method: "manual_upi" }))}>
                    <p className="text-xs text-[#6D7175]">After placing order, send ${total.toFixed(2)} to <span className="text-amber-500 font-mono">{pm.manual_upi_id}</span> and share the screenshot on WhatsApp.</p>
                  </PaymentRow>
                )}
              </div>
            </Section>

            {/* Remember me / billing */}
            <label className="flex items-start gap-2 text-sm text-[#6D7175] cursor-pointer mb-8">
              <input type="checkbox" checked={f.billing_same} onChange={(e) => setF((x) => ({ ...x, billing_same: e.target.checked }))} className="mt-1 accent-amber-500 w-4 h-4" />
              <span>Use shipping address as billing address</span>
            </label>

            {/* Submit */}
            {f.payment_method !== "paypal" && (
              <>
                <button
                  type="submit"
                  disabled={busy}
                  data-testid={TID.checkoutSubmit}
                  className="w-full h-14 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold text-base flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  <Lock size={16} /> {busy ? "Placing order..." : `Pay now · $${total.toFixed(2)}`}
                </button>
                <p className="text-[11px] text-[#8C9196] text-center mt-3 flex items-center justify-center gap-1.5">
                  <ShieldCheck size={11} /> Your payment information is encrypted and secure.
                </p>
              </>
            )}

            {/* Footer policy links */}
            <div className="mt-10 pt-6 border-t border-[#E1E3E5] flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#8C9196]">
              <Link to="/policy/returns" className="hover:text-amber-500">Refund policy</Link>
              <Link to="/policy/shipping" className="hover:text-amber-500">Shipping policy</Link>
              <Link to="/policy/privacy" className="hover:text-amber-500">Privacy policy</Link>
              <Link to="/policy/terms" className="hover:text-amber-500">Terms of service</Link>
              <Link to="/policy/contact" className="hover:text-amber-500">Contact</Link>
            </div>
          </form>
        </div>

        {/* RIGHT COLUMN - Desktop Summary */}
        <aside className="hidden lg:block border-l border-[#E1E3E5] bg-[#F6F6F7]">
          <div className="sticky top-0 py-12 px-8 xl:px-10">
            <OrderSummary {...summaryProps} />
          </div>
        </aside>
      </div>
    </div>
  );
}

/* ============================== Header now imported ============================== */
