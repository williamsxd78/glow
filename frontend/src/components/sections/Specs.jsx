import React from "react";
import { useSettings } from "../../lib/hooks";

export default function Specs() {
  const { data: s } = useSettings();
  if (!s) return null;
  const p = s.product;
  const rows = [
    ["Product Name", p.name],
    ["Product Type", "Decorative Electric Lamp"],
    ["Outer Body", "3D Printed Flame-Shaped Structure"],
    ["Light Source", "Warm Inner Bulb"],
    ["Power Type", "Electric Wire / Plug-in"],
    ["Glow Color", "Warm Amber / Golden Glow"],
    ["Base Style", "Mini Campfire Wooden-Log Look"],
    ["Use", "Indoor Decorative Lighting"],
    ["Best For", "Bedroom, Living Room, Café, Desk, Gift, Shop Counter, Festival Decor"],
    ["Safety", "Flameless, smoke-free, ash-free decorative lamp"],
    ["Package Includes", p.package_includes],
    ["Warranty", p.warranty],
    ["Size", p.size],
    ["Wire Length", p.wire_length],
    ["Bulb Type", p.bulb_type],
  ];
  return (
    <section className="py-20 md:py-28 bg-[#0A0A0A]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs text-amber-500 tracking-[0.25em] uppercase mb-3">— The details —</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">Specifications</h2>
        </div>
        <div className="rounded-2xl border border-ink-500/60 overflow-hidden bg-[#0E0E0E]">
          {rows.map((r, i) => (
            <div
              key={i}
              className={`grid grid-cols-3 gap-2 px-4 sm:px-6 py-3.5 text-sm ${
                i % 2 ? "bg-white/[0.015]" : ""
              } border-b border-ink-500/40 last:border-b-0`}
            >
              <div className="text-neutral-500 col-span-1">{r[0]}</div>
              <div className="text-neutral-200 col-span-2">{r[1]}</div>
            </div>
          ))}
        </div>
        <div className="mt-10 bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20 rounded-2xl p-6 sm:p-8">
          <p className="text-xs text-amber-500 tracking-[0.25em] uppercase mb-2">What makes it unique?</p>
          <p className="text-neutral-300 leading-relaxed">
            GlowCamp is different from normal lamps because its outer body is not a simple plastic cover.
            It is shaped like a flame using 3D printing, and the bulb inside gives it a soft glowing fire
            effect. This combination makes it look like a small indoor campfire sculpture.
          </p>
        </div>
      </div>
    </section>
  );
}
