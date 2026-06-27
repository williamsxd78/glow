import React, { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Minus, Plus, Trash2, ArrowRight, ShoppingBag, Tag, ShieldCheck, Truck } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "../lib/cart";
import { useSettings } from "../lib/hooks";
import { api, apiErrorMessage, resolveImageUrl } from "../lib/api";
import { TID } from "../constants/testIds";
import { FlameMark } from "../components/FlameLogo";

export default function Cart() {
  const { items, setQty, remove, subtotal, add } = useCart();
  const { data: s } = useSettings();
  const nav = useNavigate();
  const [params, setParams] = useSearchParams();

  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState(null);
  const [busy, setBusy] = useState(false);

  // Resume an abandoned cart from email link: /cart?resume={cart_session_id}
  useEffect(() => {
    const resumeId = params.get("resume");
    if (!resumeId) return;
    if (items.length > 0) {
      // already have a cart - clear the param and keep what they had
      const p = new URLSearchParams(params);
      p.delete("resume");
      setParams(p, { replace: true });
      return;
    }
    api.get(`/cart-sessions/${resumeId}`)
      .then(({ data }) => {
        (data.items || []).forEach((it) => add({ key: it.offer_key, title: it.title, price: it.unit_price }, it.quantity));
        toast.success("Welcome back! Your cart was restored.");
      })
      .catch(() => toast.error("This cart recovery link has expired."))
      .finally(() => {
        const p = new URLSearchParams(params);
        p.delete("resume");
        setParams(p, { replace: true });
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const freeShipThreshold = s?.free_shipping_threshold || 50;
  const shippingCharge = s?.shipping_charge || 5;
  const discount = coupon ? coupon.discount : 0;
  const discounted = Math.max(0, subtotal - discount);
  const shipping = discounted === 0 ? 0 : discounted >= freeShipThreshold ? 0 : shippingCharge;
  const total = discounted + shipping;
  const remaining = Math.max(0, freeShipThreshold - discounted);
  const progressPct = Math.min(100, (discounted / freeShipThreshold) * 100);

  async function applyCoupon(e) {
    e?.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    try {
      const { data } = await api.post("/coupons/validate", { code: code.trim(), subtotal });
      setCoupon(data);
      // persist to session for checkout
      sessionStorage.setItem("glowcamp_coupon", JSON.stringify(data));
      toast.success(`Coupon ${data.code} applied`);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Invalid coupon"));
      setCoupon(null);
      sessionStorage.removeItem("glowcamp_coupon");
    } finally {
      setBusy(false);
    }
  }

  function clearCoupon() {
    setCoupon(null);
    setCode("");
    sessionStorage.removeItem("glowcamp_coupon");
  }

  // Empty state
  if (items.length === 0) {
    return (
      <main data-testid={TID.cartPage} className="min-h-[75vh] max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 pb-40 sm:pb-32">
        <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-3xl p-10 sm:p-16 text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-amber-500/10 border border-amber-500/30 mb-6 flame-flicker">
            <FlameMark size={32} />
          </div>
          <h1 className="font-display text-2xl sm:text-3xl mb-3">Your cart is waiting for a little glow.</h1>
          <p className="text-sm text-neutral-400 mb-8 max-w-md mx-auto">
            Add a GlowCamp lamp and turn any corner into a tiny cabin moment.
          </p>
          <Link to="/product" className="btn-primary inline-flex">Continue Shopping <ArrowRight size={16} /></Link>
        </div>
      </main>
    );
  }

  return (
    <main data-testid={TID.cartPage} className="min-h-[75vh] max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12 pb-40 sm:pb-32">
      <div className="mb-8 sm:mb-10">
        <h1 className="font-display text-3xl sm:text-4xl mb-1">Your Cart</h1>
        <p className="text-xs sm:text-sm text-neutral-500 flex items-center gap-1.5">
          <ShoppingBag size={12} /> {items.reduce((a, x) => a + x.quantity, 0)} item{items.reduce((a, x) => a + x.quantity, 0) === 1 ? "" : "s"}
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6 lg:gap-8">
        {/* LEFT: Items */}
        <div className="space-y-3 sm:space-y-4">
          {items.map((it) => (
            <article
              key={it.offer_key}
              className="bg-[#0E0E0E] border border-ink-500/60 hover:border-amber-500/30 transition-colors rounded-2xl p-4 sm:p-5"
            >
              <div className="flex gap-4">
                {/* image */}
                <div className="shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border border-ink-500/60 relative glow-amber-soft">
                    <img src={resolveImageUrl(s?.product?.main_image)} alt={it.title} className="w-full h-full object-cover" />
                  </div>
                </div>
                {/* details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 pr-2">
                      <h3 className="text-base sm:text-lg font-medium leading-tight truncate">{it.title}</h3>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {it.offer_key === "couple" ? "2-lamp pack" : it.offer_key === "gift" ? "1 lamp + gift box" : "Single lamp"}
                      </p>
                      <p className="text-sm text-neutral-300 mt-2">${it.unit_price.toFixed(2)} <span className="text-neutral-500 text-xs">each</span></p>
                    </div>
                    <button
                      onClick={() => remove(it.offer_key)}
                      className="shrink-0 text-neutral-500 hover:text-red-400 transition p-1.5 -mr-1.5 -mt-1.5"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
              {/* footer: qty + total */}
              <div className="mt-4 pt-4 border-t border-ink-500/40 flex items-center justify-between gap-3">
                <div className="inline-flex items-center bg-[#1A1A1A] border border-ink-500/70 rounded-full">
                  <button
                    onClick={() => setQty(it.offer_key, it.quantity - 1)}
                    className="w-9 h-9 flex items-center justify-center text-neutral-300 hover:text-amber-500"
                    aria-label="Decrease quantity"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-8 text-center text-sm font-medium tabular-nums">{it.quantity}</span>
                  <button
                    onClick={() => setQty(it.offer_key, it.quantity + 1)}
                    className="w-9 h-9 flex items-center justify-center text-neutral-300 hover:text-amber-500"
                    aria-label="Increase quantity"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-neutral-500 uppercase tracking-widest">Item total</div>
                  <div className="text-base sm:text-lg font-semibold text-white">${(it.unit_price * it.quantity).toFixed(2)}</div>
                </div>
              </div>
            </article>
          ))}

          {/* trust strip */}
          <div className="grid grid-cols-3 gap-3 mt-2 text-[11px] sm:text-xs text-neutral-400">
            <div className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-amber-500" /> 7-day return</div>
            <div className="flex items-center gap-1.5"><Truck size={14} className="text-amber-500" /> Free over ${freeShipThreshold}</div>
            <div className="flex items-center gap-1.5"><Tag size={14} className="text-amber-500" /> Try GLOW10</div>
          </div>
        </div>

        {/* RIGHT: Summary */}
        <aside className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 sm:p-6 h-fit lg:sticky lg:top-24">
          <h3 className="font-display text-xl mb-4">Order Summary</h3>

          {/* progress */}
          <div className="mb-5">
            {remaining > 0 ? (
              <p className="text-xs text-amber-500/90 mb-2">
                Spend ${remaining.toFixed(2)} more for <span className="font-semibold">free shipping</span>
              </p>
            ) : (
              <p className="text-xs text-amber-500 mb-2 font-medium flex items-center gap-1">
                <Truck size={12} /> You unlocked free shipping
              </p>
            )}
            <div className="h-1.5 bg-ink-500/60 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>

          {/* coupon */}
          {coupon ? (
            <div className="mb-5 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 flex items-center justify-between">
              <div>
                <div className="text-xs text-amber-500 font-semibold tracking-wider">{coupon.code} applied</div>
                <div className="text-[11px] text-neutral-400">{coupon.description}</div>
              </div>
              <button onClick={clearCoupon} className="text-neutral-400 hover:text-red-400 text-xs">Remove</button>
            </div>
          ) : (
            <form onSubmit={applyCoupon} className="mb-5">
              <label className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1.5 block">Coupon code</label>
              <div className="flex gap-2">
                <input
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="Try GLOW10"
                  className="flex-1 bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2.5 text-sm font-mono tracking-wider focus:border-amber-500 focus:outline-none"
                />
                <button type="submit" disabled={busy || !code.trim()} className="btn-ghost text-sm disabled:opacity-50">
                  Apply
                </button>
              </div>
            </form>
          )}

          {/* totals */}
          <div className="space-y-2.5 text-sm border-t border-ink-500/40 pt-4">
            <div className="flex justify-between"><span className="text-neutral-400">Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
            {discount > 0 && (
              <div className="flex justify-between text-amber-500"><span>Discount</span><span>−${discount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between"><span className="text-neutral-400">Shipping</span><span>{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span></div>
            <div className="flex justify-between font-display text-2xl text-amber-500 pt-3 border-t border-ink-500/40">
              <span>Total</span><span>${total.toFixed(2)}</span>
            </div>
          </div>

          <button
            onClick={() => nav("/checkout")}
            className="btn-primary w-full justify-center mt-5 py-3.5"
          >
            Proceed to Checkout <ArrowRight size={16} />
          </button>
          <p className="text-[10px] text-neutral-500 text-center mt-3 flex items-center justify-center gap-1.5">
            <ShieldCheck size={11} /> Encrypted & secure checkout
          </p>
        </aside>
      </div>
    </main>
  );
}
