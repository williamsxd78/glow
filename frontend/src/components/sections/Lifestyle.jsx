import React from "react";
import { motion } from "framer-motion";

const SCENES = [
  { title: "Bedroom Night Glow", url: "https://images.pexels.com/photos/26535233/pexels-photo-26535233.jpeg" },
  { title: "Café Table Decor", url: "https://images.unsplash.com/photo-1542372147193-a7aca54189cd?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA2ODl8MHwxfHNlYXJjaHwxfHxkYXJrJTIwbW9vZHklMjBjYWZlJTIwdGFibGV8ZW58MHx8fHwxNzgyMTk5MDcyfDA&ixlib=rb-4.1.0&q=85" },
  { title: "Living Room Corner", url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
  { title: "Reading Nook", url: "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
  { title: "Romantic Setup", url: "https://images.unsplash.com/photo-1543083477-4f785aeafaa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
  { title: "Desk Ambience", url: "https://images.pexels.com/photos/6489045/pexels-photo-6489045.jpeg" },
  { title: "Shop Counter", url: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
  { title: "Meditation Corner", url: "https://images.unsplash.com/photo-1545389336-cf090694435e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" },
];

export default function Lifestyle() {
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
          {SCENES.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.04 }}
              className={`relative overflow-hidden rounded-2xl border border-ink-500/60 aspect-[3/4] group ${i % 5 === 0 ? "md:row-span-2 md:aspect-auto" : ""}`}
            >
              <img
                src={s.url}
                alt={s.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/0 to-black/0" />
              <div className="absolute bottom-3 left-3 right-3">
                <p className="font-display text-sm sm:text-base text-white">{s.title}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
