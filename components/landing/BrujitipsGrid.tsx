'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Play, X, Volume2, VolumeX } from 'lucide-react';

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
 * Brujitips Grid — click-to-play TikTok video cards with iframe player.
 *
 * # Sound enabled by default
 *
 * Uses TikTok's iframe player v1 with postMessage API to send
 * play + unmute commands on user click. This bypasses the browser's
 * autoplay-mute policy because the click is a valid user gesture.
 *
 * # How it works
 *
 *   1. Al scrollear a la sección, se obtienen thumbnails via oEmbed API.
 *   2. Cada card muestra el thumbnail real + overlay con play button.
 *   3. Click → se crea un iframe con el player de TikTok.
 *   4. Cuando el iframe carga, se envía postMessage de play + unmute.
 *   5. Click en otra card → se destruye el iframe anterior, se crea el nuevo.
 *   6. Click en la card activa → se desactiva (vuelve al thumbnail).
 */
export default function BrujitipsGrid() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [thumbnails, setThumbnails] = useState<Record<string, ThumbnailData>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

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

  // ── Fetch thumbnails from oEmbed proxy ──
  useEffect(() => {
    if (!isVisible) return;

    const videoUrls = BRUJITIPS_VIDEOS.map((v) => v.url);
    const params = new URLSearchParams();
    videoUrls.forEach((u) => params.append('url', u));

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
      });
  }, [isVisible]);

  // ── When iframe loads, send play + unmute via postMessage ──
  useEffect(() => {
    if (!iframeLoaded || !activeId) return;

    const sendPlayAndUnmute = () => {
      if (iframeRef.current?.contentWindow) {
        // Play
        iframeRef.current.contentWindow.postMessage(
          { type: 'play', 'x-tiktok-player': true },
          'https://www.tiktok.com',
        );
        // Unmute
        iframeRef.current.contentWindow.postMessage(
          { type: 'unmute', 'x-tiktok-player': true },
          'https://www.tiktok.com',
        );
        setIsMuted(false);
      }
    };

    // Small delay to ensure iframe is ready
    const timer = setTimeout(sendPlayAndUnmute, 300);
    return () => clearTimeout(timer);
  }, [iframeLoaded, activeId]);

  // ── Listen for player state changes ──
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.origin.includes('tiktok.com')) return;
      if (event.data?.type === 'pause') {
        // Player paused — could update UI if needed
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleCardClick = useCallback(
    (id: string) => {
      if (activeId === id) {
        setActiveId(null);
        setIframeLoaded(false);
      } else {
        setActiveId(id);
        setIframeLoaded(false); // Reset for new iframe
      }
    },
    [activeId],
  );

  const toggleMute = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (iframeRef.current?.contentWindow) {
      if (isMuted) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'unmute', 'x-tiktok-player': true },
          'https://www.tiktok.com',
        );
        setIsMuted(false);
      } else {
        iframeRef.current.contentWindow.postMessage(
          { type: 'mute', 'x-tiktok-player': true },
          'https://www.tiktok.com',
        );
        setIsMuted(true);
      }
    }
  }, [isMuted]);

  const activeVideo = BRUJITIPS_VIDEOS.find((v) => v.id === activeId);

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

        {/* ── Grid: 2 cols mobile (2x2), 4 cols desktop ── */}
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
                  spring-smooth
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-gold
                  ${isActive
                    ? 'ring-2 ring-accent-gold shadow-[0_0_30px_rgba(139,92,246,0.4)] scale-[1.02] z-10'
                    : 'hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(139,92,246,0.2)]'
                  }
                `}
              >
                {isActive ? (
                  /* ── TikTok Iframe Player activo ── */
                  <div className="absolute inset-0 z-20 bg-black">
                    <iframe
                      ref={iframeRef}
                      src={`https://www.tiktok.com/player/v1/${video.id}?&music_info=1&description=1`}
                      className="w-full h-full border-0"
                      allow="autoplay; fullscreen; encrypted-media"
                      onLoad={() => setIframeLoaded(true)}
                      title={video.label}
                    />

                    {/* Controles overlay */}
                    <div className="absolute top-2 right-2 z-30 flex gap-2">
                      {/* Toggle mute */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={toggleMute}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            toggleMute(e as unknown as React.MouseEvent);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
                        aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
                      >
                        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                      </div>

                      {/* Botón cerrar */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveId(null);
                          setIframeLoaded(false);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.stopPropagation();
                            setActiveId(null);
                            setIframeLoaded(false);
                          }
                        }}
                        className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center text-white/80 hover:text-white hover:bg-black/80 transition-colors cursor-pointer"
                        aria-label="Cerrar video"
                      >
                        <X className="w-4 h-4" />
                      </div>
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
                          spring-smooth
                          group-hover:bg-white/25 group-hover:scale-110
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
