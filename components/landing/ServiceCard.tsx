'use client';

import type { Service } from '@/types';
import LiquidGlassContainer from '@/components/layout/LiquidGlassContainer';
import ServiceIcon from '@/components/brand/ServiceIcon';

/**
 * Formats a price in Colombian Pesos using the es-CO locale.
 * Intl.NumberFormat handles thousand separators and the COP symbol
 * natively — no manual string munging needed.
 *
 * Example: 80000 → "$ 80.000"
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
 * Marked 'use client' because it uses hover effects (spring-bounce
 * + glow shadow), which require CSS transitions that only work
 * predictably when rendered on the client.
 *
 * # PDR v2.0 visual identity
 *
 * Wrapped in LiquidGlassContainer with glass-primary depth and
 * squircle-lg (16px) border-radius. On hover, a spring-bounce
 * animation + golden glow shadow reinforce the tactile "liquid gel"
 * premium feel.
 *
 * # Card layout (top to bottom)
 *   - Icon (ServiceIcon by category) + channel badge (Web/WhatsApp)
 *   - Service name (heading, Instrument Serif, bold)
 *   - Description (text-base, DM Sans, muted — NEVER text-sm)
 *   - Divider line
 *   - Duration badge (glass-subtle pill) + price (gold, text-xl)
 */
export default function ServiceCard({ service }: Props) {
  const isWhatsappOnly = service.bookingType === 'whatsapp_only';
  const isComingSoon = service.priceCop === 0 && service.durationMin === 0;

  return (
    <LiquidGlassContainer
      as="article"
      level="primary"
      squircle="lg"
      className="group p-6 spring-bounce hover:shadow-[0_0_25px_rgba(212,168,83,0.15)]"
    >
      {/* ── Icon + channel badge ── */}
      <div className="flex justify-between items-start mb-4">
        <ServiceIcon category={service.category} className="w-8 h-8" />

        {/* Channel badge — green for WhatsApp, gold for web booking, amber for coming soon */}
        <span
          className={`
            inline-block px-3 py-1 text-xs md:text-lg font-medium rounded-full
            ${
              isComingSoon
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                : isWhatsappOnly
                  ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                  : 'bg-accent-gold/10 text-accent-gold border border-accent-gold/20'
            }
          `}
        >
          {isComingSoon ? 'Próximamente' : isWhatsappOnly ? 'Solo WhatsApp' : 'Agendar Online'}
        </span>
      </div>

      {/* ── Service name ── */}
      <h3 className="font-heading text-xl md:text-4xl font-bold text-text-primary mb-2 group-hover:text-accent-gold/90 transition-colors">
        {service.name}
      </h3>

      {/* ── Description — text-base minimum, never text-sm ── */}
      <p className="text-text-secondary text-base md:text-2xl leading-relaxed mb-4">
        {service.description}
      </p>

      {/* ── Divider + duration & price ── */}
      <div className="flex justify-between items-center pt-4 border-t border-border-glass">
        {/* Duration — glass-subtle pill, or "Próximamente" for unreleased services */}
        {isComingSoon ? (
          <span className="glass-subtle px-3 py-1 text-xs md:text-lg font-medium rounded-full text-amber-400">
            Próximamente
          </span>
        ) : (
          <span className="glass-subtle px-3 py-1 text-xs md:text-lg font-medium rounded-full text-text-secondary">
            {service.durationMin} min
          </span>
        )}

        {/* Price — gold, text-xl, tabular-nums; hidden for coming soon */}
        {!isComingSoon && (
          <span className="text-xl md:text-4xl font-bold text-accent-gold tabular-nums">
            {formatCOP(service.priceCop)}
          </span>
        )}
      </div>
    </LiquidGlassContainer>
  );
}
