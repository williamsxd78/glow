import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useSettings } from "../../lib/hooks";

export default function VideoSection() {
  const { data: s } = useSettings();
  const nav = useNavigate();
  if (!s) return null;

  return (
    <section className="py-20 md:py-32 bg-[#070707] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-14 items-center">
        {/* Phone-style frame */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="flex justify-center"
        >
          <div className="phone-frame w-full max-w-[300px] sm:max-w-[340px]">
            <div className="aspect-[9/16] rounded-[2rem] overflow-hidden bg-black">
              <iframe
                src={`${s.video_url}?autoplay=0&modestbranding=1&rel=0`}
                title="GlowCamp video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Text */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          <p className="text-xs text-amber-500 tracking-[0.2em] uppercase mb-4">— See it live —</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-[1.1] mb-6">
            Watch the Glow<br />in Real Life.
          </h2>
          <p className="text-base sm:text-lg text-neutral-300 leading-relaxed mb-8 max-w-xl">
            {s.video_caption}
          </p>
          <button onClick={() => nav("/product")} className="btn-primary">
            Order This Glow Lamp <ArrowRight size={18} />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
