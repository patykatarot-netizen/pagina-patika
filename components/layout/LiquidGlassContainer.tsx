'use client';

import { ElementType, HTMLAttributes, ReactNode } from 'react';

interface LiquidGlassContainerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  /** HTML element to render — defaults to 'div'. Use 'section' or 'article' for semantic wrappers. */
  as?: ElementType;
}

/**
 * Reusable wrapper that applies the Liquid Glass aesthetic.
 *
 * The glass effect is achieved with a CSS class `.liquid-glass` that provides:
 * - backdrop-filter: blur(20px) — the frosted glass blur
 * - Semi-transparent background (--bg-glass)
 * - 1px gradient border via ::before pseudo-element with mask-composite: exclude
 *   This creates a border that catches light at an angle, mimicking real glass edges.
 *
 * Use this for cards, panels, CTA buttons, and any container that needs the aesthetic.
 */
export default function LiquidGlassContainer({
  children,
  className = '',
  as: Component = 'div',
  ...props
}: LiquidGlassContainerProps) {
  return (
    <Component className={`liquid-glass ${className}`} {...props}>
      {children}
    </Component>
  );
}
