'use client';

import type { Service } from '@/types';
import LiquidGlassContainer from '@/components/layout/LiquidGlassContainer';

/**
 * Formats a price in Colombian Pesos using the es-CO locale.
 * Intl.NumberFormat handles thousand separators and the COP symbol
 * natively — no manual string munging needed.
 *
 * Example: 80000 → "$ 80.000"
 */
function formatCOP(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

interface Props {
  service: Service;
}

/**
 * A single service card rendered inside the ServiceCatalog grid.
 *
 * # Client component
 *
 * Marked 'use client' because it uses hover effects (scale + glow
 * shadow), which require CSS transitions that only work predictably
 * when rendered on the client.
 *
 * # Liquid Glass aesthetic
 *
 * Wrapped in LiquidGlassContainer for the frosted glass effect.
 * On hover, the card scales to 103% and gains a subtle gold glow
 * shadow that reinforces the "cinematic" Mac 2026 aesthetic.
 *
 * # Card layout
 *   - Duration badge (top-left, gold pill)
 *   - Price (top-right, gold bold)
 *   - Service name (heading, Instrument Serif)
 *   - Description (body text, DM Sans, muted)
 */
export default function ServiceCard({ service }: Props) {
  return (
    <LiquidGlassContainer
      as="article"
      className="group p-6 transition-all duration-300 hover:scale-[1.03] hover:shadow-[0_0_25px_rgba(139,92,246,0.15)]"
      /**
       * The scale+glow transition uses CSS transitions (duration-300)
       * rather than JavaScript-driven animations. CSS transitions are
       * GPU-accelerated in modern browsers and don't require rAF loops,
       * making them ideal for simple hover effects like this.
       *
       * The glow is achieved via box-shadow with accent-gold at 12%
       * opacity — subtle enough to feel premium, not tacky.
       */
    >
      {/* ── Top row: duration badge + price ── */}
      <div className="flex justify-between items-start mb-3">
        {/* Duration pill — small gold badge */}
        <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
          {service.durationMin} min
        </span>

        {/* Price in COP — right-aligned, gold accent */}
        <span className="text-lg font-bold text-accent-gold tabular-nums">
          {formatCOP(service.priceCop)}
        </span>
      </div>

      {/* ── Service name (heading) ── */}
      <h3 className="font-heading text-xl font-bold text-text-primary mb-2 group-hover:text-accent-gold/90 transition-colors">
        {service.name}
      </h3>

      {/* ── Description (body) ── */}
      <p className="text-text-secondary text-sm leading-relaxed">
        {service.description}
      </p>
    </LiquidGlassContainer>
  );
}
