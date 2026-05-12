import type { Service } from '@/types';
import { Sparkles } from 'lucide-react';
import ServiceCard from './ServiceCard';

/**
 * Service catalog section — grid of tarot reading services.
 *
 * # SSR pattern
 *
 * This is a **Server Component** (no 'use client'). The parent
 * (page.tsx, also an async Server Component) queries active services
 * from the database via Drizzle and passes them here as props.
 *
 * Why not client-side fetch?
 *   - DB is on the same server (Coolify), so SSR avoids a round-trip.
 *   - Services change infrequently — no need for real-time updates.
 *   - HTML sent to the browser already contains the service cards,
 *     making them visible to search engines immediately (SEO).
 *
 * # Responsive grid
 *
 *   1 column on mobile (default)
 *   2 columns at md (768px)
 *   3 columns at lg (1024px)
 *
 * # Empty state
 *
 * When no active services exist, a friendly message with a decorative
 * Sparkles icon is displayed instead of rendering nothing. This keeps
 * the section present in the DOM (good for SEO and layout stability)
 * while informing users honestly.
 *
 * # Heading
 *
 * "Mis Servicios de Tarot" — uses Instrument Serif (font-heading)
 * for consistency with the rest of the page's heading hierarchy.
 */

interface Props {
  /** Active services queried from the DB (parent passes SSR data). */
  services: Service[];
}

export default function ServiceCatalog({ services }: Props) {
  // ── Empty state: friendly message instead of null ──
  if (services.length === 0) {
    return (
      <section id="services" className="py-20 md:py-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary text-center mb-4">
            Mis Servicios de Tarot
          </h2>
          <div className="liquid-glass inline-flex flex-col items-center gap-4 px-8 py-10 rounded-2xl">
            <Sparkles className="w-10 h-10 lucide-sparkles text-accent-purple/60" />
            <p className="text-text-secondary text-base md:text-lg max-w-md">
              No hay servicios disponibles por el momento.
            </p>
            <p className="text-text-secondary/50 text-sm">
              Volvé pronto — Patyka está preparando nuevas lecturas para vos.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-20 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ── Section heading ── */}
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary text-center mb-4">
          Mis Servicios de Tarot
        </h2>
        <p className="text-text-secondary text-center max-w-lg mx-auto mb-12 text-sm md:text-base">
          Encontrá la lectura ideal para tu momento. Todas las sesiones son
          virtuales por Google Meet.
        </p>

        {/* ── Responsive service grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>
    </section>
  );
}
