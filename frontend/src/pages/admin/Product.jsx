import React, { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { toast } from "sonner";
import ImageUpload from "../../components/ImageUpload";

const inputCls = "bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm w-full focus:border-amber-500 focus:outline-none";
const labelCls = "text-xs text-neutral-500 uppercase tracking-wider mb-1.5 block";

export default function ProductPage() {
  const [s, setS] = useState(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { api.get("/admin/settings").then((r) => setS(r.data)); }, []);

  function set(path, value) {
    setS((cur) => {
      const copy = JSON.parse(JSON.stringify(cur));
      const parts = path.split(".");
      let o = copy;
      for (let i = 0; i < parts.length - 1; i++) o = o[parts[i]];
      o[parts[parts.length - 1]] = value;
      return copy;
    });
  }

  function updateOffer(idx, field, value) {
    setS((cur) => {
      const copy = JSON.parse(JSON.stringify(cur));
      copy.offers[idx][field] = value;
      return copy;
    });
  }

  async function save() {
    setBusy(true);
    try {
      await api.put("/admin/settings", s);
      toast.success("Product saved");
    } finally { setBusy(false); }
  }

  if (!s) return <div className="text-neutral-500">Loading...</div>;
  const p = s.product;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-display text-2xl sm:text-3xl">Product</h1>
        <button onClick={save} disabled={busy} className="btn-primary text-sm">{busy ? "Saving..." : "Save"}</button>
      </div>

      <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 sm:p-6 mb-6">
        <h2 className="font-display text-lg mb-4">Product Details</h2>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="sm:col-span-2">
            <label className={labelCls}>Name</label>
            <input className={inputCls} value={p.name} onChange={(e) => set("product.name", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Tagline</label>
            <input className={inputCls} value={p.tagline} onChange={(e) => set("product.tagline", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Description</label>
            <textarea rows={3} className={inputCls} value={p.description} onChange={(e) => set("product.description", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <label className={labelCls}>Main Image</label>
            <ImageUpload
              value={p.main_image}
              onChange={(url) => set("product.main_image", url)}
              label="Main Image"
              testIdPrefix="product-main"
            />
          </div>
          <div><label className={labelCls}>Original Price ($)</label><input type="number" step="0.01" className={inputCls} value={p.original_price} onChange={(e) => set("product.original_price", parseFloat(e.target.value) || 0)} /></div>
          <div><label className={labelCls}>Sale Price ($)</label><input type="number" step="0.01" className={inputCls} value={p.sale_price} onChange={(e) => set("product.sale_price", parseFloat(e.target.value) || 0)} /></div>
          <div><label className={labelCls}>Stock</label><input type="number" className={inputCls} value={p.stock} onChange={(e) => set("product.stock", parseInt(e.target.value) || 0)} /></div>
          <div><label className={labelCls}>Stock Urgency Text</label><input className={inputCls} value={p.stock_urgency_text} onChange={(e) => set("product.stock_urgency_text", e.target.value)} /></div>
          <div><label className={labelCls}>Warranty</label><input className={inputCls} value={p.warranty} onChange={(e) => set("product.warranty", e.target.value)} /></div>
          <div><label className={labelCls}>Size</label><input className={inputCls} value={p.size} onChange={(e) => set("product.size", e.target.value)} /></div>
          <div><label className={labelCls}>Wire Length</label><input className={inputCls} value={p.wire_length} onChange={(e) => set("product.wire_length", e.target.value)} /></div>
          <div><label className={labelCls}>Bulb Type</label><input className={inputCls} value={p.bulb_type} onChange={(e) => set("product.bulb_type", e.target.value)} /></div>
          <div className="sm:col-span-2"><label className={labelCls}>Package Includes</label><input className={inputCls} value={p.package_includes} onChange={(e) => set("product.package_includes", e.target.value)} /></div>
        </div>
      </div>

      <div className="bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-5 sm:p-6">
        <h2 className="font-display text-lg mb-4">Offers / Bundles</h2>
        <div className="space-y-5">
          {s.offers.map((o, i) => (
            <div key={o.key} className="border border-ink-500/60 rounded-xl p-4">
              <div className="text-xs text-amber-500 tracking-widest uppercase mb-3">{o.key}</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div><label className={labelCls}>Title</label><input className={inputCls} value={o.title} onChange={(e) => updateOffer(i, "title", e.target.value)} /></div>
                <div><label className={labelCls}>Subtitle</label><input className={inputCls} value={o.subtitle} onChange={(e) => updateOffer(i, "subtitle", e.target.value)} /></div>
                <div><label className={labelCls}>Quantity</label><input type="number" className={inputCls} value={o.quantity} onChange={(e) => updateOffer(i, "quantity", parseInt(e.target.value) || 1)} /></div>
                <div><label className={labelCls}>Price ($)</label><input type="number" step="0.01" className={inputCls} value={o.price} onChange={(e) => updateOffer(i, "price", parseFloat(e.target.value) || 0)} /></div>
                <div><label className={labelCls}>Original Price ($)</label><input type="number" step="0.01" className={inputCls} value={o.original_price || 0} onChange={(e) => updateOffer(i, "original_price", parseFloat(e.target.value) || 0)} /></div>
                <div><label className={labelCls}>Badge</label><input className={inputCls} value={o.badge || ""} onChange={(e) => updateOffer(i, "badge", e.target.value)} /></div>
                <div className="sm:col-span-2"><label className={labelCls}>Description</label><input className={inputCls} value={o.description} onChange={(e) => updateOffer(i, "description", e.target.value)} /></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
