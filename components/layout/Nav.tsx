'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import Logo from '@/components/brand/Logo';

const NAV_LINKS = [
  { href: '#services', label: 'Servicios' },
  { href: '#brujitips', label: 'Brujitips' },
  { href: '#booking', label: 'Agendar' },
] as const;

/**
 * Responsive navigation bar for Patyka Tarot.
 *
 * Behavior:
 * - Transparent by default, gains blurred backdrop when scrolled past 20px.
 * - Logo: tarot card mark + "Patyka" wordmark — links to / (top of page).
 * - Desktop (>=768px): horizontal nav links + CTA.
 * - Mobile (<768px): hamburger button → slide-in drawer with nav links.
 * - Scroll spy: IntersectionObserver highlights active section link.
 * - Focus trap: mobile drawer traps Tab/Escape when open.
 */
export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState<string | null>(null);

  // ── Refs ──
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // ── Media query: detect mobile viewport ──
  useEffect(() => {
    const mql = window.matchMedia('(max-width: 767px)');
    setIsMobile(mql.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  // ── Scroll detection ──
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── Scroll spy: IntersectionObserver for active section ──
  useEffect(() => {
    const sections = NAV_LINKS.map((link) => link.href.replace('#', ''));
    const observers: IntersectionObserver[] = [];

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveSection(`#${id}`);
          }
        },
        { rootMargin: '-40% 0px -55% 0px', threshold: 0 },
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // ── Focus management: move focus into drawer on open, restore on close ──
  useEffect(() => {
    if (isMenuOpen) {
      // Move focus to first nav link after render (use microtask for test compatibility)
      const id = requestAnimationFrame(() => {
        firstLinkRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    } else {
      // Restore focus to hamburger when drawer closes
      const id = requestAnimationFrame(() => {
        hamburgerRef.current?.focus();
      });
      return () => cancelAnimationFrame(id);
    }
  }, [isMenuOpen]);

  // ── Global Escape key listener (attached to document so it fires regardless of focus) ──
  useEffect(() => {
    if (!isMenuOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen]);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  // ── Keyboard handler: trap Tab + close on Escape ──
  const handleDrawerKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        // Query all focusable elements inside the drawer
        const focusable = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled])',
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift+Tab: if on first element, wrap to last
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    },
    [closeMenu],
  );

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 spring-smooth ${
          scrolled
            ? 'bg-bg-primary/80 backdrop-blur-lg border-b border-border-glass'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center gap-2.5 text-text-primary hover:text-accent-gold transition-colors"
              aria-label="Patyka Tarot — Ir al inicio"
            >
              <Logo className="h-7 w-auto text-accent-gold" />
              <span className="text-lg md:text-3xl font-semibold tracking-wide">Patyka</span>
            </Link>

            {/* Desktop nav links — hidden below md breakpoint */}
            <div className="hidden md:flex items-center gap-8">
              {NAV_LINKS.map((link) => {
                const isActive = activeSection === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm md:text-xl tracking-wide transition-colors ${
                      isActive
                        ? 'text-accent-gold font-medium'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* Desktop CTA — hidden on mobile (replaced by drawer) */}
            <Link
              href="#booking"
              className="hidden md:inline-flex liquid-glass items-center px-4 py-2 text-sm md:text-xl font-medium text-accent-gold hover:text-text-primary hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] spring-smooth"
            >
              Agendar Sesión
            </Link>

            {/* Hamburger button — visible only on mobile */}
            {isMobile && (
              <button
                ref={hamburgerRef}
                onClick={toggleMenu}
                className="min-w-[44px] min-h-[44px] inline-flex items-center justify-center text-text-primary hover:text-accent-gold transition-colors"
                aria-label={isMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? (
                  <X className="h-6 w-6 spring-bounce rotate-0" />
                ) : (
                  <Menu className="h-6 w-6 spring-bounce" />
                )}
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile Drawer ── */}
      {isMenuOpen && isMobile && (
        <div
          ref={drawerRef}
          role="dialog"
          aria-modal="true"
          aria-label="Navegación"
          className="fixed inset-y-0 right-0 z-[60] w-72 bg-bg-primary/95 backdrop-blur-xl translate-x-0 spring-bounce"
          onKeyDown={handleDrawerKeyDown}
        >
          <div className="flex flex-col pt-20 px-6 gap-4">
            {NAV_LINKS.map((link, i) => {
                const isActive = activeSection === link.href;
                return (
                  <Link
                    key={link.href}
                    ref={i === 0 ? firstLinkRef : undefined}
                    href={link.href}
                    onClick={closeMenu}
                    className={`min-h-[44px] flex items-center text-lg tracking-wide transition-colors ${
                      isActive
                        ? 'text-accent-gold font-medium'
                        : 'text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            <Link
              href="#booking"
              onClick={closeMenu}
              className="min-h-[44px] flex items-center justify-center mt-4 liquid-glass px-4 py-3 text-base font-medium text-accent-gold hover:text-text-primary hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] spring-smooth"
            >
              Agendar Sesión
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
