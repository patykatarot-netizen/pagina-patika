import type { Service, ServiceCategory } from '@/types';
import { Sparkles, MessageCircle, Eye, type LucideIcon } from 'lucide-react';
import ServiceCard from './ServiceCard';
import StaggeredReveal from '@/components/effects/StaggeredReveal';

interface CategoryDef {
  key: string;
  label: string;
  icon: LucideIcon;
  color: string;
  serviceKeys: ServiceCategory[];
}

const CATEGORIES: CategoryDef[] = [
  {
    key: 'pregunta',
    label: 'Preguntas Puntuales',
    icon: MessageCircle,
    color: 'text-accent-gold',
    serviceKeys: ['pregunta'],
  },
  {
    key: 'lecturas',
    label: 'Lecturas',
    icon: Eye,
    color: 'text-accent-purple',
    serviceKeys: ['tematica', 'completa'],
  },
  {
    key: 'energetico',
    label: 'Trabajos Energéticos',
    icon: Sparkles,
    color: 'text-accent-yellow',
    serviceKeys: ['energetico'],
  },
];

const WHATSAPP_NOTE =
  'Estas consultas se agendan el mismo día directamente por WhatsApp. Son las únicas que se agendan por ese medio.';

interface Props {
  /** Active services queried from the DB (parent passes SSR data). */
  services: Service[];
}

export default function ServiceCatalog({ services }: Props) {
  // ── Empty state: friendly message instead of null ──
  if (services.length === 0) {
    return (
      <section id="services" className="py-24 md:py-32 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="font-heading text-3xl md:text-6xl font-bold text-text-primary text-center mb-4">
            Mis Servicios de Tarot
          </h2>
          <div className="liquid-glass inline-flex flex-col items-center gap-4 px-8 py-10 rounded-2xl">
            <Sparkles className="w-10 h-10 lucide-sparkles text-accent-purple/60" />
            <p className="text-text-secondary text-base md:text-2xl max-w-md">
              No hay servicios disponibles por el momento.
            </p>
            <p className="text-text-secondary/50 text-sm md:text-xl">
              Volvé pronto — Patyka está preparando nuevas lecturas para vos.
            </p>
          </div>
        </div>
      </section>
    );
  }

  // ── Group services by visual category ──
  const grouped = CATEGORIES.map((cat) => ({
    ...cat,
    services: services.filter((s) => cat.serviceKeys.includes(s.category)),
  }));

  return (
    <section id="services" className="py-24 md:py-32 px-4">
      <div className="max-w-7xl mx-auto">
        {/* ── Section heading ── */}
        <h2 className="font-heading text-3xl md:text-6xl font-bold text-text-primary text-center mb-4">
          Mis Servicios de Tarot
        </h2>
        <p className="text-text-secondary text-center max-w-lg mx-auto mb-16 text-base md:text-2xl">
          Encontrá la lectura ideal para tu momento.
        </p>

        {/* ── Visual categories (Miller's Law: 3 chunks max) ── */}
        {grouped.map((category) => (
          <div key={category.key} className="mb-16 last:mb-0">
            {/* Category header with icon */}
            <div className="flex items-center gap-3 mb-6">
              <category.icon className={`w-6 h-6 ${category.color}`} />
              <h3 className="font-heading text-2xl md:text-5xl font-bold text-text-primary">
                {category.label}
              </h3>
            </div>

            {/* Services grid */}
            <StaggeredReveal staggerMs={100} threshold={0.1}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {category.services.map((service) => (
                  <ServiceCard key={service.id} service={service} />
                ))}
              </div>
            </StaggeredReveal>

            {/* Inline note for Preguntas Puntuales */}
            {category.key === 'pregunta' && category.services.length > 0 && (
              <div className="mt-4 glass-subtle p-4 rounded-lg">
                <p className="text-text-secondary text-sm md:text-xl">
                  📱 {WHATSAPP_NOTE}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
