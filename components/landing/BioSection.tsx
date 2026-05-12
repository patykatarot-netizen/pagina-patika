import { Sparkles } from 'lucide-react';

/**
 * Tarot-themed inline SVG illustration.
 *
 * Features a stylized tarot card back with:
 * - Double geometric frame (outer + inner border)
 * - Central 4-pointed star (The Star arcana motif)
 * - Crescent moon above the star
 * - Small accent stars in corners
 * - Uses currentColor + CSS custom properties for theme consistency
 *
 * Purely decorative — aria-hidden="true" with role="img" + aria-label
 * for accessible identification.
 */
function TarotIllustration() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 200 280"
      className="w-auto h-64 md:h-72"
      role="img"
      aria-label="Ilustración de tarot"
      fill="none"
    >
      {/* ── Outer frame (double gold) ── */}
      <rect
        x="12"
        y="12"
        width="176"
        height="256"
        rx="8"
        stroke="var(--accent-gold, #d4a853)"
        strokeWidth="1.5"
        strokeOpacity="0.4"
      />
      <rect
        x="20"
        y="20"
        width="160"
        height="240"
        rx="5"
        stroke="var(--accent-purple, #8b5cf6)"
        strokeWidth="1"
        strokeOpacity="0.3"
      />

      {/* ── Corner ornaments (small diamonds) ── */}
      {[[30, 30], [170, 30], [30, 250], [170, 250]].map(([cx, cy], i) => (
        <g key={i} transform={`translate(${cx},${cy})`}>
          <path
            d="M0,-6 L4,0 L0,6 L-4,0 Z"
            fill="var(--accent-gold, #d4a853)"
            fillOpacity="0.3"
          />
        </g>
      ))}

      {/* ── Crescent moon (top center) ── */}
      <g transform="translate(100, 70)">
        <circle
          cx="0"
          cy="0"
          r="18"
          fill="var(--accent-purple, #8b5cf6)"
          fillOpacity="0.15"
        />
        <circle
          cx="6"
          cy="-4"
          r="13"
          fill="var(--bg-primary, #0a0a0f)"
        />
      </g>

      {/* ── Central Star (The Star arcana) — 4-point ── */}
      <g transform="translate(100, 150)" data-motif="star">
        {/* Vertical ray */}
        <path
          d="M0,-38 L4,-8 L0,0 L-4,-8 Z"
          fill="var(--accent-gold, #d4a853)"
          fillOpacity="0.5"
        />
        {/* Horizontal ray */}
        <path
          d="M-38,0 L-8,4 L0,0 L-8,-4 Z"
          fill="var(--accent-gold, #d4a853)"
          fillOpacity="0.5"
        />
        {/* Right ray */}
        <path
          d="M38,0 L8,4 L0,0 L8,-4 Z"
          fill="var(--accent-gold, #d4a853)"
          fillOpacity="0.5"
        />
        {/* Bottom ray */}
        <path
          d="M0,38 L4,8 L0,0 L-4,8 Z"
          fill="var(--accent-gold, #d4a853)"
          fillOpacity="0.5"
        />
        {/* Diagonal rays (NE, NW, SE, SW) */}
        <path
          d="M27,-27 L6,-6 L0,0 L-1,-7 Z"
          fill="var(--accent-purple, #8b5cf6)"
          fillOpacity="0.3"
        />
        <path
          d="M-27,-27 L-6,-6 L0,0 L1,-7 Z"
          fill="var(--accent-purple, #8b5cf6)"
          fillOpacity="0.3"
        />
        <path
          d="M27,27 L6,6 L0,0 L-1,7 Z"
          fill="var(--accent-purple, #8b5cf6)"
          fillOpacity="0.3"
        />
        <path
          d="M-27,27 L-6,6 L0,0 L1,7 Z"
          fill="var(--accent-purple, #8b5cf6)"
          fillOpacity="0.3"
        />
        {/* Center glow dot */}
        <circle
          cx="0"
          cy="0"
          r="3.5"
          fill="var(--accent-gold, #d4a853)"
          fillOpacity="0.6"
        />
      </g>

      {/* ── Small accent stars (corners of inner frame) ── */}
      {[[50, 205], [150, 205], [50, 75], [150, 75]].map(([sx, sy], i) => (
        <g key={`small-star-${i}`} transform={`translate(${sx},${sy})`}>
          <path
            d="M0,-5 L1.5,-1.5 L5,0 L1.5,1.5 L0,5 L-1.5,1.5 L-5,0 L-1.5,-1.5 Z"
            fill="var(--accent-purple, #8b5cf6)"
            fillOpacity="0.25"
          />
        </g>
      ))}

      {/* ── Bottom decorative line ── */}
      <line
        x1="60"
        y1="235"
        x2="140"
        y2="235"
        stroke="var(--accent-gold, #d4a853)"
        strokeWidth="0.5"
        strokeOpacity="0.2"
        strokeDasharray="3 4"
      />
    </svg>
  );
}

/**
 * Bio Section — brief introduction to Patyka.
 *
 * # Server Component
 *
 * This is a pure Server Component (no 'use client'). The bio text
 * is static — it doesn't come from the database — because Patyka's
 * bio is a curated piece of content that changes very infrequently.
 * Editing a text file is simpler than editing a DB row for this use
 * case.
 *
 * # Design
 *
 * Two-column layout on desktop: text on the left, a decorative
 * gradient card on the right. On mobile, the decorative element
 * disappears and the text takes full width.
 *
 * # Links
 *
 * TikTok (@patyka550) and Instagram (@patykatarot) links open in
 * new tabs. These are social call-to-actions that funnel visitors
 * from the website to Patyka's social media presence.
 *
 * # Bio source
 *
 * The bio text is based on verified TikTok profile data:
 * "Patyka es tarotista y creadora de contenido espiritual.
 *  Con más de 10.000 seguidores en TikTok, comparte Brujitips
 *  y lecturas de tarot que han llegado a miles de personas en
 *  toda Latinoamérica."
 */
export default function BioSection() {
  return (
    <section id="conoceme" className="py-20 md:py-32 px-4">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary text-center mb-12">
          Conocé a Patyka
        </h2>

        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
          {/* ── Text column (left) ── */}
          <div className="flex-1 space-y-4">
            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Patyka es tarotista y creadora de contenido espiritual. Con más
              de <strong className="text-text-primary font-medium">10.000 seguidores en TikTok</strong>, comparte Brujitips y
              lecturas de tarot que han llegado a miles de personas en toda
              Latinoamérica.
            </p>

            <p className="text-text-secondary leading-relaxed text-sm md:text-base">
              Su enfoque combina la sabiduría del tarot tradicional con una
              energía cercana y moderna. Cada sesión es un espacio seguro
              para explorar tus preguntas más profundas y encontrar la
              claridad que buscás.
            </p>

            {/* ── Social CTAs ── */}
            <div className="flex gap-4 pt-4">
              <a
                href="https://www.tiktok.com/@patyka550"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass inline-flex items-center gap-2 px-4 py-2 text-sm text-accent-gold hover:text-text-primary transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Seguir en TikTok
              </a>
              <a
                href="https://www.instagram.com/patykatarot"
                target="_blank"
                rel="noopener noreferrer"
                className="liquid-glass inline-flex items-center gap-2 px-4 py-2 text-sm text-accent-purple hover:text-text-primary transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Instagram
              </a>
            </div>
          </div>

          {/* ── Decorative column (right) — only on md+ ── */}
          <div className="hidden md:block flex-1">
            <div className="liquid-glass p-[1px] rounded-xl">
              <div className="rounded-xl h-80 w-full flex items-center justify-center bg-bg-primary/30">
                <TarotIllustration />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
