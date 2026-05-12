'use client';

import type { Service } from '@/types';
import LiquidGlassContainer from '@/components/layout/LiquidGlassContainer';

/**
 * Formats a price in Colombian Pesos (es‑CO locale).
 *
 * Uses Intl.NumberFormat for correct thousand separators and
 * currency symbol — no manual string manipulation needed.
 *
 * @example formatCOP(80000) → "$ 80.000"
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
  services: Service[];
  selectedId: number | null;
  onSelect: (service: Service) => void;
}

/**
 * Renders available services as selectable cards.
 *
 * Matches the ServiceCard aesthetic (liquid‑glass, gold accents)
 * but in a compact, selectable layout. The selected card gets a
 * gold border and subtle glow to indicate the active choice.
 *
 * # Responsive
 *   - Mobile: single column stack
 *   - Desktop: 3‑column grid (matching ServiceCatalog)
 */
export default function ServiceSelector({
  services,
  selectedId,
  onSelect,
}: Props) {
  if (services.length === 0) {
    return (
      <p className="text-text-secondary text-center py-6">
        No hay servicios disponibles en este momento.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {services.map((service) => {
        const isSelected = selectedId === service.id;
        return (
          <button
            key={service.id}
            type="button"
            onClick={() => onSelect(service)}
            className={`text-left w-full transition-all duration-300 ${
              isSelected
                ? 'ring-2 ring-accent-gold shadow-[0_0_20px_rgba(139,92,246,0.15)]'
                : 'hover:scale-[1.02]'
            }`}
            aria-pressed={isSelected}
          >
            <LiquidGlassContainer
              as="div"
              className="p-5 cursor-pointer"
            >
              {/* Top row: duration badge + price */}
              <div className="flex justify-between items-start mb-2">
                <span className="inline-block px-2.5 py-0.5 text-xs font-medium rounded-full bg-accent-gold/10 text-accent-gold border border-accent-gold/20">
                  {service.durationMin} min
                </span>
                <span className="text-base font-bold text-accent-gold tabular-nums">
                  {formatCOP(service.priceCop)}
                </span>
              </div>

              {/* Service name */}
              <h3 className="font-heading text-lg font-bold text-text-primary mb-1">
                {service.name}
              </h3>

              {/* Description */}
              <p className="text-text-secondary text-sm leading-relaxed line-clamp-2">
                {service.description}
              </p>

              {/* Selected indicator */}
              {isSelected && (
                <div className="mt-3 flex items-center gap-1.5 text-accent-gold text-xs font-medium">
                  <span className="w-2 h-2 rounded-full bg-accent-gold" />
                  Seleccionado
                </div>
              )}
            </LiquidGlassContainer>
          </button>
        );
      })}
    </div>
  );
}
