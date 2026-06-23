import React from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { useSettings } from "../../lib/hooks";
import { useCart } from "../../lib/cart";
import { TID } from "../../constants/testIds";
import { toast } from "sonner";

export default function Offers() {
  const { data: s } = useSettings();
  const { add } = useCart();
  const nav = useNavigate();
  if (!s) return null;

  function buyNow(offer) {
    add(offer, 1);
    toast.success(`${offer.title} added to cart`);
    nav("/checkout");
  }

  return (
    <section id="offers" className="py-20 md:py-32 bg-[#070707]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <p className="text-xs text-amber-500 tracking-[0.25em] uppercase mb-3">— Pick your glow —</p>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight">
            Choose your pack
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-5 lg:gap-6">
          {s.offers.map((o) => {
            const isHero = o.key === "couple";
            const savings = o.original_price ? Math.round(((o.original_price - o.price) / o.original_price) * 100) : 0;
            return (
              <div
                key={o.key}
                data-testid={TID.offerCard(o.key)}
                className={`relative rounded-3xl p-7 sm:p-8 border ${
                  isHero
                    ? "border-amber-500/60 bg-[#0F0B05] glow-amber-soft -translate-y-0 md:-translate-y-2"
                    : "border-ink-500/60 bg-[#0E0E0E]"
                }`}
              >
                {o.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-[10px] tracking-widest uppercase font-semibold px-3 py-1 rounded-full">
                    {o.badge}
                  </div>
                )}
                <h3 className="font-display text-xl sm:text-2xl mb-1.5">{o.title}</h3>
                <p className="text-sm text-neutral-400 mb-6">{o.subtitle}</p>
                <div className="flex items-end gap-2 mb-1">
                  <span className="font-display text-4xl sm:text-5xl text-white">${o.price}</span>
                  {o.original_price && (
                    <span className="text-neutral-500 line-through text-base mb-1.5">${o.original_price}</span>
                  )}
                </div>
                {savings > 0 && (
                  <p className="text-xs text-amber-500 tracking-wider mb-6">Save {savings}% today</p>
                )}
                <p className="text-sm text-neutral-300 mb-6">{o.description}</p>
                <ul className="space-y-2 text-sm text-neutral-300 mb-7">
                  <li className="flex gap-2 items-start"><Check size={16} className="text-amber-500 mt-0.5 shrink-0" /> {o.quantity} GlowCamp lamp{o.quantity > 1 ? "s" : ""} included</li>
                  <li className="flex gap-2 items-start"><Check size={16} className="text-amber-500 mt-0.5 shrink-0" /> Wire & plug setup included</li>
                  <li className="flex gap-2 items-start"><Check size={16} className="text-amber-500 mt-0.5 shrink-0" /> Free US shipping over $50</li>
                  {o.key === "gift" && <li className="flex gap-2 items-start"><Check size={16} className="text-amber-500 mt-0.5 shrink-0" /> Hand-wrapped gift box + note card</li>}
                </ul>
                <button
                  data-testid={TID.offerBuy(o.key)}
                  onClick={() => buyNow(o)}
                  className={isHero ? "btn-primary w-full justify-center" : "btn-ghost w-full justify-center"}
                >
                  Add to Cart
                </button>
              </div>
            );
          })}
        </div>
        {s.product.stock_urgency_text && (
          <p className="text-center text-sm text-amber-500/90 mt-10 tracking-wide">
            ⓘ {s.product.stock_urgency_text}
          </p>
        )}
      </div>
    </section>
  );
}
