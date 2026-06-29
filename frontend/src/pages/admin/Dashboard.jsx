import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { ShoppingBag, DollarSign, Package, CheckCircle, Truck, AlertCircle, Users, Activity, Eye } from "lucide-react";

function Card({ icon: Icon, label, value, hint, accent }) {
  return (
    <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5">
      <div className="flex items-center justify-between">
        <div className="text-xs text-neutral-500 tracking-wider uppercase">{label}</div>
        <Icon size={16} className={accent || "text-amber-500"} />
      </div>
      <div className="font-display text-3xl mt-2">{value}</div>
      {hint && <div className="text-xs text-neutral-500 mt-1">{hint}</div>}
    </div>
  );
}

function PulseDot() {
  return (
    <span className="relative inline-flex h-2 w-2 mr-1.5">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
    </span>
  );
}

function LiveCard({ label, value, sub }) {
  return (
    <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5">
      <div className="text-[10px] text-neutral-500 tracking-widest uppercase">{label}</div>
      <div className="font-display text-3xl mt-1.5 flex items-baseline gap-2">
        <span data-testid={`live-${label.toLowerCase().replace(/\s+/g, "-")}`}>{value}</span>
        {sub && <span className="text-xs text-neutral-500 normal-case font-sans tracking-normal">{sub}</span>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [a, setA] = useState(null);
  const [aErr, setAErr] = useState("");

  useEffect(() => {
    api.get("/admin/dashboard").then((r) => setD(r.data));
  }, []);

  // Live analytics — polls every 5s
  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.get("/admin/analytics")
        .then((r) => { if (!cancelled) { setA(r.data); setAErr(""); } })
        .catch((e) => {
          if (cancelled) return;
          const status = e?.response?.status;
          const detail = e?.response?.data?.detail || e?.message || "Unknown error";
          setAErr(status ? `${status} — ${detail}` : String(detail));
        });
    };
    load();
    const id = setInterval(load, 5000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  if (!d) return <div className="text-neutral-500">Loading...</div>;

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl mb-1">Dashboard</h1>
      <p className="text-sm text-neutral-500 mb-8">A glance at your glow business</p>

      {/* ============ LIVE TRAFFIC ============ */}
      <div className="flex items-center gap-2 mb-3">
        <PulseDot />
        <h2 className="text-sm uppercase tracking-widest text-neutral-400">Live Traffic</h2>
        <span className="text-[10px] text-neutral-600">auto-refreshes every 5s</span>
      </div>
      {aErr && (
        <div
          data-testid="live-traffic-error"
          className="mb-3 rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 text-xs px-3 py-2 font-mono"
        >
          analytics API failed: {aErr}
        </div>
      )}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <LiveCard
          label="Active now"
          value={a ? a.active_now : "..."}
          sub={a ? `${a.on_home} on home` : ""}
        />
        <LiveCard
          label="On product page"
          value={a ? a.on_product : "..."}
        />
        <LiveCard
          label="On cart"
          value={a ? a.on_cart : "..."}
        />
        <LiveCard
          label="On checkout"
          value={a ? a.on_checkout : "..."}
        />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card icon={Users} accent="text-emerald-400" label="Visitors today" value={a ? a.visitors_today : "..."} hint={a ? `${a.page_views_today} page views` : ""} testId="live-visitors-today" />
        <Card icon={Users} accent="text-emerald-400" label="Visitors (7d)" value={a ? a.visitors_7d : "..."} testId="live-visitors-7d" />
        <Card icon={Users} accent="text-emerald-400" label="Visitors (30d)" value={a ? a.visitors_30d : "..."} testId="live-visitors-30d" />
        <Card icon={Activity} accent="text-emerald-400" label="Active sessions" value={a ? a.active_now : "..."} hint="last 60s" testId="live-active-sessions" />
      </div>

      {/* ============ TOP PAGES ============ */}
      {a && a.top_pages_7d && a.top_pages_7d.length > 0 && (
        <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Eye size={14} className="text-amber-500" />
            <h3 className="text-xs uppercase tracking-widest text-neutral-400">Top pages — last 7 days</h3>
          </div>
          <div className="space-y-2">
            {a.top_pages_7d.map((p) => (
              <div key={p.path} className="flex items-center justify-between text-sm py-1.5 border-b border-ink-500/40 last:border-0">
                <span className="font-mono text-neutral-300">{p.path}</span>
                <span className="text-neutral-500">
                  <span className="text-neutral-200">{p.views}</span> views
                  <span className="text-neutral-600 mx-2">·</span>
                  <span className="text-neutral-200">{p.unique}</span> unique
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============ BUSINESS METRICS ============ */}
      <h2 className="text-sm uppercase tracking-widest text-neutral-400 mb-3">Orders & Inventory</h2>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={ShoppingBag} label="Total Orders" value={d.total_orders} />
        <Card icon={DollarSign} label="Revenue" value={`$${d.total_revenue}`} hint="excluding cancelled" />
        <Card icon={AlertCircle} label="Pending" value={d.pending_orders} hint="placed / confirmed / packed" />
        <Card icon={Truck} label="Shipped / In Transit" value={d.shipped_orders} />
        <Card icon={CheckCircle} label="Delivered" value={d.delivered_orders} />
        <Card icon={CheckCircle} label="Paid Orders" value={d.paid_orders} />
        <Card icon={Package} label="Stock" value={d.stock} />
        <Card icon={AlertCircle} label="Cancelled" value={d.cancelled_orders} />
      </div>
    </div>
  );
}
