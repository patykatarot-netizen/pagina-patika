'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';

/**
 * Sticky mobile CTA button — visible only on mobile (<768px).
 *
 * Behavior:
 * - Fixed at the bottom of the viewport with Liquid Glass styling.
 * - Links to the #booking section.
 * - Dispatches `patyka:close-drawer` custom event so the Nav drawer
 *   closes if the user taps the CTA while the drawer is open.
 * - Uses IntersectionObserver on the footer element: when the footer
 *   enters the viewport, the button slides off-screen via translate-y-full;
 *   when the footer leaves, the button slides back in.
 * - Respects env(safe-area-inset-bottom) for iOS home indicator bar.
 * - Minimum 44x44px touch target.
 */
export default function MobileCTA() {
  const [isMobile, setIsMobile] = useState(false);
  const [isFooterVisible, setIsFooterVisible] = useState(false);

  // ── Media query: detect mobile viewport ──
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // ── IntersectionObserver: hide when footer is visible ──
  useEffect(() => {
    if (!isMobile) return;

    const footer = document.querySelector('footer');
    if (!footer) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsFooterVisible(entry.isIntersecting);
      },
      {
        threshold: 0,
        rootMargin: '0px 0px 80px 0px',
      },
    );

    observer.observe(footer);
    return () => observer.disconnect();
  }, [isMobile]);

  // ── Click handler: close drawer if open ──
  const handleClick = useCallback(() => {
    const event = new CustomEvent('patyka:close-drawer');
    document.dispatchEvent(event);
  }, []);

  // ── Guard: don't render anything on desktop ──
  if (!isMobile) return null;

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 z-50 md:hidden transition-transform duration-300 ease-out pb-[env(safe-area-inset-bottom,16px)] ${
        isFooterVisible ? 'translate-y-full' : 'translate-y-0'
      }`}
    >
      <div className="px-4 pb-4">
        <Link
          href="#booking"
          onClick={handleClick}
          className="liquid-glass flex items-center justify-center gap-2 min-h-[44px] px-6 py-3 text-base font-medium text-accent-gold hover:text-text-primary hover:shadow-[0_0_25px_rgba(139,92,246,0.3)] transition-all duration-300 active:scale-[0.98]"
          aria-label="Agendar una lectura"
        >
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span>Agendar</span>
        </Link>
      </div>
    </div>
  );
}
