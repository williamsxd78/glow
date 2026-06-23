import React, { useState } from "react";
import { Package, Check } from "lucide-react";
import { api, apiErrorMessage } from "../lib/api";
import { TID } from "../constants/testIds";
import { toast } from "sonner";

const STEPS = [
  { key: "placed", label: "Order Placed" },
  { key: "confirmed", label: "Confirmed" },
  { key: "packed", label: "Packed" },
  { key: "shipped", label: "Shipped" },
  { key: "out_for_delivery", label: "Out for Delivery" },
  { key: "delivered", label: "Delivered" },
];

function statusIndex(status) {
  const i = STEPS.findIndex((s) => s.key === status);
  return i < 0 ? 0 : i;
}

export default function TrackOrder() {
  const [orderNumber, setOrderNumber] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState(null);
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setOrder(null);
    try {
      const { data } = await api.get("/orders/track", { params: { order_number: orderNumber, phone } });
      setOrder(data);
    } catch (err) {
      toast.error(apiErrorMessage(err, "Order not found"));
    } finally {
      setBusy(false);
    }
  }

  const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-4 py-3 text-sm w-full focus:border-amber-500 focus:outline-none transition";
  const idx = order ? statusIndex(order.status) : -1;

  return (
    <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-24">
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Track Your Order</h1>
      <p className="text-sm text-neutral-500 mb-8">Enter your order ID and phone number.</p>
      <form onSubmit={submit} className="grid sm:grid-cols-3 gap-3 mb-10">
        <input data-testid={TID.trackInput} className={`${inputCls} sm:col-span-1`} placeholder="GC-XXXXXXXX" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} required />
        <input data-testid={TID.trackPhone} className={`${inputCls} sm:col-span-1`} placeholder="Phone number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button data-testid={TID.trackSubmit} type="submit" disabled={busy} className="btn-primary justify-center">
          {busy ? "Searching..." : "Track"}
        </button>
      </form>

      {order && (
        <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-6 sm:p-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs text-neutral-500 tracking-wider uppercase">Order</div>
              <div className="font-display text-xl text-amber-500">{order.order_number}</div>
            </div>
            <Package size={22} className="text-amber-500" />
          </div>

          {order.status === "cancelled" ? (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm">
              This order has been cancelled.
            </div>
          ) : (
            <div className="space-y-5">
              {STEPS.map((step, i) => {
                const done = i <= idx;
                const current = i === idx;
                return (
                  <div key={step.key} className="flex items-start gap-4">
                    <div className={`mt-0.5 w-7 h-7 rounded-full flex items-center justify-center border ${done ? "bg-amber-500 border-amber-500 text-black" : "border-ink-500 text-neutral-500"}`}>
                      {done ? <Check size={14} /> : <span className="text-xs">{i + 1}</span>}
                    </div>
                    <div className="flex-1">
                      <div className={`font-display text-base ${current ? "text-amber-500" : done ? "text-white" : "text-neutral-500"}`}>{step.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-7 pt-5 border-t border-ink-500/60 text-sm grid sm:grid-cols-2 gap-2">
            <div><span className="text-neutral-500">Name: </span>{order.full_name}</div>
            <div><span className="text-neutral-500">Total: </span>${order.total.toFixed(2)}</div>
            <div className="sm:col-span-2"><span className="text-neutral-500">Address: </span>{order.address}, {order.city}, {order.state} {order.pincode}</div>
          </div>
        </div>
      )}
    </main>
  );
}
