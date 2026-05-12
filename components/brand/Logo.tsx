'use client';

/**
 * Patyka Tarot — Logo mark
 *
 * A minimalist tarot card in SVG. The card shape + 4-point star (The Star
 * arcana) reads clearly at small sizes and reinforces the brand identity
 * without needing text.
 *
 * Props:
 * - className: passed to the SVG for sizing (default: h-6 w-auto)
 * - gold: if true, forces accent-gold color regardless of parent context
 *
 * Design:
 * - Outer card: rounded rect, currentColor stroke (defaults to accent-gold in Nav)
 * - Inner frame: subtle secondary line
 * - Center: 4-point sparkle/star (The Star arcana)
 * - The 24x34 viewBox gives a ~1:1.4 card proportion
 */
export default function Logo({ className = 'h-6 w-auto', gold = false }: { className?: string; gold?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 34"
      fill="none"
      className={className}
      aria-label="Patyka Tarot"
      role="img"
    >
      <title>Patyka Tarot</title>

      {/* Card body */}
      <rect
        x="1"
        y="1"
        width="22"
        height="32"
        rx="3"
        fill="#0a0a0f"
        stroke="currentColor"
        strokeWidth="1.5"
      />

      {/* Inner decorative frame */}
      <rect
        x="3"
        y="3"
        width="18"
        height="28"
        rx="2"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="0.5"
      />

      {/* The Star — 4-point sparkle */}
      <path
        d="M12,10 L13.8,14.2 L18,16 L13.8,17.8 L12,22 L10.2,17.8 L6,16 L10.2,14.2 Z"
        fill="currentColor"
      />
    </svg>
  );
}
