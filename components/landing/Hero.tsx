'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef } from 'react';

/**
 * Full-viewport Hero section with video background.
 *
 * # Video loop logic (requestAnimationFrame for smooth fade)
 *
 * CSS transitions on <video> elements are unreliable across browsers — rAF gives
 * us 60fps precision and works everywhere. The loop uses a quick dissolve:
 *
 *   1. ON MOUNT: play from start, fade-in 0→1 over 100ms.
 *   2. TIMEUPDATE: when 0.15s remain, start fade-out (100ms). When fade
 *      completes, seek to 0 and replay with fade-in (100ms).
 *   3. ENDED: safety net only (should rarely fire since we restart during fade).
 *
 * Total transition = 200ms of dissolve — barely perceptible, keeps continuity.
 * The warm gradient (#1a1410 → #0a0a0f) blends with video during the dissolve.
 *
 * # Visual fallback
 *
 * A radial gradient div (z-0, warm dark brown→bg) acts as the poster while the
 * video loads, and blends during the 200ms dissolve transition.
 *
 * # Responsive
 *
 * translate-y-[17%] on desktop centers the video's focal point vertically.
 * On mobile (max-md), this offset is removed so the full frame is visible.
 *
 * # Content overlay
 *
 * H1 "Descubre tu camino con Patyka Tarot", subtext about 10K+ TikTok
 * community, CTA button "Agendar mi Sesión Ahora" with liquid-glass styling
 * and a pulsing animation.
 */
/** Seconds before video end to start the fade-out (100ms dissolve). */
const FADE_LEAD_TIME = 0.15;

/** Duration of each fade transition in ms (200ms total dissolve). */
const FADE_DURATION_MS = 100;

export default function Hero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadingOutRef = useRef(false);
  const opacityRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  /**
   * Smoothly animates the video's opacity to a target value over `duration` ms.
   * Uses ease-out cubic easing for a natural deceleration.
   */
  const animateOpacity = useCallback(
    (target: number, duration: number, onComplete?: () => void) => {
      const video = videoRef.current;
      if (!video) return;

      // Cancel any in-progress animation to prevent conflicts
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);

      const start = opacityRef.current;
      const startTime = performance.now();

      const tick = (now: number) => {
        const elapsed = now - startTime;
        const progress = Math.min(elapsed / duration, 1);
        // ease-out cubic: decelerates toward the end
        const eased = 1 - Math.pow(1 - progress, 3);
        opacityRef.current = start + (target - start) * eased;
        video.style.opacity = String(opacityRef.current);

        if (progress < 1) {
          rafRef.current = requestAnimationFrame(tick);
        } else {
          opacityRef.current = target;
          video.style.opacity = String(target);
          rafRef.current = null;
          onComplete?.();
        }
      };

      rafRef.current = requestAnimationFrame(tick);
    },
    [],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Only run loop logic if video has a source (will be added in PR #6)
    const hasSource = video.querySelector('source') !== null;
    if (!hasSource) return;

    // ── Fade-in after metadata loads ──
    const onLoadedMetadata = () => {
      video.style.opacity = '0';
      video.currentTime = 0;
      video.play().catch(() => {
        // Autoplay may be blocked by browser policy — the poster gradient
        // div (z-0) acts as a static fallback in that case.
      });
      animateOpacity(1, FADE_DURATION_MS);
    };

    // ── Start fade-out with FADE_LEAD_TIME seconds to spare ──
    const onTimeUpdate = () => {
      if (!video.duration) return;
      const timeLeft = video.duration - video.currentTime;
      if (timeLeft <= FADE_LEAD_TIME && !fadingOutRef.current) {
        fadingOutRef.current = true;
        animateOpacity(0, FADE_DURATION_MS, () => {
          // Fade complete — restart immediately (200ms total dissolve)
          video.style.opacity = '0';
          opacityRef.current = 0;
          fadingOutRef.current = false;
          video.currentTime = 0;
          video.play().catch(() => {});
          animateOpacity(1, FADE_DURATION_MS);
        });
      }
    };

    // ── Safety net (should rarely fire since we restart during fade) ──
    const onEnded = () => {
      video.style.opacity = '0';
      opacityRef.current = 0;
      fadingOutRef.current = false;
      video.currentTime = 0;
      video.play().catch(() => {});
      animateOpacity(1, FADE_DURATION_MS);
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEnded);

    // If metadata already loaded (cached), trigger immediately
    if (video.readyState >= 1) {
      onLoadedMetadata();
    }

    return () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEnded);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [animateOpacity]);

  return (
    <section className="relative h-screen w-full overflow-hidden">
      {/*
       * Gradient fallback (poster) — visible while the video loads, and
       * briefly during fade transitions between loops. Uses a warm dark
       * brown (#1a1410) that matches the video's dominant earth tones,
       * avoiding the blue-ish flash the original purple (#1a1040) caused.
       */}
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse at 50% 50%, #1a1410 0%, #0a0a0f 70%)',
        }}
        aria-hidden="true"
      />

      {/*
       * Video layer — positioned on top of the gradient (z-10).
       * Feather overlays (z-15) soften the top and bottom edges so the
       * video blends seamlessly into the page background (#0a0a0f).
       * loop={false} because we handle looping manually for the fade transition.
       */}
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover z-10"
        muted
        playsInline
        loop={false}
        preload="metadata"
        aria-hidden="true"
        suppressHydrationWarning
      >
        <source src="/video/hero-bg.mp4" type="video/mp4" />
      </video>

      {/*
       * Feather overlays — fade the video edges into the page background
       * so there's no hard cut between the video and the radial gradient.
       * pointer-events-none ensures clicks pass through to the video.
       */}
      <div className="absolute top-0 left-0 right-0 z-15 h-24 md:h-32 bg-gradient-to-b from-[#0a0a0f] to-transparent pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 z-15 h-24 md:h-32 bg-gradient-to-t from-[#0a0a0f] to-transparent pointer-events-none" />

      {/* ─── Content overlay (z-20, above video) ─── */}
      <div className="relative z-20 flex flex-col items-center justify-center h-full px-4 text-center">
        <h1 className="font-heading text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-text-primary max-w-4xl leading-tight">
          Descubre tu camino con{' '}
          <span className="text-accent-gold">Patyka Tarot</span>
        </h1>

        <p className="mt-6 text-lg md:text-xl text-text-secondary max-w-2xl">
          Más de 10.000 personas ya son parte de nuestra comunidad en TikTok.
          Encontrá claridad, energía y guía espiritual con lecturas de tarot en
          línea.
        </p>

        <Link
          href="#booking"
          className="liquid-glass inline-flex items-center mt-8 px-8 py-4 text-lg font-medium text-accent-gold hover:text-text-primary hover:scale-[1.03] hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-300"
        >
          Agendar mi Sesión Ahora
        </Link>
      </div>
    </section>
  );
}
