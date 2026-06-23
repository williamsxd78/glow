import React from "react";
import { Star } from "lucide-react";
import { useReviews } from "../../lib/hooks";

function Stars({ n }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={14} className={i < n ? "fill-amber-400 text-amber-400" : "text-neutral-700"} />
      ))}
    </div>
  );
}

export default function Reviews() {
  const { data } = useReviews();
  if (!data) return null;
  const avg = data.length ? (data.reduce((s, r) => s + r.rating, 0) / data.length).toFixed(1) : "5.0";
  return (
    <section id="reviews" className="py-20 md:py-28 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs text-amber-500 tracking-[0.25em] uppercase mb-3">— What people say —</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">
            Loved by cozy souls everywhere
          </h2>
          <div className="mt-5 flex items-center justify-center gap-3 text-sm">
            <Stars n={5} />
            <span className="text-neutral-200 font-medium">{avg} / 5</span>
            <span className="text-neutral-500">based on {data.length}+ reviews</span>
          </div>
        </div>
        <div className="columns-1 sm:columns-2 lg:columns-3 gap-5 space-y-5">
          {data.map((r) => (
            <div
              key={r.id}
              className="break-inside-avoid bg-[#0E0E0E] border border-ink-500/60 rounded-2xl p-6 hover:border-amber-500/30 transition"
            >
              <Stars n={r.rating} />
              {r.title && <h4 className="font-display text-base mt-3">{r.title}</h4>}
              <p className="text-sm text-neutral-300 leading-relaxed mt-2">"{r.comment}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center text-xs font-medium border border-amber-500/20">
                  {r.name.slice(0, 1)}
                </div>
                <div>
                  <div className="text-sm text-neutral-200">{r.name}</div>
                  <div className="text-[11px] text-neutral-500 uppercase tracking-wider">
                    {r.verified ? "Verified Buyer" : ""} {r.location && `· ${r.location}`}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
