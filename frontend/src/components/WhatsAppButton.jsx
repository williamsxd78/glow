import React from "react";
import { useLocation } from "react-router-dom";
import { useSettings } from "../lib/hooks";

export default function WhatsAppButton() {
  const { data: s } = useSettings();
  const loc = useLocation();
  // Hide on functional / admin pages to avoid covering CTAs
  if (loc.pathname.startsWith("/admin")) return null;
  if (loc.pathname.startsWith("/cart") || loc.pathname.startsWith("/checkout") || loc.pathname.startsWith("/thank-you") || loc.pathname.startsWith("/track-order")) return null;
  if (!s?.whatsapp_number) return null;

  const number = (s.whatsapp_number || "").replace(/\D/g, "");
  const msg = encodeURIComponent(s.whatsapp_message || "Hi, I have a question about GlowCamp.");
  const href = `https://wa.me/${number}?text=${msg}`;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      data-testid="whatsapp-btn"
      className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-30 w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] text-white flex items-center justify-center shadow-[0_8px_30px_rgba(37,211,102,0.5)] hover:scale-105 transition-transform"
      aria-label="Chat on WhatsApp"
      style={{ width: 52, height: 52 }}
    >
      <svg viewBox="0 0 32 32" width="24" height="24" fill="currentColor">
        <path d="M19.11 17.21c-.27-.13-1.58-.78-1.82-.87-.24-.09-.42-.13-.6.14-.18.27-.69.87-.84 1.05-.16.18-.31.2-.58.07-.27-.13-1.13-.42-2.16-1.33-.8-.71-1.34-1.59-1.5-1.86-.16-.27-.02-.42.11-.55.12-.12.27-.31.4-.47.13-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.6-1.45-.82-1.99-.22-.52-.44-.45-.6-.46-.16 0-.34-.02-.52-.02-.18 0-.47.07-.71.34-.24.27-.93.91-.93 2.22 0 1.31.95 2.58 1.09 2.76.13.18 1.88 2.87 4.55 3.91.64.27 1.13.44 1.52.56.64.2 1.22.18 1.68.11.51-.08 1.58-.65 1.8-1.27.22-.62.22-1.16.16-1.27-.07-.11-.24-.18-.51-.31zM16.05 4C9.97 4 5 8.97 5 15.05c0 1.95.5 3.79 1.43 5.4L5 27l6.74-1.41a10.99 10.99 0 0 0 4.31.89c6.08 0 11.05-4.97 11.05-11.05S22.13 4 16.05 4z"/>
      </svg>
    </a>
  );
}
