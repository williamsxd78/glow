import React, { useEffect, useState } from "react";
import { useSettings } from "../../lib/hooks";

function diff(target) {
  const t = new Date(target).getTime() - Date.now();
  if (isNaN(t) || t <= 0) return null;
  return {
    d: Math.floor(t / (1000 * 60 * 60 * 24)),
    h: Math.floor((t / (1000 * 60 * 60)) % 24),
    m: Math.floor((t / (1000 * 60)) % 60),
    s: Math.floor((t / 1000) % 60),
  };
}

function Cell({ v, l }) {
  return (
    <div className="flex flex-col items-center">
      <div className="font-display text-2xl sm:text-3xl text-white tabular-nums">{String(v).padStart(2, "0")}</div>
      <div className="text-[10px] text-amber-500/80 tracking-widest uppercase">{l}</div>
    </div>
  );
}

export default function CountdownStrip() {
  const { data: s } = useSettings();
  const [t, setT] = useState(null);
  useEffect(() => {
    if (!s?.countdown?.enabled || !s?.countdown?.ends_at) return;
    setT(diff(s.countdown.ends_at));
    const i = setInterval(() => setT(diff(s.countdown.ends_at)), 1000);
    return () => clearInterval(i);
  }, [s]);
  if (!s?.countdown?.enabled || !t) return null;
  return (
    <div className="py-6 bg-[#0A0A0A] border-y border-ink-500/40">
      <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-5 sm:gap-10">
        <div className="text-xs sm:text-sm text-neutral-400">{s.countdown.label}</div>
        <div className="flex items-center gap-3 sm:gap-5">
          <Cell v={t.d} l="Days" />
          <span className="text-amber-500/40 font-display text-2xl">:</span>
          <Cell v={t.h} l="Hrs" />
          <span className="text-amber-500/40 font-display text-2xl">:</span>
          <Cell v={t.m} l="Min" />
          <span className="text-amber-500/40 font-display text-2xl">:</span>
          <Cell v={t.s} l="Sec" />
        </div>
      </div>
    </div>
  );
}
