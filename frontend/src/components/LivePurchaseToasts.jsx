import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, X } from "lucide-react";
import { useSettings } from "../lib/hooks";

const FIRST_NAMES = [
  "Justin","Sarah","Michael","Ashley","James","Jessica","David","Emily","Daniel","Megan",
  "Christopher","Amanda","Matthew","Lauren","Joshua","Brittany","Andrew","Stephanie","Ryan","Nicole",
  "Kevin","Samantha","Brandon","Rachel","Tyler","Heather","Jason","Hannah","Justin","Kayla",
  "Anthony","Olivia","Brian","Sophia","Eric","Madison","Patrick","Chloe","Sean","Grace",
  "Aaron","Abigail","Cody","Natalie","Adam","Mia","Jonathan","Ella","Nicholas","Avery",
  "Zachary","Lily","Caleb","Aria","Logan","Layla","Hunter","Camila","Owen","Penelope",
  "Mason","Riley","Ethan","Aubrey","Liam","Zoey","Noah","Hazel","Lucas","Aurora",
  "Jackson","Isla","Aiden","Stella","Carter","Violet","Wyatt","Bella","Levi","Scarlett",
  "Sebastian","Ivy","Henry","Maya","Oliver","Kennedy","Dylan","Skylar","Connor","Reagan",
  "Brody","Eliana","Lincoln","Quinn","Bennett","Brielle","Easton","Naomi","Asher","Sadie",
];

const US_STATES = [
  "Texas","California","New York","Florida","Illinois","Pennsylvania","Ohio","Georgia","North Carolina",
  "Michigan","New Jersey","Virginia","Washington","Arizona","Massachusetts","Tennessee","Indiana",
  "Missouri","Maryland","Wisconsin","Colorado","Minnesota","South Carolina","Alabama","Louisiana",
  "Kentucky","Oregon","Oklahoma","Connecticut","Utah","Iowa","Nevada","Arkansas","Mississippi",
  "Kansas","Nebraska","Idaho","Hawaii","New Mexico","Maine",
];

const TIMES = ["just now","2 min ago","5 min ago","8 min ago","12 min ago","18 min ago","23 min ago","an hour ago"];

const PACK_LABELS = [
  { key: "single", label: "Single GlowCamp Lamp", emoji: "✨" },
  { key: "couple", label: "Couple Pack (2 lamps)", emoji: "✨✨" },
  { key: "gift", label: "Gift Pack", emoji: "🎁" },
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

export default function LivePurchaseToasts() {
  const { data: s } = useSettings();
  const loc = useLocation();
  const [event, setEvent] = useState(null);

  // Hide on admin / cart / checkout / track / thank-you for focus
  const hidden =
    loc.pathname.startsWith("/admin")
    || loc.pathname.startsWith("/cart")
    || loc.pathname.startsWith("/checkout")
    || loc.pathname.startsWith("/thank-you")
    || loc.pathname.startsWith("/track-order");

  useEffect(() => {
    if (hidden) return;
    let aliveT;
    let cycleT;
    function showOne() {
      setEvent({
        id: Math.random().toString(36).slice(2),
        name: pick(FIRST_NAMES),
        state: pick(US_STATES),
        pack: pick(PACK_LABELS),
        time: pick(TIMES),
      });
      aliveT = setTimeout(() => setEvent(null), 5800);
      cycleT = setTimeout(showOne, 5800 + 9000 + Math.random() * 8000);
    }
    const first = setTimeout(showOne, 6500); // first one 6.5s after mount
    return () => {
      clearTimeout(first);
      clearTimeout(aliveT);
      clearTimeout(cycleT);
    };
  }, [hidden, loc.pathname]);

  if (hidden) return null;

  return (
    <div className="fixed z-30 bottom-24 left-3 sm:bottom-6 sm:left-6 max-w-[300px] sm:max-w-sm pointer-events-none">
      <AnimatePresence>
        {event && (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.97 }}
            transition={{ duration: 0.35, ease: [0.2, 0.7, 0.2, 1] }}
            className="pointer-events-auto bg-[#0E0E0E]/95 backdrop-blur border border-ink-500/70 rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.55)] p-3 pr-4 flex items-center gap-3 glow-amber-soft"
          >
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-ink-500/60 shrink-0 bg-[#161616]">
              {s?.product?.main_image && (
                <img src={s.product.main_image} alt="" className="w-full h-full object-cover" />
              )}
              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-black flex items-center justify-center">
                <CheckCircle2 size={11} />
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] leading-snug text-white">
                <b>{event.name}</b> from <span className="text-amber-500">{event.state}</span>
                <span className="text-neutral-400"> just bought</span>
              </p>
              <p className="text-[11px] text-neutral-500 truncate">
                {event.pack.emoji} {event.pack.label} · {event.time}
              </p>
            </div>
            <button
              onClick={() => setEvent(null)}
              className="text-neutral-600 hover:text-neutral-300 -mr-1"
              aria-label="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
