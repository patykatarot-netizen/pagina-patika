'use client';

import { useEffect, useState } from 'react';

/**
 * Patyka Tarot — Particle Field
 *
 * Decorative floating particles for the hero section.
 * Non-interactive, low opacity, purely atmospheric.
 *
 * # Design principles
 *   - Saliencia Visual: opacity 0.1-0.3, never competes with CTA
 *   - Performance: animate only transform + opacity (GPU-accelerated)
 *   - Accessibility: pointer-events-none, aria-hidden="true"
 *   - Reduced motion: static particles when prefers-reduced-motion is set
 *
 * # Particle count
 *   - Mobile (< 768px): 5 particles
 *   - Desktop (>= 768px): 8 particles
 */

interface Particle {
  id: number;
  x: number;       // horizontal position (%)
  y: number;       // vertical position (%)
  size: number;    // px
  color: 'gold' | 'purple';
  shape: 'star' | 'circle' | 'diamond';
  delay: number;   // animation delay (s)
  duration: number; // animation duration (s)
  opacity: number;  // 0.1-0.3
  desktopOnly: boolean;
}

/**
 * Deterministic particles — no Math.random.
 * Positions are carefully distributed to avoid clustering.
 */
const PARTICLES: Particle[] = [
  { id: 1, x: 10, y: 20, size: 8, color: 'gold', shape: 'star', delay: 0, duration: 6, opacity: 0.2, desktopOnly: false },
  { id: 2, x: 80, y: 15, size: 6, color: 'purple', shape: 'circle', delay: -1, duration: 8, opacity: 0.15, desktopOnly: false },
  { id: 3, x: 50, y: 70, size: 10, color: 'gold', shape: 'diamond', delay: -2, duration: 5, opacity: 0.25, desktopOnly: false },
  { id: 4, x: 25, y: 85, size: 5, color: 'purple', shape: 'star', delay: -3, duration: 7, opacity: 0.1, desktopOnly: false },
  { id: 5, x: 90, y: 60, size: 7, color: 'gold', shape: 'circle', delay: -4, duration: 9, opacity: 0.2, desktopOnly: false },
  // Desktop only
  { id: 6, x: 35, y: 40, size: 9, color: 'purple', shape: 'diamond', delay: -1.5, duration: 6.5, opacity: 0.15, desktopOnly: true },
  { id: 7, x: 70, y: 80, size: 6, color: 'gold', shape: 'star', delay: -2.5, duration: 7.5, opacity: 0.2, desktopOnly: true },
  { id: 8, x: 15, y: 50, size: 8, color: 'purple', shape: 'circle', delay: -3.5, duration: 8.5, opacity: 0.1, desktopOnly: true },
];

const COLOR_MAP = {
  gold: 'var(--accent-gold, #d4a853)',
  purple: 'var(--accent-purple, #a855f7)',
};

function ShapeSVG({ shape, color }: { shape: Particle['shape']; color: Particle['color'] }) {
  const fill = COLOR_MAP[color];

  if (shape === 'star') {
    return (
      <svg viewBox="0 0 24 24" fill={fill} className="w-full h-full" aria-hidden="true">
        <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5Z" />
      </svg>
    );
  }

  if (shape === 'circle') {
    return (
      <svg viewBox="0 0 24 24" fill={fill} className="w-full h-full" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
      </svg>
    );
  }

  // diamond
  return (
    <svg viewBox="0 0 24 24" fill={fill} className="w-full h-full" aria-hidden="true">
      <path d="M12 2L22 12L12 22L2 12Z" />
    </svg>
  );
}

export default function ParticleField() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const desktopMql = window.matchMedia('(min-width: 768px)');
    setIsDesktop(desktopMql.matches);
    const onDesktopChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    desktopMql.addEventListener('change', onDesktopChange);

    const motionMql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(motionMql.matches);
    const onMotionChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    motionMql.addEventListener('change', onMotionChange);

    return () => {
      desktopMql.removeEventListener('change', onDesktopChange);
      motionMql.removeEventListener('change', onMotionChange);
    };
  }, []);

  const visibleParticles = isDesktop
    ? PARTICLES
    : PARTICLES.filter((p) => !p.desktopOnly);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      aria-hidden="true"
    >
      {visibleParticles.map((p) => (
        <div
          key={p.id}
          className="absolute"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            opacity: p.opacity,
            willChange: 'transform, opacity',
            animation: reducedMotion
              ? 'none'
              : `float-particle ${p.duration}s ease-in-out ${p.delay}s infinite`,
          }}
        >
          <ShapeSVG shape={p.shape} color={p.color} />
        </div>
      ))}
    </div>
  );
}
