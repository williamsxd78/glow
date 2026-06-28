import React from "react";
import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { FlameMark } from "./FlameLogo";

export default function CheckoutHeader({ rightText = "Secure checkout" }) {
  return (
    <header className="border-b border-[#E1E3E5] bg-white">
      <div className="max-w-[1180px] mx-auto px-4 sm:px-6 lg:px-10 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <FlameMark size={22} />
          <span className="font-display text-lg tracking-wide">GlowCamp</span>
        </Link>
        <span className="text-xs text-[#6D7175] flex items-center gap-1.5">
          <Lock size={12} /> {rightText}
        </span>
      </div>
    </header>
  );
}
