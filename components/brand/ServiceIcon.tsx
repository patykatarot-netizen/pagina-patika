'use client';

import { MessageCircle, Eye, SunMoon, Sparkles } from 'lucide-react';
import type { ServiceCategory } from '@/types';

/**
 * Props for ServiceIcon.
 *
 * @prop category - One of the four Patyka service categories
 * @prop className - Additional CSS classes appended to the icon
 */
interface ServiceIconProps {
  category: ServiceCategory;
  className?: string;
}

/**
 * Maps each service category to its Lucide icon.
 *
 * | Category    | Icon           | Meaning           |
 * |-------------|----------------|-------------------|
 * | pregunta    | MessageCircle  | Consulta rápida   |
 * | tematica    | Eye            | Lectura enfocada  |
 * | completa    | SunMoon        | Lectura completa  |
 * | energetico  | Sparkles       | Energía           |
 */
const ICON_MAP: Record<ServiceCategory, typeof MessageCircle> = {
  pregunta: MessageCircle,
  tematica: Eye,
  completa: SunMoon,
  energetico: Sparkles,
};

/**
 * Maps each service category to its accent color token.
 *
 * Colors follow the PDR v2.0 palette:
 *   - Gold (#d4a853):   pregunta, completa
 *   - Purple (#a855f7): tematica
 *   - Yellow (#f5d76e): energetico
 */
const COLOR_MAP: Record<ServiceCategory, string> = {
  pregunta: 'text-accent-gold',
  tematica: 'text-accent-purple',
  completa: 'text-accent-gold',
  energetico: 'text-accent-yellow',
};

/**
 * ServiceIcon — themed icon for Patyka Tarot service categories.
 *
 * Renders a Lucide icon with the accent color corresponding to the
 * service category. Used in cards, selectors, and anywhere a visual
 * identifier for a service group is needed.
 *
 * Default size: 24×24px (w-6 h-6). Override with `className`.
 *
 * @example
 *   <ServiceIcon category="pregunta" />
 *   <ServiceIcon category="tematica" className="w-8 h-8" />
 */
export default function ServiceIcon({
  category,
  className = '',
}: ServiceIconProps) {
  const Icon = ICON_MAP[category];
  const color = COLOR_MAP[category];

  return <Icon className={`w-6 h-6 ${color} ${className}`} aria-hidden="true" />;
}
