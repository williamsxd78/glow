import React from "react";
import { motion } from "framer-motion";
import { Box, Flame, Wind, Trees, Home, Gift, Plug, Camera } from "lucide-react";

const FEATURES = [
  { icon: Box, title: "3D Printed Flame Body", body: "A unique flame-shaped outer structure made for a realistic glowing effect." },
  { icon: Flame, title: "Warm Inner Bulb Glow", body: "Soft amber bulb light creates a cozy golden campfire feeling." },
  { icon: Wind, title: "Flameless & Smoke-Free", body: "No real flame, no smoke, no ash, no burning. Just beautiful glow." },
  { icon: Trees, title: "Mini Campfire Look", body: "Decorative wood-log style base gives a beautiful campfire appearance." },
  { icon: Home, title: "Perfect Room Decor", body: "Ideal for bedrooms, living rooms, cafés, desks, boutique counters, cozy corners." },
  { icon: Gift, title: "Great Gift Choice", body: "Perfect for birthdays, housewarming, festivals, couples and decor lovers." },
  { icon: Plug, title: "Easy Plug-in Use", body: "Simple electric wire setup for easy daily use." },
  { icon: Camera, title: "Reel & Video Friendly", body: "Looks beautiful in shorts, room makeover reels, and night ambience shots." },
];

export default function Features() {
  return (
    <section className="py-20 md:py-32 bg-[#070707]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs text-amber-500 tracking-[0.25em] uppercase mb-3">— Why people love it —</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">Designed for cozy moments</h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.04 }}
                className="bg-[#101010] border border-ink-500/60 rounded-2xl p-6 hover:border-amber-500/40 hover:-translate-y-1 transition-all relative overflow-hidden group"
              >
                <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-amber-500/0 group-hover:bg-amber-500/10 blur-2xl transition-all" />
                <div className="w-11 h-11 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-4">
                  <Icon size={20} />
                </div>
                <h3 className="font-display text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
