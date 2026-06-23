import React from "react";
import { Link, useLocation } from "react-router-dom";
import { FlameMark } from "./FlameLogo";
import { Instagram, Youtube, Facebook } from "lucide-react";
import { useSettings } from "../lib/hooks";

export default function Footer() {
  const loc = useLocation();
  const { data: s } = useSettings();
  if (loc.pathname.startsWith("/admin")) return null;

  return (
    <footer className="bg-[#070707] border-t border-ink-500/40 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <FlameMark size={26} />
            <span className="font-display text-xl tracking-wide">GlowCamp</span>
          </div>
          <p className="text-sm text-neutral-400 leading-relaxed max-w-xs">
            A 3D printed flame-shaped decorative electric lamp. Made for cozy nights and beautiful rooms.
          </p>
        </div>
        <div>
          <div className="text-xs text-amber-500 tracking-[0.2em] uppercase mb-4">Shop</div>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li><Link to="/product" className="hover:text-amber-500">Buy GlowCamp</Link></li>
            <li><Link to="/cart" className="hover:text-amber-500">Your Cart</Link></li>
            <li><Link to="/track-order" className="hover:text-amber-500">Track Order</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs text-amber-500 tracking-[0.2em] uppercase mb-4">Policies</div>
          <ul className="space-y-2 text-sm text-neutral-300">
            <li><Link to="/policy/shipping" className="hover:text-amber-500">Shipping Policy</Link></li>
            <li><Link to="/policy/returns" className="hover:text-amber-500">Returns & Refunds</Link></li>
            <li><Link to="/policy/privacy" className="hover:text-amber-500">Privacy Policy</Link></li>
            <li><Link to="/policy/terms" className="hover:text-amber-500">Terms & Conditions</Link></li>
            <li><Link to="/policy/contact" className="hover:text-amber-500">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <div className="text-xs text-amber-500 tracking-[0.2em] uppercase mb-4">Follow</div>
          <div className="flex items-center gap-3">
            {s?.social?.instagram && (
              <a href={s.social.instagram} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-ink-500 flex items-center justify-center hover:border-amber-500 hover:text-amber-500"><Instagram size={16} /></a>
            )}
            {s?.social?.youtube && (
              <a href={s.social.youtube} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-ink-500 flex items-center justify-center hover:border-amber-500 hover:text-amber-500"><Youtube size={16} /></a>
            )}
            {s?.social?.facebook && (
              <a href={s.social.facebook} target="_blank" rel="noreferrer" className="w-9 h-9 rounded-full border border-ink-500 flex items-center justify-center hover:border-amber-500 hover:text-amber-500"><Facebook size={16} /></a>
            )}
            {!s?.social?.instagram && !s?.social?.youtube && !s?.social?.facebook && (
              <span className="text-xs text-neutral-500">Social links coming soon</span>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-6">
            Warm white LED. Flameless. Smoke-free. Ash-free.
          </p>
        </div>
      </div>
      <div className="border-t border-ink-500/40 py-6 text-center text-xs text-neutral-500">
        © {new Date().getFullYear()} GlowCamp. All rights reserved.
      </div>
    </footer>
  );
}
