import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Trash2, EyeOff, Eye } from "lucide-react";

export default function Faqs() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ question: "", answer: "", order: 0 });
  const load = () => api.get("/admin/faqs").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    await api.post("/admin/faqs", form);
    toast.success("FAQ added");
    setForm({ question: "", answer: "", order: 0 });
    load();
  }
  async function update(f, field, val) {
    await api.put(`/admin/faqs/${f.id}`, { [field]: val });
    load();
  }
  async function del(id) {
    if (!window.confirm("Delete this FAQ?")) return;
    await api.delete(`/admin/faqs/${id}`);
    load();
  }
  const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm w-full focus:border-amber-500 focus:outline-none";

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl mb-6">FAQs</h1>
      <form onSubmit={create} className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 grid gap-3 mb-8">
        <input className={inputCls} placeholder="Question" value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} required />
        <textarea rows={3} className={inputCls} placeholder="Answer" value={form.answer} onChange={(e) => setForm({ ...form, answer: e.target.value })} required />
        <input type="number" className={inputCls} placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
        <button className="btn-primary justify-center">Add FAQ</button>
      </form>

      <div className="space-y-3">
        {list.map((f) => (
          <div key={f.id} className={`bg-[#0E0E0E] border rounded-2xl p-5 ${f.hidden ? "border-red-500/30 opacity-60" : "border-ink-500/60"}`}>
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1">
                <div className="font-display text-base">{f.question}</div>
                <p className="text-sm text-neutral-300 mt-2">{f.answer}</p>
                <div className="text-xs text-neutral-500 mt-2">Order: {f.order}</div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => update(f, "hidden", !f.hidden)} className="text-neutral-400 hover:text-amber-500">
                  {f.hidden ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <button onClick={() => del(f.id)} className="text-neutral-400 hover:text-red-400"><Trash2 size={16} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
