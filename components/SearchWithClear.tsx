"use client";

import { useRef } from "react";

export function SearchWithClear({
  className,
  role,
}: {
  className?: string;
  role?: "search";
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className={className ?? "search"} role={role}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
        <circle cx="11" cy="11" r="7" />
        <path d="M20 20L16.6 16.6" strokeLinecap="round" />
      </svg>
      <input
        ref={inputRef}
        type="search"
        name="q"
        placeholder="Search Event"
        aria-label="Search event"
        autoComplete="off"
      />
      <button
        className="clear-btn"
        type="button"
        aria-label="Clear search"
        onClick={() => {
          if (inputRef.current) {
            inputRef.current.value = "";
            inputRef.current.focus();
          }
        }}
      >
        ×
      </button>
    </div>
  );
}
