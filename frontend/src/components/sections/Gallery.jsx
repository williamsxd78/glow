import React from "react";
import { useGallery } from "../../lib/hooks";

export default function Gallery() {
  const { data } = useGallery();
  if (!data || data.length === 0) return null;
  return (
    <section id="gallery" className="py-20 md:py-28 bg-[#070707]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-xs text-amber-500 tracking-[0.25em] uppercase mb-3">— Closer look —</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">Product Gallery</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 snap-x snap-mandatory">
          {data.map((g) => (
            <div key={g.id} className="shrink-0 w-64 sm:w-80 snap-start">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden border border-ink-500/60 bg-black">
                <img src={g.url} alt={g.alt} className="w-full h-full object-cover hover:scale-105 transition-transform duration-700" />
              </div>
              {g.alt && <p className="mt-3 text-xs text-neutral-400">{g.alt}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
