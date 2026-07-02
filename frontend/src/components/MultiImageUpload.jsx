import React, { useRef, useState } from "react";
import { Upload, Loader2, X, ArrowLeft, ArrowRight, Star } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage, resolveImageUrl } from "../lib/api";

/**
 * MultiImageUpload — controlled input for an array of image URLs.
 * Parent owns `value: string[]` and receives updates via `onChange(nextArray)`.
 * The first image in the array is treated as the primary/main image by consumers.
 */
export default function MultiImageUpload({
  value = [],
  onChange,
  label = "photos",
  testIdPrefix = "multi-img",
  max = 12,
}) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const list = Array.isArray(value) ? value : [];

  async function onPick(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = Math.max(0, max - list.length);
    if (remaining === 0) {
      toast.error(`You can add up to ${max} images`);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const picked = files.slice(0, remaining);
    setBusy(true);
    const uploaded = [];
    try {
      for (const f of picked) {
        if (!f.type.startsWith("image/")) {
          toast.error(`${f.name}: not an image`);
          continue;
        }
        if (f.size > 8 * 1024 * 1024) {
          toast.error(`${f.name}: must be 8MB or smaller`);
          continue;
        }
        const fd = new FormData();
        fd.append("file", f);
        try {
          const { data } = await api.post("/admin/uploads", fd, {
            headers: { "Content-Type": "multipart/form-data" },
          });
          uploaded.push(data.url);
        } catch (err) {
          toast.error(apiErrorMessage(err, `${f.name}: upload failed`));
        }
      }
      if (uploaded.length) {
        onChange([...list, ...uploaded]);
        toast.success(`Added ${uploaded.length} image${uploaded.length > 1 ? "s" : ""}`);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function addUrl() {
    const u = urlInput.trim();
    if (!u) return;
    if (list.length >= max) {
      toast.error(`You can add up to ${max} images`);
      return;
    }
    onChange([...list, u]);
    setUrlInput("");
  }

  function remove(i) {
    const next = list.filter((_, idx) => idx !== i);
    onChange(next);
  }
  function move(i, dir) {
    const j = i + dir;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }
  function makePrimary(i) {
    if (i === 0) return;
    const next = [...list];
    const [item] = next.splice(i, 1);
    next.unshift(item);
    onChange(next);
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onPick}
        multiple
        className="hidden"
        data-testid={`${testIdPrefix}-input`}
      />

      {/* Existing images grid */}
      {list.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
          {list.map((url, i) => (
            <div
              key={url + i}
              data-testid={`${testIdPrefix}-tile-${i}`}
              className={`relative aspect-square rounded-lg overflow-hidden border ${
                i === 0 ? "border-amber-500" : "border-ink-500/60"
              } bg-[#161616] group`}
            >
              <img src={resolveImageUrl(url)} alt="" className="w-full h-full object-cover" />

              {i === 0 && (
                <div className="absolute top-1 left-1 bg-amber-500 text-black text-[9px] font-semibold tracking-widest uppercase px-1.5 py-0.5 rounded flex items-center gap-1">
                  <Star size={9} fill="currentColor" /> Main
                </div>
              )}

              {/* Hover / mobile-tap controls */}
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-1.5 flex items-center justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    data-testid={`${testIdPrefix}-left-${i}`}
                    className="p-1 rounded bg-black/60 hover:bg-amber-500 hover:text-black disabled:opacity-30 disabled:hover:bg-black/60 disabled:hover:text-white"
                    title="Move left"
                  >
                    <ArrowLeft size={11} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === list.length - 1}
                    data-testid={`${testIdPrefix}-right-${i}`}
                    className="p-1 rounded bg-black/60 hover:bg-amber-500 hover:text-black disabled:opacity-30 disabled:hover:bg-black/60 disabled:hover:text-white"
                    title="Move right"
                  >
                    <ArrowRight size={11} />
                  </button>
                  {i !== 0 && (
                    <button
                      type="button"
                      onClick={() => makePrimary(i)}
                      data-testid={`${testIdPrefix}-primary-${i}`}
                      className="p-1 rounded bg-black/60 hover:bg-amber-500 hover:text-black"
                      title="Set as main image"
                    >
                      <Star size={11} />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => remove(i)}
                  data-testid={`${testIdPrefix}-remove-${i}`}
                  className="p-1 rounded bg-black/60 hover:bg-red-500 hover:text-white"
                  title="Remove"
                >
                  <X size={11} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add controls */}
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addUrl();
            }
          }}
          placeholder="Paste image URL and press Enter"
          data-testid={`${testIdPrefix}-url-input`}
          className="flex-1 bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || list.length >= max}
          data-testid={`${testIdPrefix}-upload-btn`}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-ink-500/70 hover:border-amber-500 hover:text-amber-500 text-xs disabled:opacity-50 whitespace-nowrap"
        >
          {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
          {busy ? "Uploading..." : `Upload ${label}`}
        </button>
      </div>

      <p className="text-[11px] text-neutral-500 mt-2">
        {list.length}/{max} images · first image is used as the main image
      </p>
    </div>
  );
}
