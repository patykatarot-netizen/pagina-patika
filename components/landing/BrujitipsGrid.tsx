'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, X } from 'lucide-react';

/**
 * Inline SVG wand/star icon — replaces the 🪄 emoji for consistent
 * rendering across all platforms and proper accessibility.
 *
 * Purely decorative: aria-hidden="true" — the heading text conveys
 * the full meaning.
 */
function WandIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      className="w-7 h-7 md:w-8 md:h-8 inline-block align-middle"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* Wand shaft */}
      <line x1="4" y1="20" x2="16" y2="8" stroke="var(--accent-gold, #d4a853)" strokeWidth="2" />
      {/* Star sparkle */}
      <path
        d="M16 3l1.5 4.5L22 9l-4.5 1.5L16 15l-1.5-4.5L10 9l4.5-1.5z"
        fill="var(--accent-gold, #d4a853)"
        fillOpacity="0.6"
        stroke="var(--accent-gold, #d4a853)"
        strokeWidth="1"
      />
      {/* Small magic sparkles */}
      <circle cx="7" cy="5" r="1" fill="var(--accent-purple, #8b5cf6)" stroke="none" />
      <circle cx="20" cy="16" r="1" fill="var(--accent-purple, #8b5cf6)" stroke="none" />
    </svg>
  );
}

const BRUJITIPS_VIDEOS = [
  {
    id: '7627965307960741128',
    url: 'https://www.tiktok.com/@patyka550/video/7627965307960741128',
    label: 'Brujitip #1',
  },
  {
    id: '7623902223113768210',
    url: 'https://www.tiktok.com/@patyka550/video/7623902223113768210',
    label: 'Brujitip #2',
  },
  {
    id: '7633120948106923271',
    url: 'https://www.tiktok.com/@patyka550/video/7633120948106923271',
    label: 'Brujitip #3',
  },
  {
    id: '7635325145153916178',
    url: 'https://www.tiktok.com/@patyka550/video/7635325145153916178',
    label: 'Brujitip #4',
  },
];

interface ThumbnailData {
  id: string;
  thumbnailUrl: string | null;
  title: string | null;
}

/**
 * Brujitips Grid — click-to-play TikTok video cards with real thumbnails.
 *
 * # UX Philosophy
 *
 * El usuario controla QUÉ ve y CUÁNDO. Nada se reproduce sin su click.
 * Solo UN video activo a la vez — clickear uno nuevo desactiva el anterior.
 *
 * # How it works
 *
 *   1. Al scrollear a la sección, se obtienen thumbnails via oEmbed API
 *      y se precarga TikTok embed.js.
 *   2. Cada card muestra el thumbnail real + overlay con play button.
 *   3. Click → se activa el embed de TikTok (solo para esa card).
 *   4. Click en otra card → se destruye el embed anterior, se crea el nuevo.
 *   5. Click en la card activa → se desactiva (vuelve al thumbnail).
 *
 * # Visual
 *
 * - Thumbnail real del video como fondo de la card
 * - Gradiente oscuro en la parte inferior para legibilidad del label
 * - Play button semitransparente con glow hover
 * - Hover: escala 1.02 + glow dorado en borde
 * - Activo: borde acent-gold + glow
 */
export default function BrujitipsGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, ThumbnailData>>({});
  const [thumbnailsLoading, setThumbnailsLoading] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [embedScriptLoaded, setEmbedScriptLoaded] = useState(false);
  const [embedReady, setEmbedReady] = useState(false);

  // ── IntersectionObserver: activate section when scrolled into view ──
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
      { rootMargin: '200px', threshold: 0 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // ── Fetch thumbnails from oEmbed proxy + preload embed.js ──
  useEffect(() => {
    if (!isVisible) return;

    const videoUrls = BRUJITIPS_VIDEOS.map((v) => v.url);
    const params = new URLSearchParams();
    videoUrls.forEach((u) => params.append('url', u));

    setThumbnailsLoading(true);
    fetch(`/api/tiktok/thumbnails?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, ThumbnailData> = {};
        for (const t of data.thumbnails ?? []) {
          map[t.id] = t;
        }
        setThumbnails(map);
      })
      .catch(() => {
        // thumbnails quedan vacíos — los placeholders siguen funcionando
      })
      .finally(() => setThumbnailsLoading(false));

    // Pre-load TikTok embed.js (se necesita cuando el usuario haga click)
    if (!embedScriptLoaded) {
      const existing = document.querySelector<HTMLScriptElement>(
        'script[src*="tiktok.com/embed.js"]',
      );
      if (!existing) {
        const script = document.createElement('script');
        script.src = 'https://www.tiktok.com/embed.js';
        script.async = true;
        script.onload = () => setEmbedScriptLoaded(true);
        document.body.appendChild(script);
      } else {
        setEmbedScriptLoaded(true);
      }
    }
  }, [isVisible, embedScriptLoaded]);

  // ── When activeId changes, wait for DOM to settle, then signal embed ready ──
  useEffect(() => {
    if (!activeId) {
      setEmbedReady(false);
      return;
    }
    // Small delay ensures the blockquote is in the DOM before TikTok processes it
    const timer = setTimeout(() => setEmbedReady(true), 150);
    return () => clearTimeout(timer);
  }, [activeId]);

  // ── Re-process TikTok embeds when embedReady becomes true ──
  useEffect(() => {
    if (!embedReady || !activeId) return;

    // TikTok embed.js procesa blockquotes automáticamente via MutationObserver.
    // Si no lo hace, force-process recreando temporalmente el script.
    const timer = setTimeout(() => {
      // Verificar si TikTok procesó el embed (buscamos si hay un iframe)
      const container = embedContainerRef.current;
      if (container && !container.querySelector('iframe')) {
        // Re-load embed.js con cache-busting como fallback
        const script = document.createElement('script');
        script.src = `https://www.tiktok.com/embed.js?v=${Date.now()}`;
        script.async = true;
        document.body.appendChild(script);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [embedReady, activeId]);

  const handleCardClick = useCallback(
    (id: string) => {
      if (activeId === id) {
        setActiveId(null); // desactivar
      } else {
        setActiveId(id); // activar (desactiva el anterior)
      }
    },
    [activeId],
  );

  return (
    <section id="brujitips" className="py-20 md:py-32 px-4">
      <div className="max-w-7xl mx-auto" ref={sectionRef}>
        {/* ── Section heading ── */}
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary text-center mb-4 inline-flex items-center gap-3">
          Mis Mejores Brujitips
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7 text-accent-gold" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
        </h2>
        <p className="text-text-secondary text-center max-w-lg mx-auto mb-12 text-sm md:text-base">
          Los rituales y consejos que han cautivado a miles en TikTok
        </p>

        {/* ── Grid: 2 cols mobile, 4 cols desktop ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {BRUJITIPS_VIDEOS.map((video) => {
            const thumb = thumbnails[video.id];
            const isActive = activeId === video.id;

            return (
              <button
                key={video.id}
                type="button"
                onClick={() => handleCardClick(video.id)}
                className={`
                  group relative overflow-hidden rounded-xl aspect-[3/4] md:aspect-[9/16]
                  transition-all duration-300 ease-out
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold
                  ${isActive
                    ? 'ring-2 ring-accent-gold shadow-[0_0_30px_rgba(139,92,246,0.4)] scale-[1.02] z-10'
                    : 'hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]'
                  }
                `}
              >
                {isActive ? (
                  /* ── TikTok Embed activo ── */
                  <div
                    ref={embedContainerRef}
                    className="absolute inset-0 z-20 bg-black"
                  >
                    <blockquote
                      className="tiktok-embed w-full h-full"
                      cite={video.url}
                      data-video-id={video.id}
                      style={{ maxWidth: '100%', minWidth: 'auto' }}
                    >
                      <section>
                        <a
                          href={video.url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {video.label}
                        </a>
                      </section>
                    </blockquote>

                    {/* Botón cerrar — visible sobre el embed */}
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveId(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.stopPropagation();
                          setActiveId(null);
                        }
                      }}
                      className="absolute top-2 right-2 z-30 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
                      aria-label="Cerrar video"
                    >
                      <X className="w-4 h-4" />
                    </div>
                  </div>
                ) : (
                  /* ── Card inactiva: thumbnail + overlay ── */
                  <>
                    {/* Thumbnail background */}
                    {thumb?.thumbnailUrl ? (
                      <img
                        src={thumb.thumbnailUrl}
                        alt={video.label}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    ) : (
                      /* Fallback gradient mientras carga el thumbnail */
                      <div className="absolute inset-0 bg-gradient-to-br from-accent-purple/30 to-accent-gold/10" />
                    )}

                    {/* Overlay oscuro gradual (más oscuro abajo para el label) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                    {/* Play button centrado */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="
                          w-14 h-14 md:w-16 md:h-16 rounded-full
                          bg-white/15 backdrop-blur-sm
                          flex items-center justify-center
                          transition-all duration-300
                          group-hover:bg-white/25 group-hover:scale-110
                          ${thumbnailsLoading ? 'opacity-50' : ''}
                        "
                      >
                        <Play
                          className="w-6 h-6 md:w-7 md:h-7 text-white/90 ml-0.5"
                          fill="currentColor"
                        />
                      </div>
                    </div>

                    {/* Label en la parte inferior */}
                    <div className="absolute bottom-0 left-0 right-0 p-3 md:p-4">
                      <span className="block text-xs md:text-sm font-medium text-white/90 drop-shadow-sm">
                        {video.label}
                      </span>
                      {thumb?.title && (
                        <span className="block text-[10px] md:text-xs text-white/60 mt-0.5 truncate">
                          {thumb.title}
                        </span>
                      )}
                    </div>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
