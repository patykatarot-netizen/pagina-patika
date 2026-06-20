'use client';

import { ElementType, HTMLAttributes, ReactNode } from 'react';

type GlassLevel = 'primary' | 'secondary' | 'elevated' | 'subtle';

type SquircleSize = 'sm' | 'md' | 'lg' | 'xl';

interface LiquidGlassContainerProps extends HTMLAttributes<HTMLElement> {
  children: ReactNode;
  className?: string;
  /** HTML element to render — defaults to 'div'. Use 'section' or 'article' for semantic wrappers. */
  as?: ElementType;
  /**
   * Glassmorphism depth level.
   * - `primary` — full glass effect with blur and specular highlight (default).
   * - `secondary` — medium opacity with blur, less contrast.
   * - `elevated` — high opacity, strong blur, subtle shadow.
   * - `subtle` — minimal opacity, light blur, for background accents.
   */
  level?: GlassLevel;
  /** Squircle border-radius size — defaults to `md` (12px). */
  squircle?: SquircleSize;
}

const GLASS_CLASSES: Record<GlassLevel, string> = {
  primary: 'glass-primary',
  secondary: 'glass-secondary',
  elevated: 'glass-elevated',
  subtle: 'glass-subtle',
};

const SQUIRCLE_CLASSES: Record<SquircleSize, string> = {
  sm: 'squircle-sm',
  md: 'squircle',
  lg: 'squircle-lg',
  xl: 'squircle-xl',
};

/**
 * Reusable wrapper that applies the Liquid Glass aesthetic with
 * configurable depth levels and squircle border-radius.
 *
 * ## Glass Levels (prop `level`)
 * - `primary`   — full glass: backdrop-blur(20px), specular highlight border,
 *                 semi-transparent background. Visually equivalent to the
 *                 legacy `.liquid-glass` class.
 * - `secondary` — medium opacity with blur, less contrast. Good for nested
 *                 panels or secondary surfaces.
 * - `elevated`  — high opacity, strong blur, subtle shadow. Use for
 *                 floating elements like dropdowns or tooltips.
 * - `subtle`    — minimal opacity, light blur. Use for background accents.
 *
 * ## Squircle Sizes (prop `squircle`)
 * - `sm` — 8px
 * - `md` — 12px (default)
 * - `lg` — 16px
 * - `xl` — 24px
 *
 * ## Backward Compatibility
 * If `level` is not passed it defaults to `'primary'`, which maps to
 * `.glass-primary` — visually identical to the old `.liquid-glass` class.
 */
export default function LiquidGlassContainer({
  children,
  className = '',
  as: Component = 'div',
  level = 'primary',
  squircle = 'md',
  ...props
}: LiquidGlassContainerProps) {
  return (
    <Component
      className={`${GLASS_CLASSES[level]} ${SQUIRCLE_CLASSES[squircle]} ${className}`}
      {...props}
    >
      {children}
    </Component>
  );
}
