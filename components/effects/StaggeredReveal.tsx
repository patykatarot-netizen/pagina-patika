'use client';

import React, { useEffect, useRef, useState } from 'react';

/**
 * Patyka Tarot — Staggered Reveal
 *
 * Anima la aparición escalonada de elementos cuando el contenedor
 * entra en el viewport (scroll). Aplica el principio de
 * "guía de la mirada" del PDR.
 *
 * # Design principles
 *   - Performance: IntersectionObserver se desconecta tras el primer trigger
 *   - Accesibilidad: sin animación cuando prefers-reduced-motion está activo
 *   - Curva spring-smooth: cubic-bezier(0.25, 1, 0.5, 1)
 *   - Stagger configurable: delay incremental entre hijos
 */

interface Props {
  /** Elementos a animar */
  children: React.ReactNode;
  /** Milisegundos de delay entre cada hijo (default: 100) */
  staggerMs?: number;
  /** Umbral del IntersectionObserver (default: 0.1) */
  threshold?: number;
}

export default function StaggeredReveal({
  children,
  staggerMs = 100,
  threshold = 0.1,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  // Detectar preferencia de reduced motion
  useEffect(() => {
    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReducedMotion(mql.matches);

    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mql.addEventListener('change', onChange);

    return () => mql.removeEventListener('change', onChange);
  }, []);

  // IntersectionObserver: detecta cuando el contenedor entra en pantalla
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect(); // Animar solo la primera vez
        }
      },
      { threshold },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div ref={containerRef}>
      {React.Children.map(children, (child, index) => (
        <div
          style={
            reducedMotion
              ? {
                  // Sin animación: aparece instantáneamente sin transiciones
                  opacity: isVisible ? 1 : 0,
                }
              : {
                  opacity: isVisible ? 1 : 0,
                  transform: isVisible
                    ? 'translateY(0)'
                    : 'translateY(20px)',
                  transition:
                    `opacity 0.4s cubic-bezier(0.25, 1, 0.5, 1) ${isVisible ? index * staggerMs : 0}ms, ` +
                    `transform 0.4s cubic-bezier(0.25, 1, 0.5, 1) ${isVisible ? index * staggerMs : 0}ms`,
                }
          }
        >
          {child}
        </div>
      ))}
    </div>
  );
}
