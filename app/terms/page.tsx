import Link from "next/link";
import { CANCELLATION_POLICY_HTML } from "@/lib/terms";

/**
 * Términos y Condiciones — Static page
 *
 * Renders the cancellation policy with the Liquid Glass aesthetic.
 * This page is reachable from:
 *   - Footer link ("Política de cancelación")
 *   - Booking form's terms checkbox ("Acepto los términos y condiciones")
 *
 * ## Design
 *
 *   - Centered single-column layout with a glass-morphism container
 *   - Instrument Serif for the heading, DM Sans for body
 *   - Gold accent for the heading underline
 *   - Subtle animated gradient background to match the landing page
 *   - Back-to-home link with gold accent hover
 *
 * ## Legal note
 *
 *   The policy text lives in `lib/terms.ts` so it can be edited in one
 *   place and shared between this page and the booking form's summary.
 */
export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg-primary text-text-primary font-body">
      {/* ── Animated gradient background (subtle, behind the card) ── */}
      <div
        className="fixed inset-0 -z-10 opacity-20"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,168,83,0.08) 0%, transparent 60%), radial-gradient(ellipse at 50% 100%, rgba(139,92,246,0.06) 0%, transparent 60%)",
        }}
      />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {/* ── Glass card ── */}
        <div className="liquid-glass p-8 sm:p-12">
          {/* Heading */}
          <h1 className="font-heading text-3xl sm:text-4xl text-text-primary mb-2 font-normal">
            Términos y Condiciones
          </h1>
          <div className="w-16 h-0.5 bg-accent-gold/40 mb-8" />

          {/* ── Policy content (pre-formatted HTML from lib/terms.ts) ── */}
          <div
            className="prose prose-invert max-w-none
              prose-headings:font-heading prose-headings:text-text-primary
              prose-p:text-text-secondary prose-p:leading-relaxed prose-p:mb-4
              prose-strong:text-accent-gold prose-strong:font-medium
              [&_p:last-child]:mb-0"
            dangerouslySetInnerHTML={{ __html: CANCELLATION_POLICY_HTML }}
          />

          {/* ── Additional legal info ── */}
          <div className="mt-8 pt-6 border-t border-border-glass">
            <h2 className="font-heading text-xl text-text-primary mb-3 font-normal">
              Información adicional
            </h2>
            <ul className="space-y-2 text-sm text-text-secondary leading-relaxed">
              <li>
                <strong className="text-accent-gold font-medium">Reagendamiento:</strong>{" "}
                Las sesiones pueden reagendarse sin costo siempre que se
                notifique con al menos 24 horas de anticipación.
              </li>
              <li>
                <strong className="text-accent-gold font-medium">Contacto:</strong>{" "}
                Para cualquier consulta, escribinos al WhatsApp{" "}
                <a
                  href="https://wa.me/573018339558"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-purple hover:text-accent-gold transition-colors underline underline-offset-2"
                >
                  +57 301 833 9558
                </a>
              </li>
              <li>
                <strong className="text-accent-gold font-medium">Privacidad:</strong>{" "}
                Tu email y datos personales solo se usan para la coordinación
                de tu sesión. No compartimos información con terceros.
              </li>
            </ul>
          </div>

          {/* ── Back to home ── */}
          <div className="mt-8 pt-6 border-t border-border-glass">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-accent-gold transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
