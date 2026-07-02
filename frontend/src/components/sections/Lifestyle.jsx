import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { api, resolveImageUrl } from "../../lib/api";

export default function Lifestyle() {
  const [scenes, setScenes] = useState([]);

  useEffect(() => {
    api.get("/lifestyle").then((r) => setScenes(r.data || [])).catch(() => {});
  }, []);

  if (!scenes.length) return null;

  return (
    <section className="py-20 md:py-32 bg-[#0A0A0A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between mb-12 gap-4">
          <div>
            <p className="text-xs text-amber-500 tracking-[0.25em] uppercase mb-3">— Around the home —</p>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">Where it looks beautiful</h2>
          </div>
          <p className="text-neutral-400 max-w-sm text-sm">
            Whether you want a cozy bedroom mood, a romantic dinner, or that perfect Reels shot —
            GlowCamp transforms any corner into a tiny cabin moment.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {scenes.map((s, i) => (
            <motion.div
              key={s.id || i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className={`relative overflow-hidden rounded-2xl border border-ink-500/60 aspect-[3/4] group ${i % 5 === 0 ? "md:row-span-2 md:aspect-auto" : ""}`}
              data-testid={`lifestyle-tile-${i}`}
            >
              <img
                src={resolveImageUrl(s.url)}
                alt={s.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0" />
              {s.title && (
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="font-display text-sm sm:text-base text-white">{s.title}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
