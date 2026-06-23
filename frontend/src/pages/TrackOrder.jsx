import React, { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search, Package, ClipboardCheck, Box, Truck, MapPin, CheckCircle2,
  ChevronRight, MessageCircle, Mail, Phone,
} from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage } from "../lib/api";
import { TID } from "../constants/testIds";
import { useSettings } from "../lib/hooks";
import CheckoutHeader from "../components/CheckoutHeader";

const STEPS = [
  { key: "placed", label: "Order placed", icon: ClipboardCheck, desc: "We received your order" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, desc: "Order verified by our team" },
  { key: "packed", label: "Packed", icon: Box, desc: "Carefully boxed and ready" },
  { key: "shipped", label: "Shipped", icon: Package, desc: "Picked up by courier" },
  { key: "out_for_delivery", label: "Out for delivery", icon: Truck, desc: "Driver is on the way" },
  { key: "delivered", label: "Delivered", icon: MapPin, desc: "Enjoy the glow!" },
];

const HEADLINE = {
  placed: { title: "Order received", sub: "We've got your order and we're getting it ready." },
  confirmed: { title: "Order confirmed", sub: "We're preparing your GlowCamp for dispatch." },
  packed: { title: "Packed and ready", sub: "Your order is packed and waiting for the courier." },
  shipped: { title: "On its way", sub: "Your order has been handed to the courier." },
  out_for_delivery: { title: "Arriving today", sub: "Your order is out for delivery." },
  delivered: { title: "Delivered", sub: "Hope you love the glow." },
  cancelled: { title: "Cancelled", sub: "This order has been cancelled." },
};

function statusIndex(status) {
  const i = STEPS.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

function pmLabel(pm) {
  return ({
    card: "Credit / Debit Card",
    paypal: "PayPal",
    stripe: "Credit / Debit Card",
    razorpay: "Razorpay",
    manual_upi: "Manual UPI",
    cod: "Cash on Delivery",
  }[pm] || pm);
}

function TimelineRow({ step, status, last }) {
  const { state, at, note } = status;
  const Icon = step.icon;
  const active = state === "current";
  const done = state === "done";
  return (
    <li className="flex gap-4 relative">
      {!last && <span className={`absolute left-[14px] top-8 bottom-[-24px] w-px ${done ? "bg-amber-500/60" : "bg-ink-500/60"}`} />}
      <div
        className={`relative z-10 w-7 h-7 rounded-full flex items-center justify-center shrink-0 border-2 ${
          done ? "bg-amber-500 border-amber-500 text-black"
            : active ? "border-amber-500 bg-[#100D06] text-amber-500"
            : "border-ink-500 bg-[#0A0A0A] text-neutral-600"
        }`}
      >
        <Icon size={13} />
      </div>
      <div className={`flex-1 pb-6 ${last ? "pb-0" : ""}`}>
        <div className="flex items-baseline justify-between gap-2 flex-wrap">
          <p className={`text-sm font-medium ${active ? "text-amber-500" : done ? "text-white" : "text-neutral-500"}`}>
            {step.label}
          </p>
          {at && <span className="text-[11px] text-neutral-500">{new Date(at).toLocaleString()}</span>}
        </div>
        <p className="text-xs text-neutral-500 mt-0.5">{note || step.desc}</p>
      </div>
    </li>
  );
}

export default function TrackOrder() {
  const { data: s } = useSettings();
  const [params] = useSearchParams();
  const [orderNumber, setOrderNumber] = useState(params.get("o") || "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  // Auto-load when ?o=GC-...&k=TOKEN is present (Shopify-style deep link)
  useEffect(() => {
    const o = params.get("o");
    const k = params.get("k");
    if (o && k) {
      setBusy(true);
      api.get("/orders/track", { params: { order_number: o, key: k } })
        .then(({ data }) => setOrder(data))
        .catch((err) => toast.error(apiErrorMessage(err, "Tracking link is invalid or expired")))
        .finally(() => setBusy(false));
    }
  }, [params]);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setOrder(null);
    try {
      const { data } = await api.get("/orders/track", { params: { order_number: orderNumber, phone } });
      setOrder(data);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Order not found"));
    } finally { setBusy(false); }
  }

  // Empty state - lookup form
  if (!order) {
    return (
      <div className="min-h-screen bg-[#0A0A0A] text-white">
        <CheckoutHeader rightText="Track your order" />
        <main className="max-w-md mx-auto px-4 pt-12 pb-20">
          <p className="text-xs text-neutral-500 mb-4">
            <Link to="/" className="hover:text-amber-500">Home</Link>
            <ChevronRight size={11} className="inline mx-1 -mt-0.5 text-neutral-700" />
            <span>Track order</span>
          </p>
          <h1 className="font-display text-3xl sm:text-4xl mb-2">Where's my order?</h1>
          <p className="text-sm text-neutral-400 mb-8">Enter your order number and the phone number used at checkout.</p>
          <form onSubmit={submit} className="space-y-3">
            <input
              data-testid={TID.trackInput}
              className="w-full h-14 bg-[#0F0F0F] border border-ink-500/80 rounded-lg px-4 text-[15px] font-mono tracking-wider placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
              placeholder="GC-XXXXXXXX"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              required
            />
            <input
              data-testid={TID.trackPhone}
              className="w-full h-14 bg-[#0F0F0F] border border-ink-500/80 rounded-lg px-4 text-[15px] placeholder:text-neutral-600 focus:border-amber-500 focus:outline-none"
              placeholder="Phone number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={busy}
              data-testid={TID.trackSubmit}
              className="w-full h-14 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <Search size={16} /> {busy ? "Searching..." : "Find my order"}
            </button>
          </form>
          <p className="text-xs text-neutral-500 mt-6 text-center">
            Can't find your order number? Check your confirmation email — it looks like <span className="font-mono text-amber-500">GC-XXXXXXXX</span>.
          </p>
        </main>
      </div>
    );
  }

  const idx = statusIndex(order.status);
  const head = HEADLINE[order.status] || HEADLINE.placed;

  // Build display timeline: combine known STEPS with order.timeline events for timestamps
  const tlByStatus = (order.timeline || []).reduce((acc, ev) => {
    acc[ev.status] = ev;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <CheckoutHeader rightText={`Order ${order.order_number}`} />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-[1fr_420px] lg:gap-16 xl:gap-24">
        {/* LEFT */}
        <main className="py-8 lg:py-12">
          <p className="text-xs text-neutral-500 mb-4">
            <Link to="/" className="hover:text-amber-500">Home</Link>
            <ChevronRight size={11} className="inline mx-1 -mt-0.5 text-neutral-700" />
            <span>Tracking</span>
          </p>

          {/* Headline */}
          <div className="mb-7">
            <p className="text-xs uppercase tracking-widest text-amber-500">Order {order.order_number}</p>
            <h1 className="font-display text-3xl sm:text-4xl mt-1">{head.title}</h1>
            <p className="text-sm text-neutral-400 mt-2 max-w-xl">{head.sub}</p>
          </div>

          {/* Progress bar pseudo-map */}
          {order.status !== "cancelled" && (
            <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 mb-6 overflow-hidden relative">
              <div className="flex items-center justify-between mb-3 text-[11px] text-neutral-500">
                <span>Placed</span><span>Delivered</span>
              </div>
              <div className="h-2 bg-ink-500/60 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-700"
                  style={{ width: `${Math.max(8, ((idx + 1) / STEPS.length) * 100)}%` }}
                />
              </div>
              <div className="grid grid-cols-6 gap-1">
                {STEPS.map((step, i) => {
                  const done = i <= idx;
                  const Icon = step.icon;
                  return (
                    <div key={step.key} className="flex flex-col items-center text-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center border ${done ? "bg-amber-500 border-amber-500 text-black" : "border-ink-500 text-neutral-600"}`}>
                        <Icon size={12} />
                      </div>
                      <div className={`text-[9px] mt-1.5 leading-tight ${done ? "text-neutral-300" : "text-neutral-600"} hidden sm:block`}>
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Detailed timeline */}
          <section className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 sm:p-6 mb-6">
            <h2 className="font-display text-lg mb-5">Order timeline</h2>
            {order.status === "cancelled" ? (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
                This order has been cancelled. Please contact support if this was unexpected.
              </div>
            ) : (
              <ol className="space-y-0">
                {STEPS.map((step, i) => {
                  const last = i === STEPS.length - 1;
                  let state = "future";
                  if (i < idx) state = "done";
                  else if (i === idx) state = "current";
                  const ev = tlByStatus[step.key] || {};
                  return (
                    <TimelineRow
                      key={step.key}
                      step={step}
                      last={last}
                      status={{ state, at: ev.at, note: ev.note }}
                    />
                  );
                })}
              </ol>
            )}
          </section>

          {/* Order info */}
          <section className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 sm:p-6 mb-6">
            <h2 className="font-display text-lg mb-5">Order details</h2>
            <div className="grid sm:grid-cols-2 gap-6 text-sm">
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1.5 flex items-center gap-1.5"><Mail size={11} /> Contact</div>
                <div>{order.email}</div>
                <div className="text-neutral-500 text-xs mt-0.5 flex items-center gap-1.5"><Phone size={11} /> {order.phone}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1.5 flex items-center gap-1.5"><MapPin size={11} /> Shipping to</div>
                <div>{order.full_name}</div>
                <div className="text-neutral-400 text-xs">{order.address}</div>
                <div className="text-neutral-400 text-xs">{order.city}, {order.state} {order.pincode}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1.5">Payment</div>
                <div>{pmLabel(order.payment_method)}</div>
                <div className="text-neutral-500 text-xs mt-0.5 capitalize">{order.payment_status}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500 mb-1.5">Placed on</div>
                <div>{new Date(order.created_at).toLocaleString()}</div>
              </div>
            </div>
          </section>

          {/* Help */}
          <div className="flex flex-wrap items-center gap-2">
            {s?.whatsapp_number && (
              <a href={`https://wa.me/${s.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink-500 hover:border-amber-500 hover:text-amber-500 text-sm">
                <MessageCircle size={14} /> WhatsApp support
              </a>
            )}
            <Link to="/" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink-500 hover:border-amber-500 hover:text-amber-500 text-sm">
              <Package size={14} /> Continue shopping
            </Link>
          </div>
        </main>

        {/* RIGHT - summary */}
        <aside className="hidden lg:block border-l border-ink-500/40 bg-[#0C0C0C]/40">
          <div className="sticky top-0 py-12 px-8 xl:px-10">
            <Summary order={order} s={s} />
          </div>
        </aside>

        <div className="lg:hidden border-t border-ink-500/40 px-4 py-8">
          <Summary order={order} s={s} />
        </div>
      </div>
    </div>
  );
}

function Summary({ order, s }) {
  return (
    <div className="space-y-5">
      <h3 className="font-display text-xl">Order summary</h3>
      <div className="space-y-4">
        {order.items.map((it, i) => (
          <div key={i} className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-ink-500/60 shrink-0 bg-[#161616]">
              <img src={s?.product?.main_image} alt={it.title} className="w-full h-full object-cover" />
              <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 rounded-full bg-neutral-600 text-[10px] flex items-center justify-center font-medium">
                {it.quantity}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm truncate">{it.title}</div>
              <div className="text-[11px] text-neutral-500">${it.unit_price.toFixed(2)} each</div>
            </div>
            <div className="text-sm">${it.line_total.toFixed(2)}</div>
          </div>
        ))}
      </div>
      <div className="space-y-2 text-sm pt-3 border-t border-ink-500/40">
        <div className="flex justify-between"><span className="text-neutral-400">Subtotal</span><span>${order.subtotal.toFixed(2)}</span></div>
        {order.discount > 0 && (
          <div className="flex justify-between text-amber-500"><span>Discount</span><span>−${order.discount.toFixed(2)}</span></div>
        )}
        <div className="flex justify-between"><span className="text-neutral-400">Shipping</span><span>{order.shipping === 0 ? <span className="text-amber-500">Free</span> : `$${order.shipping.toFixed(2)}`}</span></div>
        <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-ink-500/40">
          <span className="text-xs uppercase tracking-widest text-neutral-400">Total</span>
          <div>
            <span className="text-[11px] text-neutral-500 mr-2">USD</span>
            <span className="font-display text-3xl">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
