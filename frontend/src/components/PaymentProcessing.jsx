import React, { useEffect, useState } from "react";
import { FlameMark } from "./FlameLogo";
import { Check, Lock } from "lucide-react";

const STEPS = [
  { text: "Validating your details...", duration: 1100 },
  { text: "Processing payment...", duration: 1700 },
  { text: "Confirming your order...", duration: 1100 },
  { text: "Almost done...", duration: 700 },
];

export default function PaymentProcessing({ done }) {
  const [idx, setIdx] = useState(0);
  const [showCheck, setShowCheck] = useState(false);

  useEffect(() => {
    const timers = [];
    let acc = 0;
    STEPS.forEach((step, i) => {
      acc += step.duration;
      timers.push(setTimeout(() => setIdx(i + 1), acc));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setShowCheck(true), 200);
      return () => clearTimeout(t);
    }
  }, [done]);

  const currentText = showCheck ? "Order confirmed" : STEPS[Math.min(idx, STEPS.length - 1)].text;

  return (
    <div className="fixed inset-0 z-[80] bg-black/85 backdrop-blur-md flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        {/* Flame with concentric ripples */}
        <div className="relative w-32 h-32 mx-auto mb-7">
          <span className="absolute inset-0 rounded-full bg-amber-500/15 animate-ping" />
          <span className="absolute inset-3 rounded-full bg-amber-500/20 animate-ping" style={{ animationDelay: "0.4s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 ${
              showCheck ? "bg-amber-500" : "bg-amber-500/15 border border-amber-500/40 flame-flicker"
            }`}>
              {showCheck ? <Check size={32} className="text-black" /> : <FlameMark size={36} />}
            </div>
          </div>
        </div>

        <h2 className="font-display text-2xl sm:text-3xl text-white mb-3">
          {showCheck ? "Payment successful" : "Processing securely"}
        </h2>

        <p className="text-sm text-neutral-400 min-h-[20px] transition-all">{currentText}</p>

        {/* Progress dots */}
        <div className="flex justify-center gap-1.5 mt-7">
          {STEPS.map((_, i) => (
            <span
              key={i}
              className={`h-1 rounded-full transition-all duration-500 ${
                i < idx ? "w-8 bg-amber-500" : i === idx ? "w-8 bg-amber-500/60 animate-pulse" : "w-4 bg-ink-500"
              }`}
            />
          ))}
        </div>

        <p className="mt-8 text-[11px] text-neutral-500 flex items-center justify-center gap-1.5">
          <Lock size={11} /> Encrypted · Do not refresh or close this page
        </p>
      </div>
    </div>
  );
}
