import React from "react";
import { Link, useLocation } from "react-router-dom";
import { ShoppingBag, Truck } from "lucide-react";
import { useCart } from "../lib/cart";
import { FlameMark } from "./FlameLogo";
import { TID } from "../constants/testIds";

export default function Navbar() {
  const { totalQty } = useCart();
  const loc = useLocation();
  const isAdmin = loc.pathname.startsWith("/admin");
  if (isAdmin) return null;

  return (
    <header className="sticky top-0 z-40 bg-black/70 backdrop-blur-xl border-b border-ink-500/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" data-testid={TID.navLogo} className="flex items-center gap-2.5">
          <FlameMark size={26} />
          <span className="font-display text-xl tracking-wide">GlowCamp</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm text-neutral-300">
          <a href="/#story" className="hover:text-amber-500 transition-colors">Story</a>
          <a href="/#how" className="hover:text-amber-500 transition-colors">How it's made</a>
          <a href="/#gallery" className="hover:text-amber-500 transition-colors">Gallery</a>
          <a href="/#reviews" className="hover:text-amber-500 transition-colors">Reviews</a>
          <a href="/#faq" className="hover:text-amber-500 transition-colors">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Link
            to="/track-order"
            data-testid={TID.navTrack}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs text-neutral-400 hover:text-amber-500 px-3 py-2"
          >
            <Truck size={14} /> Track
          </Link>
          <Link
            to="/cart"
            data-testid={TID.navCart}
            className="relative inline-flex items-center gap-1.5 text-sm text-white border border-ink-500 rounded-full px-3.5 py-2 hover:border-amber-500 hover:text-amber-500 transition"
          >
            <ShoppingBag size={16} />
            <span className="hidden sm:inline">Cart</span>
            {totalQty > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-amber-500 text-black text-[10px] font-semibold rounded-full w-5 h-5 flex items-center justify-center">
                {totalQty}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
