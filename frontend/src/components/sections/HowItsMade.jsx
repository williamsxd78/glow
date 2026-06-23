import React from "react";
import { motion } from "framer-motion";

const STEPS = [
  { n: "01", title: "3D Flame Design", body: "The flame shape is first designed to create a realistic campfire-style glow effect." },
  { n: "02", title: "3D Printed Outer Structure", body: "The outer flame body is printed using 3D printing technology, giving the lamp a unique sculptural look." },
  { n: "03", title: "Warm Bulb Placement", body: "A warm glowing bulb is placed inside the flame structure so the light spreads softly through the flame body." },
  { n: "04", title: "Wire & Electric Setup", body: "The bulb is connected with proper wire and plug fitting to make it easy to use as a decorative electric lamp." },
  { n: "05", title: "Campfire Base Assembly", body: "The flame body is fixed on a decorative wooden-log style base to give it the look of a mini campfire." },
  { n: "06", title: "Glow Test & Finishing", body: "Each lamp is checked for glow, fitting, and final look before dispatch." },
];

export default function HowItsMade() {
  return (
    <section id="how" className="py-20 md:py-32 bg-[#0A0A0A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-xs text-amber-500 tracking-[0.25em] uppercase mb-3">— Hand-crafted in 6 steps —</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">How It's Made</h2>
        </div>

        <div className="relative">
          {/* vertical line */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/0 via-amber-600/40 to-amber-500/0 -translate-x-1/2" />

          <div className="space-y-10 md:space-y-16">
            {STEPS.map((s, i) => {
              const left = i % 2 === 0;
              return (
                <motion.div
                  key={s.n}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: i * 0.05 }}
                  className={`md:grid md:grid-cols-2 md:gap-12 items-center ${left ? "" : "md:[&>div:first-child]:order-2"}`}
                >
                  {/* card */}
                  <div className={`bg-[#121212] border border-ink-500/60 rounded-2xl p-6 md:p-8 relative ${left ? "md:mr-6" : "md:ml-6"}`}>
                    <div className="font-display text-5xl text-amber-500/30 mb-1">{s.n}</div>
                    <h3 className="font-display text-xl sm:text-2xl mb-2">{s.title}</h3>
                    <p className="text-sm sm:text-base text-neutral-400 leading-relaxed">{s.body}</p>
                  </div>
                  {/* spacer column with dot */}
                  <div className="hidden md:flex relative h-full justify-center">
                    <div className="w-3 h-3 rounded-full bg-amber-500 mt-10 shadow-[0_0_18px_rgba(255,170,0,0.7)]" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        <p className="mt-14 text-center text-xs text-neutral-500 italic">
          Note: This product is a decorative electric lamp. It does not contain real fire.
        </p>
      </div>
    </section>
  );
}
