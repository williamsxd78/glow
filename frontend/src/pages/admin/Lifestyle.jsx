import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import { Trash2, ArrowUp, ArrowDown } from "lucide-react";
import ImageUpload, { resolveImageUrl } from "../../components/ImageUpload";

export default function Lifestyle() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ url: "", title: "", order: 0 });
  const load = () => api.get("/admin/lifestyle").then((r) => setList(r.data));
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    if (!form.url.trim()) {
      toast.error("Add an image URL or upload one");
      return;
    }
    await api.post("/admin/lifestyle", form);
    toast.success("Scene added");
    setForm({ url: "", title: "", order: 0 });
    load();
  }
  async function move(g, dir) {
    await api.put(`/admin/lifestyle/${g.id}`, { order: g.order + dir });
    load();
  }
  async function del(id) {
    if (!window.confirm("Delete this scene?")) return;
    await api.delete(`/admin/lifestyle/${id}`);
    load();
  }
  const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm w-full focus:border-amber-500 focus:outline-none";

  return (
    <div>
      <h1 className="font-display text-2xl sm:text-3xl mb-2">Lifestyle</h1>
      <p className="text-sm text-neutral-500 mb-6">
        Powers the <span className="text-amber-500">&ldquo;Where it looks beautiful&rdquo;</span> section on the homepage.
        Each tile shows a scene photo with a short caption.
      </p>
      <form onSubmit={create} className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 mb-8 space-y-3">
        <ImageUpload
          value={form.url}
          onChange={(url) => setForm((f) => ({ ...f, url }))}
          label="Scene photo"
          testIdPrefix="lifestyle"
        />
        <div className="grid sm:grid-cols-2 gap-3">
          <input
            data-testid="lifestyle-title-input"
            className={inputCls}
            placeholder="Caption (e.g. Bedroom Night Glow)"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <input
            data-testid="lifestyle-order-input"
            type="number"
            className={inputCls}
            placeholder="Order"
            value={form.order}
            onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 0 })}
          />
        </div>
        <button data-testid="lifestyle-submit" className="btn-primary w-full justify-center">Add Scene</button>
      </form>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {list.map((g) => (
          <div key={g.id} className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl overflow-hidden">
            <img src={resolveImageUrl(g.url)} alt={g.title} className="w-full aspect-[3/4] object-cover" />
            <div className="p-3 flex items-center justify-between">
              <div className="text-xs text-neutral-300 truncate flex-1">{g.title || <span className="text-neutral-500">(no caption)</span>}</div>
              <div className="flex gap-1">
                <button data-testid={`lifestyle-up-${g.id}`} onClick={() => move(g, -1)} className="text-neutral-400 hover:text-amber-500 p-1"><ArrowUp size={14} /></button>
                <button data-testid={`lifestyle-down-${g.id}`} onClick={() => move(g, 1)} className="text-neutral-400 hover:text-amber-500 p-1"><ArrowDown size={14} /></button>
                <button data-testid={`lifestyle-delete-${g.id}`} onClick={() => del(g.id)} className="text-neutral-400 hover:text-red-400 p-1"><Trash2 size={14} /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
