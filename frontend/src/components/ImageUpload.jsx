import React, { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api, apiErrorMessage, resolveImageUrl } from "../lib/api";

/**
 * Admin image uploader. On successful upload it calls `onChange(url)`
 * with a backend-served URL like `/api/files/glowcamp/uploads/admin/<uuid>.png`.
 * The parent owns the actual url state — this component is a controlled UI.
 */
export default function ImageUpload({ value, onChange, label = "Image", testIdPrefix = "img" }) {
  const inputRef = useRef(null);
  const [busy, setBusy] = useState(false);

  const previewSrc = resolveImageUrl(value);

  async function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be 8MB or smaller");
      return;
    }
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/admin/uploads", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      onChange(data.url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(apiErrorMessage(err, "Upload failed"));
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        onChange={onPick}
        className="hidden"
        data-testid={`${testIdPrefix}-input`}
      />
      <div className="flex items-stretch gap-3">
        {previewSrc ? (
          <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-ink-500/60 shrink-0 bg-[#161616]">
            <img src={previewSrc} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange("")}
              data-testid={`${testIdPrefix}-clear`}
              className="absolute top-0.5 right-0.5 bg-black/70 hover:bg-red-500/80 rounded p-0.5"
              title="Clear image"
            >
              <X size={12} className="text-white" />
            </button>
          </div>
        ) : (
          <div className="w-20 h-20 rounded-lg border border-dashed border-ink-500/60 shrink-0 bg-[#0F0F0F] flex items-center justify-center text-neutral-600 text-[10px] uppercase tracking-widest">
            No image
          </div>
        )}
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste image URL or upload below"
            data-testid={`${testIdPrefix}-url`}
            className="w-full bg-[#1A1A1A] border border-ink-500/70 rounded-lg px-3 py-2 text-sm focus:border-amber-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            data-testid={`${testIdPrefix}-upload-btn`}
            className="self-start inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-ink-500/70 hover:border-amber-500 hover:text-amber-500 text-xs disabled:opacity-50"
          >
            {busy ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
            {busy ? "Uploading..." : "Upload " + label}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Helper for places that already render an <img/> — resolves relative
 * backend paths to fully-qualified URLs the browser can load.
 * Re-export from api.js for convenience.
 */
export { resolveImageUrl };
