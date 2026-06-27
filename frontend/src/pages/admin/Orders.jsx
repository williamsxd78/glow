import React, { useEffect, useState } from "react";
import { api, API_BASE } from "../../lib/api";
import { Download } from "lucide-react";
import { toast } from "sonner";

const STATUSES = ["placed", "confirmed", "packed", "shipped", "out_for_delivery", "delivered", "cancelled"];
const PAYMENT_STATUSES = ["pending", "paid", "partial", "failed", "refunded"];

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState("");
  const [pm, setPm] = useState("");
  const [active, setActive] = useState(null);

  async function load() {
    const params = {};
    if (status) params.status = status;
    if (pm) params.payment_method = pm;
    const { data } = await api.get("/admin/orders", { params });
    setOrders(data);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [status, pm]);

  async function updateStatus(id, newStatus) {
    await api.put(`/admin/orders/${id}/status`, { status: newStatus, note: "Updated by admin" });
    toast.success("Status updated");
    load();
    setActive(null);
  }
  async function updatePayment(id, newStatus) {
    await api.put(`/admin/orders/${id}/payment`, { payment_status: newStatus });
    toast.success("Payment status updated");
    load();
  }

  function exportCsv() {
    const token = localStorage.getItem("glowcamp_admin_token");
    fetch(`${API_BASE}/admin/orders/export.csv`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.text())
      .then((text) => {
        const blob = new Blob([text], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `glowcamp-orders-${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none";

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="font-display text-2xl sm:text-3xl">Orders</h1>
        <button onClick={exportCsv} className="btn-ghost text-sm"><Download size={14} /> Export CSV</button>
      </div>
      <div className="flex flex-wrap gap-3 mb-5">
        <select className={inputCls} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className={inputCls} value={pm} onChange={(e) => setPm(e.target.value)}>
          <option value="">All payments</option>
          <option value="cod">COD</option>
          <option value="paypal">PayPal</option>
          <option value="stripe">Stripe</option>
          <option value="razorpay">Razorpay</option>
          <option value="manual_upi">Manual UPI</option>
        </select>
      </div>

      <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-neutral-500 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Order #</th>
                <th className="text-left px-4 py-3">Customer</th>
                <th className="text-left px-4 py-3">Total</th>
                <th className="text-left px-4 py-3">Payment</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Created</th>
                <th className="text-right px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 && (
                <tr><td colSpan={7} className="text-center text-neutral-500 py-10">No orders yet.</td></tr>
              )}
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-ink-500/40">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="px-4 py-3">
                    <div>{o.full_name}</div>
                    <div className="text-xs text-neutral-500">{o.email}</div>
                  </td>
                  <td className="px-4 py-3">${o.total.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <div className="capitalize">{o.payment_method.replace("_", " ")}</div>
                    <select className="mt-1 bg-[#1A1A1A] border border-ink-500/60 rounded px-1 py-0.5 text-[11px]" value={o.payment_status} onChange={(e) => updatePayment(o.id, e.target.value)}>
                      {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] ${o.status === "delivered" ? "bg-green-500/10 text-green-400" : o.status === "cancelled" ? "bg-red-500/10 text-red-400" : "bg-amber-500/10 text-amber-500"}`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{new Date(o.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => setActive(o)} className="text-amber-500 text-xs hover:underline">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {active && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setActive(null)}>
          <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-6 w-full max-w-xl max-h-[90vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <div className="text-xs text-neutral-500">Order</div>
                <div className="font-display text-xl">{active.order_number}</div>
              </div>
              <button onClick={() => setActive(null)} className="text-neutral-500">✕</button>
            </div>
            <div className="text-sm space-y-1 mb-5">
              <div><span className="text-neutral-500">Customer:</span> {active.full_name}</div>
              <div><span className="text-neutral-500">Phone:</span> {active.phone}</div>
              <div><span className="text-neutral-500">Email:</span> {active.email}</div>
              <div><span className="text-neutral-500">Address:</span> {active.address}, {active.city}, {active.state} {active.pincode}</div>
              {(active.billing_email || active.billing_phone) && (
                <div className="mt-2 pt-2 border-t border-ink-500/40">
                  <div className="text-[10px] uppercase tracking-widest text-amber-500 mb-1">Billing contact (card)</div>
                  {active.billing_email && <div><span className="text-neutral-500">Billing email:</span> {active.billing_email}</div>}
                  {active.billing_phone && <div><span className="text-neutral-500">Billing phone:</span> {active.billing_phone}</div>}
                </div>
              )}
              {active.custom_fields && Object.keys(active.custom_fields).length > 0 && (
                <div className="mt-2 pt-2 border-t border-ink-500/40">
                  <div className="text-[10px] uppercase tracking-widest text-amber-500 mb-1">Card form extras</div>
                  {Object.entries(active.custom_fields).map(([k, v]) => (
                    <div key={k}><span className="text-neutral-500">{k.replace(/_/g, " ")}:</span> {v}</div>
                  ))}
                </div>
              )}
              <div><span className="text-neutral-500">Notes:</span> {active.notes || "—"}</div>
            </div>
            <div className="space-y-1 mb-5 text-sm">
              {active.items.map((it, i) => (
                <div key={i} className="flex justify-between"><span>{it.title} × {it.quantity}</span><span>${it.line_total.toFixed(2)}</span></div>
              ))}
              <div className="border-t border-ink-500/60 pt-1.5 flex justify-between font-semibold"><span>Total</span><span>${active.total.toFixed(2)}</span></div>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {STATUSES.map((st) => (
                <button key={st} onClick={() => updateStatus(active.id, st)} className={`text-xs px-3 py-1.5 rounded-full border ${active.status === st ? "bg-amber-500 text-black border-amber-500" : "border-ink-500 text-neutral-300 hover:border-amber-500/60"}`}>
                  {st}
                </button>
              ))}
            </div>
            <div className="text-xs">
              <div className="text-neutral-500 mb-2 uppercase tracking-wider">Timeline</div>
              <div className="space-y-1">
                {active.timeline.map((t, i) => (
                  <div key={i} className="flex justify-between text-neutral-400"><span>{t.status}{t.note ? ` — ${t.note}` : ""}</span><span>{new Date(t.at).toLocaleString()}</span></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
