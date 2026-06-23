import React from "react";
import { motion } from "framer-motion";

export default function Story() {
  return (
    <section id="story" className="py-20 md:py-32 bg-[#0A0A0A] relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-xs sm:text-sm text-amber-500 tracking-[0.25em] uppercase mb-5">
            — The GlowCamp Story —
          </p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-7">
            Not just a lamp.<br />
            <span className="text-gradient-amber">A little campfire moment.</span>
          </h2>
          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed">
            Most lights only brighten a room. GlowCamp changes the mood of the room. Its
            3D printed flame body and warm inner bulb create a soft golden glow that feels
            relaxing, cozy, and beautiful. Built for bedrooms, living rooms, cafés, boutique
            counters, gift tables, romantic setups, meditation corners — and anyone who
            loves unique decor.
          </p>
          <p className="mt-8 font-display italic text-amber-500 text-lg sm:text-xl">
            "Feel the warmth, without the flame."
          </p>
        </motion.div>
      </div>
    </section>
  );
}
