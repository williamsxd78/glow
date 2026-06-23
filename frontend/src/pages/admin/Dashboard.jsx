import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ShoppingBag, DollarSign, Package, CheckCircle, Truck, AlertCircle } from "lucide-react";

function Card({ icon: Icon, label, value, hint }) {
  return (
    <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-500 tracking-wider uppercase">{label}</div>
        <Icon size={16} className="text-amber-500" />
      </div>
      <div className="font-display text-3xl mt-2">{value}</div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);
  useEffect(() => {
    api.get("/admin/dashboard").then((r) => setD(r.data));
  }, []);
  if (!d) return <div className="text-neutral-500">Loading...</div>;
  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl mb-1">Dashboard</h1>
      <p className="text-sm text-neutral-500 mb-8">A glance at your glow business</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={ShoppingBag} label="Total Orders" value={d.total_orders} />
        <Card icon={DollarSign} label="Revenue" value={`$${d.total_revenue}`} hint="excluding cancelled" />
        <Card icon={AlertCircle} label="Pending" value={d.pending_orders} hint="placed / confirmed / packed" />
        <Card icon={Truck} label="In Transit" value={d.shipped_orders} />
        <Card icon={CheckCircle} label="Delivered" value={d.delivered_orders} />
        <Card icon={CheckCircle} label="Paid Orders" value={d.paid_orders} />
        <Card icon={Package} label="Stock" value={d.stock} />
        <Card icon={AlertCircle} label="Cancelled" value={d.cancelled_orders} />
      </div>
    </div>
  );
}
