import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Trash2, ToggleLeft, ToggleRight } from "lucide-react";

const empty = { code: "", type: "percent", value: 10, min_subtotal: 0, usage_limit: 0, active: true, description: "" };
const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm w-full focus:border-amber-500 focus:outline-none";
const labelCls = "text-xs text-neutral-500 uppercase tracking-wider mb-1.5 block";

export default function Coupons() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const load = () => api.get("/admin/coupons").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    if (!form.code.trim()) return;
    try {
      await api.post("/admin/coupons", { ...form, code: form.code.trim().toUpperCase() });
      toast.success("Coupon created");
      setForm(empty);
      load();
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Failed to create coupon");
    }
  }
  async function toggleActive(c) {
    await api.put(`/admin/coupons/${c.id}`, { active: !c.active });
    load();
  }
  async function del(id) {
    if (!window.confirm("Delete this coupon?")) return;
    await api.delete(`/admin/coupons/${id}`);
    load();
  }

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl mb-6">Coupons</h1>

      <form onSubmit={create} className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 mb-8">
        <h2 className="font-display text-lg mb-4">Create coupon</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div><label className={labelCls}>Code</label><input className={inputCls + " font-mono tracking-wider uppercase"} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="GLOW10" required /></div>
          <div>
            <label className={labelCls}>Type</label>
            <select className={inputCls} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percentage off</option>
              <option value="fixed">Fixed amount off</option>
            </select>
          </div>
          <div><label className={labelCls}>{form.type === "percent" ? "Percent (%)" : "Amount ($)"}</label><input type="number" step="0.01" className={inputCls} value={form.value} onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} required /></div>
          <div><label className={labelCls}>Min subtotal ($)</label><input type="number" step="0.01" className={inputCls} value={form.min_subtotal} onChange={(e) => setForm({ ...form, min_subtotal: parseFloat(e.target.value) || 0 })} /></div>
          <div><label className={labelCls}>Usage limit (0 = ∞)</label><input type="number" className={inputCls} value={form.usage_limit} onChange={(e) => setForm({ ...form, usage_limit: parseInt(e.target.value) || 0 })} /></div>
          <div><label className={labelCls}>Description</label><input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="10% off your order" /></div>
        </div>
        <button className="btn-primary mt-5">Create coupon</button>
      </form>

      <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-white/[0.02] text-neutral-500 uppercase text-[11px] tracking-wider">
              <tr>
                <th className="text-left px-4 py-3">Code</th>
                <th className="text-left px-4 py-3">Discount</th>
                <th className="text-left px-4 py-3">Min Subtotal</th>
                <th className="text-left px-4 py-3">Usage</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-right px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && <tr><td colSpan={6} className="text-center text-neutral-500 py-8">No coupons yet.</td></tr>}
              {list.map((c) => (
                <tr key={c.id} className="border-t border-ink-500/40">
                  <td className="px-4 py-3 font-mono tracking-wider text-amber-500">{c.code}</td>
                  <td className="px-4 py-3">{c.type === "percent" ? `${c.value}%` : `$${c.value}`}</td>
                  <td className="px-4 py-3">${c.min_subtotal}</td>
                  <td className="px-4 py-3">{c.usage_count}{c.usage_limit ? ` / ${c.usage_limit}` : ""}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => toggleActive(c)} className={`inline-flex items-center gap-1.5 text-xs ${c.active ? "text-amber-500" : "text-neutral-500"}`}>
                      {c.active ? <ToggleRight size={20} /> : <ToggleLeft size={20} />} {c.active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => del(c.id)} className="text-neutral-400 hover:text-red-400"><Trash2 size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
