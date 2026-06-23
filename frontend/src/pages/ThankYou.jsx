import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import {
  CheckCircle2, MessageCircle, Package, Truck, Mail, Phone, MapPin, CreditCard,
  ChevronRight, ArrowRight,
} from "lucide-react";
import { TID } from "../constants/testIds";
import { useSettings } from "../lib/hooks";
import CheckoutHeader from "../components/CheckoutHeader";

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

export default function ThankYou() {
  const loc = useLocation();
  const { id } = useParams();
  const order = loc.state?.order;
  const { data: s } = useSettings();

  return (
    <div className="min-h-screen bg-[#0A0A0A] text-white">
      <CheckoutHeader rightText="Order confirmed" />

      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 grid lg:grid-cols-[1fr_420px] lg:gap-16 xl:gap-24">
        {/* LEFT */}
        <main data-testid={TID.thankYou} className="py-8 lg:py-12">
          {/* Breadcrumb */}
          <p className="text-xs text-neutral-500 mb-4">
            <Link to="/" className="hover:text-amber-500">Home</Link>
            <ChevronRight size={11} className="inline mx-1 -mt-0.5 text-neutral-700" />
            <span>Order confirmation</span>
          </p>

          {/* Confirmation block */}
          <div className="flex items-start gap-4 mb-9">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 border border-amber-500/40 flex items-center justify-center shrink-0 pulse-ring">
              <CheckCircle2 size={24} className="text-amber-500" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-amber-500">Order #{id}</p>
              <h1 className="font-display text-3xl sm:text-4xl mt-1">
                Thank you{order?.full_name ? `, ${order.full_name.split(" ")[0]}` : ""}!
              </h1>
              <p className="text-sm text-neutral-400 mt-2 max-w-xl">
                Your order is confirmed. You'll receive a confirmation email with your order details shortly.
              </p>
            </div>
          </div>

          {/* Order updates card */}
          <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 mb-6">
            <div className="flex items-start gap-3">
              <Package size={20} className="text-amber-500 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-display text-lg">Order updates</h3>
                <p className="text-sm text-neutral-400 mt-1">
                  You'll get shipping and delivery updates by email{order?.phone ? " and SMS" : ""}.
                </p>
              </div>
            </div>
          </div>

          {/* Tracking link card (Shopify-style) */}
          {order?.tracking_token && (
            <Link
              to={`/track-order?o=${order.order_number}&k=${order.tracking_token}`}
              className="block bg-[#0E0E0E] border border-amber-500/40 hover:border-amber-500 rounded-2xl p-5 mb-6 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                  <Truck size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-display text-lg text-white">Track your order</h3>
                  <p className="text-sm text-neutral-400 mt-0.5">Open the live tracking page for {order.order_number}</p>
                </div>
                <ChevronRight size={18} className="text-neutral-500 group-hover:text-amber-500 group-hover:translate-x-1 transition-all" />
              </div>
            </Link>
          )}

          {/* Customer information */}
          {order && (
            <section className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 sm:p-6 mb-6">
              <h2 className="font-display text-xl mb-5">Customer information</h2>
              <div className="grid sm:grid-cols-2 gap-6">
                <InfoBlock title="Contact information" icon={Mail}>
                  <div>{order.email}</div>
                  <div className="text-neutral-500 text-xs mt-1 flex items-center gap-1.5"><Phone size={11} /> {order.phone}</div>
                </InfoBlock>
                <InfoBlock title="Payment method" icon={CreditCard}>
                  <div>{pmLabel(order.payment_method)}</div>
                  <div className="text-neutral-500 text-xs mt-1 capitalize">{order.payment_status === "paid" ? "Paid" : `Status: ${order.payment_status}`}</div>
                </InfoBlock>
                <InfoBlock title="Shipping address" icon={MapPin}>
                  <div>{order.full_name}</div>
                  <div className="text-neutral-400">{order.address}</div>
                  <div className="text-neutral-400">{order.city}, {order.state} {order.pincode}</div>
                  {order.landmark && <div className="text-neutral-500 text-xs mt-1">Landmark: {order.landmark}</div>}
                </InfoBlock>
                <InfoBlock title="Shipping method" icon={Truck}>
                  <div>Standard Delivery</div>
                  <div className="text-neutral-500 text-xs mt-1">Arrives in 4–7 business days</div>
                </InfoBlock>
              </div>
            </section>
          )}

          {/* Help */}
          <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 sm:p-6 mb-8">
            <h2 className="font-display text-lg mb-1">Need help?</h2>
            <p className="text-sm text-neutral-400 mb-4">Reach out to our team — we usually reply within an hour.</p>
            <div className="flex flex-wrap gap-2">
              {s?.whatsapp_number && (
                <a href={`https://wa.me/${s.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink-500 hover:border-amber-500 hover:text-amber-500 text-sm">
                  <MessageCircle size={14} /> WhatsApp us
                </a>
              )}
              <Link to="/track-order" className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-ink-500 hover:border-amber-500 hover:text-amber-500 text-sm">
                <Truck size={14} /> Track your order
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 border-t border-ink-500/40 pt-6">
            <p className="text-xs text-neutral-500">
              You can contact us anytime quoting your order number <span className="font-mono text-amber-500">{id}</span>.
            </p>
            <Link to="/" className="btn-primary text-sm">Continue shopping <ArrowRight size={14} /></Link>
          </div>
        </main>

        {/* RIGHT - Summary */}
        <aside className="hidden lg:block border-l border-ink-500/40 bg-[#0C0C0C]/40">
          <div className="sticky top-0 py-12 px-8 xl:px-10">
            <SummarySidebar order={order} s={s} />
          </div>
        </aside>

        {/* Mobile summary at bottom */}
        <div className="lg:hidden border-t border-ink-500/40 px-4 py-8">
          <SummarySidebar order={order} s={s} />
        </div>
      </div>
    </div>
  );
}

function InfoBlock({ title, icon: Icon, children }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-neutral-500 flex items-center gap-1.5 mb-2">
        <Icon size={12} /> {title}
      </div>
      <div className="text-sm text-white space-y-0.5">{children}</div>
    </div>
  );
}

function SummarySidebar({ order, s }) {
  if (!order) return null;
  return (
    <div className="space-y-5">
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
          <div className="flex justify-between text-amber-500">
            <span>Discount {order.coupon_code && <span className="text-[10px] font-mono ml-1">({order.coupon_code})</span>}</span>
            <span>−${order.discount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between"><span className="text-neutral-400">Shipping</span><span>{order.shipping === 0 ? <span className="text-amber-500">Free</span> : `$${order.shipping.toFixed(2)}`}</span></div>
        <div className="flex justify-between items-baseline pt-3 mt-1 border-t border-ink-500/40">
          <span className="text-xs uppercase tracking-widest text-neutral-400">Total paid</span>
          <div>
            <span className="text-[11px] text-neutral-500 mr-2">USD</span>
            <span className="font-display text-3xl">${order.total.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
