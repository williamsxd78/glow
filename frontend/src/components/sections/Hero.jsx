import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, Sparkles, Wind, Heart, Home, Boxes } from "lucide-react";
import { useSettings } from "../../lib/hooks";
import { TID } from "../../constants/testIds";

export default function Hero() {
  const { data: s } = useSettings();
  if (!s) return null;
  const p = s.product;

  const badges = [
    { icon: Boxes, label: "3D Printed Flame" },
    { icon: Sparkles, label: "Warm Inner Glow" },
    { icon: Wind, label: "Flameless & Safe" },
    { icon: Heart, label: "Perfect Gift" },
    { icon: Home, label: "Indoor Decor" },
  ];

  function scrollTo(id) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <section className="relative min-h-[92vh] ambient-dark grain overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-20 lg:pt-16 lg:pb-28 grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* LEFT TEXT */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs tracking-[0.18em] uppercase mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            Limited Launch Offer
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-6">
            Bring the<br />
            <span className="text-gradient-amber">Campfire Glow</span><br />
            Home.
          </h1>
          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed max-w-xl mb-8">
            A 3D printed flame-shaped lamp with a warm inner bulb glow, designed to create
            a cozy mini campfire feeling — without real fire, smoke, or ash.
          </p>

          {/* Price row */}
          <div data-testid={TID.heroPrice} className="flex items-end gap-3 mb-7">
            <span className="font-display text-4xl sm:text-5xl text-white">${p.sale_price}</span>
            <span className="text-neutral-500 line-through text-lg mb-1">${p.original_price}</span>
            <span className="ml-2 text-[11px] uppercase tracking-widest text-amber-500 mb-2">
              Save {Math.round(((p.original_price - p.sale_price) / p.original_price) * 100)}%
            </span>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              data-testid={TID.heroOrder}
              onClick={() => scrollTo("offers")}
              className="btn-primary"
            >
              Order Now <ArrowRight size={18} />
            </button>
            <button
              data-testid={TID.heroSeeHow}
              onClick={() => scrollTo("how")}
              className="btn-ghost"
            >
              <PlayCircle size={18} /> See How It's Made
            </button>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap gap-x-5 gap-y-3">
            {badges.map((b, i) => {
              const Icon = b.icon;
              return (
                <div key={i} className="flex items-center gap-2 text-xs text-neutral-400">
                  <Icon size={14} className="text-amber-500" />
                  {b.label}
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* RIGHT PRODUCT VISUAL */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease: "easeOut" }}
          className="relative aspect-square mx-auto w-full max-w-[520px]"
        >
          {/* glow halo */}
          <div className="absolute inset-12 flame-flicker" />
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-amber-500/0 via-amber-600/10 to-transparent blur-3xl" />
          <img
            src={p.main_image}
            alt={p.name}
            className="relative z-10 w-full h-full object-cover rounded-3xl border border-ink-500/60 floaty"
          />
          {/* corner badge */}
          <div className="absolute -top-2 -left-2 z-20 bg-black border border-amber-500/40 rounded-2xl px-3 py-2 text-[11px] text-amber-500 tracking-widest uppercase glow-amber-soft">
            New • 2026
          </div>
        </motion.div>
      </div>
    </section>
  );
}
