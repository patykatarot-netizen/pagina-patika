/**
 * Patyka Tarot — Landing Page (SSR)
 *
 * Server-rendered landing page that composes the full layout:
 *   1. Nav (fixed header with scroll-aware blur)
 *   2. Hero (full-viewport video background with rAF fade)
 *   3. ServiceCatalog (SSR grid of active services from DB)
 *   4. BookingForm (multi-step booking: service → slot → email → pay)
 *   5. BrujitipsGrid (lazy-loaded TikTok embeds)
 *   6. SocialProof (animated counters + testimonials from DB)
 *   7. BioSection (static bio with social CTAs)
 *   8. Footer (social links + copyright + cancellation policy)
 *
 * # SSR data fetching
 *
 * Services and testimonials are queried from PostgreSQL via Drizzle
 * at request time. This is standard Next.js App Router SSR — the
 * `db.select()` calls execute on the server, the results are
 * serialized into the HTML response. No client-side fetch, no API
 * route, no loading spinners for static content.
 *
 * If the database is unavailable (development without PostgreSQL),
 * the try-catch gracefully degrades to empty arrays and the
 * individual components handle their empty states.
 */
import { eq } from 'drizzle-orm';
import Nav from '@/components/layout/Nav';
import MobileCTA from '@/components/layout/MobileCTA';
import Hero from '@/components/landing/Hero';
import Footer from '@/components/layout/Footer';
import ServiceCatalog from '@/components/landing/ServiceCatalog';
import BrujitipsGrid from '@/components/landing/BrujitipsGrid';
import SocialProof from '@/components/landing/SocialProof';
import BioSection from '@/components/landing/BioSection';
import BookingForm from '@/components/booking/BookingForm';
import { db } from '@/lib/db';
import { services, testimonials, socialStats } from '@/db/schema';
import type { Service, Testimonial } from '@/types';

/** Fallback stats when DB is unavailable or table is empty. */
const FALLBACK_STATS = [
  { label: 'en TikTok', value: 10_000 },
  { label: 'Me gusta', value: 63_900 },
];

export default async function Home() {
  let servicesList: Service[] = [];
  let testimonialsList: Testimonial[] = [];
  let statsList = FALLBACK_STATS;

  // ── SSR: query active services and testimonials from PostgreSQL ──
  try {
    servicesList = (await db
      .select()
      .from(services)
      .where(eq(services.isActive, true))) as Service[];

    testimonialsList = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true));

    // Query social stats from DB — use fallback if table is empty
    const dbStats = await db.select().from(socialStats);
    if (dbStats.length > 0) {
      statsList = dbStats.map((s) => ({ label: s.label, value: s.value }));
    }
  } catch (error) {
    // Graceful degradation: if the DB is unavailable (e.g., local
    // development without PostgreSQL), render with empty data.
    // Individual components handle their empty states:
    //   - ServiceCatalog → returns null when services is empty
    //   - SocialProof → shows fallback when testimonials is empty
    console.error('Landing page: failed to load data from database.', error);
  }

  return (
    <>
      <Nav />
      <main id="main-content">
        <Hero />
        <ServiceCatalog services={servicesList} />

        {/* ── Booking Section ── */}
        <section
          id="booking"
          className="relative py-20 md:py-28 px-4 max-w-7xl mx-auto"
        >
          <div className="text-center mb-10">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-text-primary mb-3">
              Agendá tu Lectura
            </h2>
            <p className="text-text-secondary text-base md:text-lg max-w-xl mx-auto">
              Elegí el servicio, el día y horario que mejor se adapten a vos.
            </p>
          </div>
          <BookingForm services={servicesList} />
        </section>

        <BrujitipsGrid />
        <SocialProof stats={statsList} testimonials={testimonialsList} />
        <BioSection />
      </main>
      <Footer />
      <MobileCTA />
    </>
  );
}
