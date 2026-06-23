import React from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { CheckCircle2, Package, Truck, Phone, Home } from "lucide-react";
import { TID } from "../constants/testIds";
import { useSettings } from "../lib/hooks";

export default function ThankYou() {
  const loc = useLocation();
  const { id } = useParams();
  const order = loc.state?.order;
  const { data: s } = useSettings();

  return (
    <main data-testid={TID.thankYou} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-24">
      <div className="text-center mb-10">
        <div className="inline-flex w-16 h-16 rounded-full bg-amber-500/15 text-amber-500 items-center justify-center mb-4 pulse-ring">
          <CheckCircle2 size={32} />
        </div>
        <h1 className="font-display text-3xl sm:text-4xl mb-2">Order placed — thank you!</h1>
        <p className="text-neutral-400">A confirmation has been sent to your email.</p>
        <p className="mt-4 text-sm">Your Order ID:</p>
        <p className="font-display text-2xl text-amber-500 mt-1 tracking-wider">{id}</p>
      </div>

      {order && (
        <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-6 sm:p-8 mb-6">
          <h2 className="font-display text-xl mb-4">Order Details</h2>
          <div className="grid sm:grid-cols-2 gap-y-2 text-sm">
            <div className="text-neutral-500">Name</div><div>{order.full_name}</div>
            <div className="text-neutral-500">Email</div><div>{order.email}</div>
            <div className="text-neutral-500">Phone</div><div>{order.phone}</div>
            <div className="text-neutral-500">Address</div><div>{order.address}, {order.city}, {order.state} {order.pincode}</div>
            <div className="text-neutral-500">Payment</div><div className="capitalize">{order.payment_method.replace("_", " ")} · {order.payment_status}</div>
            <div className="text-neutral-500">Total</div><div className="text-amber-500 font-semibold">${order.total.toFixed(2)}</div>
          </div>
          <div className="mt-5 pt-5 border-t border-ink-500/60 text-xs text-neutral-400 flex items-center gap-2">
            <Truck size={14} /> Estimated delivery: 4-7 business days
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-3 gap-3">
        <Link to="/track-order" className="btn-ghost w-full justify-center"><Package size={16} /> Track Order</Link>
        {s?.whatsapp_number && (
          <a href={`https://wa.me/${s.whatsapp_number.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="btn-ghost w-full justify-center">
            <Phone size={16} /> WhatsApp Support
          </a>
        )}
        <Link to="/" className="btn-primary w-full justify-center"><Home size={16} /> Back Home</Link>
      </div>
    </main>
  );
}
