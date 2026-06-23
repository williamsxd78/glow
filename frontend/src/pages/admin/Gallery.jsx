import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";

export default function Gallery() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ url: "", alt: "", order: 0 });
  const load = () => api.get("/admin/gallery").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    await api.post("/admin/gallery", form);
    toast.success("Image added");
    setForm({ url: "", alt: "", order: 0 });
    load();
  }
  async function move(g, dir) {
    await api.put(`/admin/gallery/${g.id}`, { order: g.order + dir });
    load();
  }
  async function del(id) {
    if (!window.confirm("Delete this image?")) return;
    await api.delete(`/admin/gallery/${id}`);
    load();
  }
  const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm w-full focus:border-amber-500 focus:outline-none";

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl mb-6">Gallery</h1>
      <form onSubmit={create} className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 grid sm:grid-cols-2 gap-3 mb-8">
        <input className={`${inputCls} sm:col-span-2`} placeholder="Image URL" value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} required />
        <input className={inputCls} placeholder="Alt text" value={form.alt} onChange={(e) => setForm({ ...form, alt: e.target.value })} />
        <input type="number" className={inputCls} placeholder="Order" value={form.order} onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })} />
        <button className="btn-primary sm:col-span-2 justify-center">Add Image</button>
      </form>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((g) => (
          <div key={g.id} className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl overflow-hidden">
            <img src={g.url} alt={g.alt} className="w-full aspect-square object-cover" />
            <div className="p-3 flex items-center justify-between">
              <div className="text-xs text-neutral-400 truncate flex-1">{g.alt || g.url}</div>
              <div className="flex gap-1">
                <button onClick={() => move(g, -1)} className="text-neutral-400 hover:text-amber-500 p-1"><ArrowUp size={14} /></button>
                <button onClick={() => move(g, 1)} className="text-neutral-400 hover:text-amber-500 p-1"><ArrowDown size={14} /></button>
                <button onClick={() => del(g.id)} className="text-neutral-400 hover:text-red-400 p-1"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
