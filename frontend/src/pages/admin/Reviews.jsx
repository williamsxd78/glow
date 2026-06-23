import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Trash2, EyeOff, Eye } from "lucide-react";

export default function Reviews() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ name: "", location: "", rating: 5, title: "", comment: "" });
  const load = () => api.get("/admin/reviews").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    await api.post("/admin/reviews", form);
    toast.success("Review added");
    setForm({ name: "", location: "", rating: 5, title: "", comment: "" });
    load();
  }
  async function toggleHide(r) {
    await api.put(`/admin/reviews/${r.id}`, { hidden: !r.hidden });
    load();
  }
  async function del(id) {
    if (!window.confirm("Delete this review?")) return;
    await api.delete(`/admin/reviews/${id}`);
    load();
  }
  const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm w-full focus:border-amber-500 focus:outline-none";

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl mb-6">Reviews</h1>
      <form onSubmit={create} className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 grid sm:grid-cols-2 gap-3 mb-8">
        <input className={inputCls} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input className={inputCls} placeholder="Location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input className={inputCls} placeholder="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select className={inputCls} value={form.rating} onChange={(e) => setForm({ ...form, rating: parseInt(e.target.value) })}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>
        <textarea className={`${inputCls} sm:col-span-2`} rows={3} placeholder="Comment" value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} required />
        <button className="btn-primary sm:col-span-2 justify-center">Add Review</button>
      </form>

      <div className="space-y-3">
        {list.map((r) => (
          <div key={r.id} className={`bg-[#0E0E0E] border rounded-2xl p-5 ${r.hidden ? "border-red-500/30 opacity-60" : "border-ink-500/60"}`}>
            <div className="flex justify-between items-start gap-3">
              <div>
                <div className="font-medium">{r.name} <span className="text-xs text-neutral-500">· {r.location} · {r.rating}★</span></div>
                {r.title && <div className="font-display text-base mt-1">{r.title}</div>}
                <p className="text-sm text-neutral-300 mt-1">{r.comment}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleHide(r)} className="text-neutral-400 hover:text-amber-500">
                  {r.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => del(r.id)} className="text-neutral-400 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
