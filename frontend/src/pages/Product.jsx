import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star, ShieldCheck, Truck, Plus, Minus, Heart, Check, ChevronRight,
  Boxes, Flame, Wind, Trees, Home as HomeIcon, Gift, Plug, Camera,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings, useReviews, useGallery } from "../lib/hooks";
import { useCart } from "../lib/cart";
import Reviews from "../components/sections/Reviews";
import Faq from "../components/sections/Faq";
import HowItsMade from "../components/sections/HowItsMade";
import VideoSection from "../components/sections/VideoSection";

const FEATURE_ICONS = [
  { icon: Boxes, label: "3D Printed Flame Body" },
  { icon: Flame, label: "Warm Inner Bulb Glow" },
  { icon: Wind, label: "Flameless · Smoke-free" },
  { icon: Trees, label: "Mini Campfire Base" },
  { icon: HomeIcon, label: "Perfect Room Decor" },
  { icon: Gift, label: "Great Gift Choice" },
  { icon: Plug, label: "Easy Plug-in Use" },
  { icon: Camera, label: "Reel & Video Friendly" },
];

function Stars({ n, size = 14 }) {
  return (
    <div className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          size={size}
          className={i < Math.round(n) ? "fill-amber-400 text-amber-400" : "text-neutral-700"}
        />
      ))}
    </div>
  );
}

export default function ProductPage() {
  const { data: s } = useSettings();
  const { data: reviews } = useReviews();
  const { data: gallery } = useGallery();
  const { add } = useCart();
  const nav = useNavigate();

  const [selectedKey, setSelectedKey] = useState("single");
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  const images = useMemo(() => {
    const arr = [];
    if (s?.product?.main_image) arr.push({ url: s.product.main_image, alt: s.product.name });
    (gallery || []).forEach((g) => {
      if (g.url !== s?.product?.main_image) arr.push({ url: g.url, alt: g.alt });
    });
    return arr;
  }, [s, gallery]);

  useEffect(() => { setActiveImg(0); }, [images.length]);

  if (!s) {
    return <div className="min-h-[60vh] flex items-center justify-center text-neutral-500">Loading…</div>;
  }

  const selectedOffer = s.offers.find((o) => o.key === selectedKey) || s.offers[0];
  const ratingAvg = reviews?.length ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length) : 5;
  const reviewCount = reviews?.length || 0;
  const total = (selectedOffer.price * qty).toFixed(2);
  const savings = selectedOffer.original_price
    ? Math.round(((selectedOffer.original_price - selectedOffer.price) / selectedOffer.original_price) * 100)
    : 0;

  function addItem(redirect) {
    add(selectedOffer, qty);
    if (redirect) {
      nav("/checkout");
    } else {
      toast.success(`${selectedOffer.title} added to cart`, { duration: 2200 });
    }
  }

  return (
    <main className="bg-[#0A0A0A]">
      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <p className="text-xs text-neutral-500">
          <Link to="/" className="hover:text-amber-500">Home</Link>
          <ChevronRight size={11} className="inline mx-1 -mt-0.5 text-neutral-700" />
          <span className="text-neutral-300">{s.product.name}</span>
        </p>
      </div>

      {/* TOP - Gallery + Info */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12 grid lg:grid-cols-2 gap-10 lg:gap-16">
        {/* LEFT - Gallery */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:sticky lg:top-24"
        >
          <div className="relative aspect-square rounded-3xl overflow-hidden border border-ink-500/60 bg-[#0E0E0E]">
            <div className="absolute inset-8 flame-flicker pointer-events-none" />
            {images[activeImg] && (
              <img
                key={images[activeImg].url}
                src={images[activeImg].url}
                alt={images[activeImg].alt}
                className="relative z-10 w-full h-full object-cover"
              />
            )}
            <div className="absolute top-3 left-3 z-20 bg-black/70 backdrop-blur border border-amber-500/40 rounded-full px-3 py-1 text-[10px] tracking-widest uppercase text-amber-500">
              Save {savings}%
            </div>
          </div>

          {images.length > 1 && (
            <div className="flex gap-2 mt-3 overflow-x-auto no-scrollbar">
              {images.map((img, i) => (
                <button
                  key={img.url + i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border transition ${
                    i === activeImg ? "border-amber-500" : "border-ink-500/60 hover:border-ink-500"
                  }`}
                >
                  <img src={img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </motion.div>

        {/* RIGHT - Info */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="lg:py-4"
        >
          <p className="text-xs text-amber-500 tracking-[0.2em] uppercase mb-3">
            Limited Launch Offer · {s.product.stock} in stock
          </p>
          <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl leading-tight mb-3">
            {s.product.name}
          </h1>
          <div className="flex items-center gap-3 mb-5">
            <Stars n={ratingAvg} />
            <a href="#reviews" className="text-xs text-neutral-400 hover:text-amber-500">
              {ratingAvg.toFixed(1)} · {reviewCount}+ reviews
            </a>
          </div>

          {/* Price */}
          <div className="flex items-end gap-3 mb-2">
            <span className="font-display text-4xl sm:text-5xl text-white">${selectedOffer.price.toFixed(2)}</span>
            {selectedOffer.original_price && (
              <span className="text-neutral-500 line-through text-lg mb-1.5">${selectedOffer.original_price.toFixed(2)}</span>
            )}
            {savings > 0 && (
              <span className="ml-1 text-[11px] uppercase tracking-widest text-amber-500 mb-2">
                Save {savings}%
              </span>
            )}
          </div>
          <p className="text-xs text-amber-500/90 mb-7">
            ⓘ {s.product.stock_urgency_text || "Selling fast — limited stock"}
          </p>

          <p className="text-[15px] text-neutral-300 leading-relaxed mb-7">
            {s.product.description}
          </p>

          {/* Variant tiles */}
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <p className="text-xs uppercase tracking-widest text-neutral-400">Choose your pack</p>
              <span className="text-xs text-neutral-500">{selectedOffer.subtitle}</span>
            </div>
            <div className="grid grid-cols-3 gap-2.5 mb-6">
              {s.offers.map((o) => {
                const active = o.key === selectedKey;
                return (
                  <button
                    key={o.key}
                    onClick={() => setSelectedKey(o.key)}
                    className={`relative text-left rounded-xl p-3 sm:p-4 border transition-all ${
                      active
                        ? "border-amber-500 bg-amber-500/[0.06] glow-amber-soft"
                        : "border-ink-500/60 bg-[#0E0E0E] hover:border-ink-500"
                    }`}
                  >
                    {o.badge && (
                      <span className="absolute -top-2 right-2 bg-amber-500 text-black text-[9px] tracking-widest uppercase font-semibold px-1.5 py-0.5 rounded">
                        {o.badge}
                      </span>
                    )}
                    <div className="text-[11px] uppercase tracking-widest text-neutral-500 mb-1">{o.title.split(" ")[0]}</div>
                    <div className="text-sm font-medium leading-tight">{o.quantity}× lamp{o.quantity > 1 ? "s" : ""}</div>
                    <div className="mt-2 font-display text-lg">${o.price.toFixed(2)}</div>
                    {o.original_price && (
                      <div className="text-[11px] text-neutral-500 line-through">${o.original_price.toFixed(2)}</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quantity */}
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-neutral-400 mb-2.5">Quantity</p>
            <div className="inline-flex items-center bg-[#0E0E0E] border border-ink-500/70 rounded-full">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-11 h-11 flex items-center justify-center text-neutral-300 hover:text-amber-500"
                aria-label="Decrease"
              >
                <Minus size={14} />
              </button>
              <span className="w-10 text-center font-medium tabular-nums">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(99, q + 1))}
                className="w-11 h-11 flex items-center justify-center text-neutral-300 hover:text-amber-500"
                aria-label="Increase"
              >
                <Plus size={14} />
              </button>
            </div>
            <span className="ml-3 text-xs text-neutral-500">
              Total: <span className="text-white font-medium">${total}</span>
            </span>
          </div>

          {/* CTAs */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <button
              data-testid="product-add-cart"
              onClick={() => addItem(false)}
              className="btn-ghost justify-center py-3.5"
            >
              <Heart size={16} /> Add to Cart
            </button>
            <button
              data-testid="product-buy-now"
              onClick={() => addItem(true)}
              className="btn-primary justify-center py-3.5"
            >
              Buy Now
            </button>
          </div>

          {/* Trust strip */}
          <div className="grid sm:grid-cols-3 gap-2.5 mb-7">
            <TrustItem icon={Truck} title="Free shipping" sub="On orders over $50" />
            <TrustItem icon={ShieldCheck} title="7-day returns" sub="No-questions-asked" />
            <TrustItem icon={Check} title="Secure checkout" sub="Encrypted at checkout" />
          </div>

          {/* Features (compact list) */}
          <div className="border-t border-ink-500/40 pt-6">
            <p className="text-xs uppercase tracking-widest text-neutral-400 mb-3">Why people love it</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5">
              {FEATURE_ICONS.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex items-center gap-2 text-sm text-neutral-300">
                    <Icon size={14} className="text-amber-500 shrink-0" />
                    {f.label}
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Specs strip */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            ["Size", s.product.size],
            ["Bulb", s.product.bulb_type],
            ["Wire", s.product.wire_length],
            ["Warranty", s.product.warranty],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#0E0E0E] border border-ink-500/60 rounded-xl px-4 py-3.5">
              <div className="text-[10px] uppercase tracking-widest text-neutral-500">{k}</div>
              <div className="text-sm text-white mt-0.5">{v}</div>
            </div>
          ))}
        </div>
      </section>

      <VideoSection />
      <HowItsMade />
      <Reviews />
      <Faq />
    </main>
  );
}

function TrustItem({ icon: Icon, title, sub }) {
  return (
    <div className="flex items-center gap-3 bg-[#0E0E0E] border border-ink-500/40 rounded-xl px-3 py-2.5">
      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
        <Icon size={14} />
      </div>
      <div className="min-w-0">
        <div className="text-[12px] font-medium text-white truncate">{title}</div>
        <div className="text-[11px] text-neutral-500 truncate">{sub}</div>
      </div>
    </div>
  );
}
