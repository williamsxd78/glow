import React from "react";
import { useSettings } from "../lib/hooks";

export default function AnnouncementBar() {
  const { data: s } = useSettings();
  if (!s?.announcement?.enabled) return null;
  const text = s.announcement.text;
  return (
    <div className="bg-amber-500 text-black text-xs sm:text-sm font-medium overflow-hidden">
      <div className="flex whitespace-nowrap marquee-track py-2">
        {[0, 1].map((i) => (
          <div key={i} className="flex shrink-0 gap-12 px-6">
            {Array.from({ length: 6 }).map((_, j) => (
              <span key={j} className="flex items-center gap-3">
                <span>✦</span> {text}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
