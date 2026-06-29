import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useCart } from "../lib/cart";
import { useSettings } from "../lib/hooks";
import { resolveImageUrl } from "../lib/api";
import { ADMIN_BASE } from "../lib/adminBase";
import { TID } from "../constants/testIds";

export default function StickyCart() {
  const loc = useLocation();
  const nav = useNavigate();
  const { add, items } = useCart();
  const { data: s } = useSettings();
  const [show, setShow] = useState(false);

  useEffect(() => {
    function onScroll() {
      setShow(window.scrollY > 700);
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const hideOn = ["/cart", "/checkout", "/track-order"].some((p) => loc.pathname.startsWith(p));
  if (hideOn || loc.pathname.startsWith(`/${ADMIN_BASE}`) || loc.pathname.startsWith("/thank-you")) return null;
  if (!show) return null;
  if (!s) return null;
  const single = s.offers.find((o) => o.key === "single") || s.offers[0];

  function buyNow() {
    nav("/product");
  }

  return (
    <div className="fixed bottom-3 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-1.5rem)] max-w-2xl">
      <div className="bg-black/85 backdrop-blur-xl border border-ink-500 rounded-2xl shadow-[0_10px_50px_rgba(0,0,0,0.5)] flex items-center gap-3 sm:gap-4 p-2.5 sm:p-3 glow-amber-soft">
        <img
          src={resolveImageUrl(s.product.main_image)}
          alt={s.product.name}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl object-cover border border-ink-500"
        />
        <div className="flex-1 min-w-0">
          <div className="text-[11px] text-amber-500 tracking-wider uppercase">Launch Offer</div>
          <div className="text-sm font-medium truncate">{s.product.name}</div>
          <div className="text-sm">
            <span className="text-white font-semibold">${s.product.sale_price}</span>{" "}
            <span className="text-neutral-500 line-through text-xs">${s.product.original_price}</span>
          </div>
        </div>
        <button
          data-testid={TID.stickyBuy}
          onClick={buyNow}
          className="btn-primary text-sm whitespace-nowrap"
        >
          Buy Now
        </button>
      </div>
    </div>
  );
}
