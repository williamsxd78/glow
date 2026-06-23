import React from "react";

export function FlameMark({ size = 28, className = "" }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={className}
      fill="none"
    >
      <defs>
        <linearGradient id="fl" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE4B0" />
          <stop offset="55%" stopColor="#FFAA00" />
          <stop offset="100%" stopColor="#FF6A00" />
        </linearGradient>
      </defs>
      <path
        d="M12 2c1.2 3 4 5 4 8a4 4 0 1 1-8 0c0-1.4.6-2.3 1.2-3 .2 1.2 1 1.8 1.8 1.8 0-2 .5-4 1-6.8z"
        fill="url(#fl)"
      />
      <path
        d="M12 14a2 2 0 1 1-2-2c0 .9.5 1.5 1.2 1.7-.1-.7 0-1.4.4-2.1.2.9.5 1.7.4 2.4z"
        fill="#FFE4B0"
      />
    </svg>
  );
}
