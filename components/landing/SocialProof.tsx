'use client';

import { useEffect, useRef, useState } from 'react';
import type { Testimonial } from '@/types';
import LiquidGlassContainer from '@/components/layout/LiquidGlassContainer';
import { Quote } from 'lucide-react';

/**
 * Count-up animation hook using requestAnimationFrame.
 *
 * # How it works
 *
 * When `start` becomes true (triggered by IntersectionObserver),
 * the hook animates from 0 to `target` over `duration` ms using
 * requestAnimationFrame with ease-out cubic easing.
 *
 * Why rAF instead of CSS transitions?
 *   - CSS can't animate text content (only numeric CSS properties).
 *   - rAF gives us 60fps precision and works even if the tab is
 *     backgrounded (requestAnimationFrame pauses automatically).
 *
 * Why ease-out cubic?
 *   - Natural deceleration: the counter rushes at first, then
 *     gently settles on the final number. Feels premium.
 *   - Formula: 1 - (1 - t)³  where t = elapsed / duration
 *
 * @param target  Final number to count up to
 * @param duration Animation duration in ms
 * @param start   Whether to start the animation (controlled by IntersectionObserver)
 */
function useCountUp(target: number, duration: number, start: boolean): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!start) return;

    let animationId: number;
    const startTime = performance.now();

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));

      if (progress < 1) {
        animationId = requestAnimationFrame(tick);
      } else {
        setCount(target);
      }
    };

    animationId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationId);
  }, [target, duration, start]);

  return count;
}

/**
 * Formats a number with abbreviated notation for social stats.
 * Example: 10000 → "10K", 63900 → "63.9K", 1500000 → "1.5M"
 */
function formatStat(value: number): string {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    // If it's a clean thousand, show integer (10K not 10.0K)
    return k % 1 === 0 ? `${k}K` : `${k.toFixed(1)}K`;
  }
  return String(value);
}

interface Stat {
  label: string;
  value: number;
}

/**
 * Single animated stat counter.
 *
 * Must be its own component (not inlined in a .map()) because
 * useCountUp is a custom hook that calls useState/useEffect.
 * React's Rules of Hooks require hooks to be called at the top
 * level of a component — never inside loops or callbacks.
 */
function StatCounter({ stat, isVisible }: { stat: Stat; isVisible: boolean }) {
  const count = useCountUp(stat.value, 2000, isVisible);

  return (
    <div className="text-center">
      <span className="block font-heading text-4xl md:text-5xl font-bold text-accent-gold tabular-nums">
        +{formatStat(count)}
      </span>
      <span className="text-sm text-text-secondary mt-1 block">
        {stat.label}
      </span>
    </div>
  );
}

interface Props {
  stats: Stat[];
  testimonials: Testimonial[];
}

/**
 * Social Proof section — follower counters + testimonials.
 *
 * # Counter animation
 *
 * Uses `useCountUp` (see above) triggered by IntersectionObserver.
 * When the section scrolls into view, both counters animate from 0
 * to their target value over 2 seconds with ease-out cubic easing.
 *
 * # Testimonials
 *
 * When testimonials exist in the DB, they are displayed as quote
 * cards in a 2-column layout (1 col on mobile). The testimonial
 * content is wrapped in a LiquidGlassContainer with a decorative
 * Quote icon.
 *
 * If the testimonials table is empty (which it will be initially
 * — it's seeded empty), a friendly fallback message is shown
 * instead. The fallback uses Rioplatense Spanish to match the
 * brand voice.
 *
 * # IntersectionObserver
 *
 * Same lazy-trigger pattern as BrujitipsGrid: observe the section
 * container, disconnect after first intersection. The 200px
 * rootMargin ensures the animation starts before the user sees the
 * numbers, so the count is already climbing when they look at it.
 */
export default function SocialProof({ stats, testimonials }: Props) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  // ── IntersectionObserver: trigger counter animation ──
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        rootMargin: '200px',
        threshold: 0,
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="testimonials" className="py-20 md:py-32 px-4">
      <div className="max-w-7xl mx-auto" ref={sectionRef}>
        {/* ── Section heading ── */}
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary text-center mb-4">
          Lo que dice nuestra comunidad
        </h2>
        <p className="text-text-secondary text-center max-w-lg mx-auto mb-12 text-sm md:text-base">
          Más de 10.000 personas ya confían en Patyka Tarot para sus lecturas
          espirituales.
        </p>

        {/* ── Stats row: animated counters ── */}
        <div className="flex flex-wrap justify-center gap-8 md:gap-16 mb-16">
          {stats.map((stat) => (
            <StatCounter
              key={stat.label}
              stat={stat}
              isVisible={isVisible}
            />
          ))}
        </div>

        {/* ── Testimonials or fallback ── */}
        {testimonials.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {testimonials.map((t) => (
              <LiquidGlassContainer
                key={t.id}
                as="blockquote"
                className="p-6"
              >
                <Quote className="w-5 h-5 text-accent-gold/30 mb-3" />
                <p className="text-text-secondary text-sm leading-relaxed italic mb-3">
                  &ldquo;{t.content}&rdquo;
                </p>
                <cite className="text-accent-gold/80 text-xs not-italic font-medium">
                  — {t.authorName}
                </cite>
              </LiquidGlassContainer>
            ))}
          </div>
        ) : (
          /* Empty testimonials — friendly fallback */
          <LiquidGlassContainer className="max-w-lg mx-auto p-8 text-center">
            <p className="text-text-secondary text-sm leading-relaxed">
              Pronto compartiremos las experiencias de nuestra comunidad.
              Mientras tanto, conocé nuestros servicios y agendá tu sesión.
            </p>
          </LiquidGlassContainer>
        )}
      </div>
    </section>
  );
}
