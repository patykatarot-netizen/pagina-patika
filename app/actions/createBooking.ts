'use server';

/**
 * Server Action: createBooking
 *
 * Creates a booking session in the database and returns a Wompi
 * Checkout URL for the user to complete payment.
 *
 * # Transactional Logic
 *
 * The booking flow follows these steps:
 *
 *   1. **Validate** input with Zod (email format, required fields).
 *   2. **Check service** exists and is active in the DB.
 *   3. **Check slot availability** — query the sessions table
 *      for any pending/approved session at the same time. This is
 *      the application‑level double‑booking guard.
 *   4. **INSERT** the session with status `pending` and a 15‑min
 *      TTL (`expires_at`). The unique index on `(service_id,
 *      scheduled_at)` is the database‑level guard against race
 *      conditions.
 *   5. **Construct** the Wompi Checkout URL via `initCheckout()`.
 *
 * # Double‑Click Guard
 *
 * A brief in‑memory deduplication map prevents the same booking
 * from being submitted twice within 2 seconds (e.g., a user
 * double‑clicking the submit button). This is a soft guard — the
 * database unique constraint is the hard guard.
 *
 * # Security
 *
 * Server Actions include automatic CSRF protection (Next.js adds
 * a hidden `__next_request_verification_token` to forms). This
 * Server Action is only callable from our own domain.
 *
 * @param input - Raw form data: `{ serviceId, scheduledAt, customerEmail }`
 * @returns `{ redirectUrl }` on success, `{ error }` on failure
 */

import { z } from 'zod';
import { and, eq, or, gt, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions, services } from '@/db/schema';
import { initCheckout } from '@/lib/wompi';
import { SLOT_TTL_MS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Zod Schema
// ---------------------------------------------------------------------------

/**
 * Booking input validation.
 *
 * Why Zod here instead of a separate file?
 *   - The schema is tightly coupled to this Server Action — no other
 *     code validates this exact shape.
 *   - Co‑locating validation with the action that uses it keeps the
 *     reasoning close (you read one file to understand the full flow).
 */
const BookingInputSchema = z.object({
  /** Service ID from the services table */
  serviceId: z.coerce.number().int().positive('El servicio es requerido'),

  /** ISO 8601 with timezone offset (Bogotá GMT‑5) */
  scheduledAt: z.string().min(1, 'El horario es requerido'),

  /** Customer email for payment receipts and confirmation */
  customerEmail: z
    .string()
    .min(1, 'El email es requerido')
    .email('Ingresá un email válido (ej: nombre@email.com)'),
});

// ---------------------------------------------------------------------------
// Double‑Click Guard
// ---------------------------------------------------------------------------

/**
 * In‑memory deduplication: keys are a composite of serviceId +
 * scheduledAt + customerEmail, values are the timestamp of the
 * last submission.
 *
 * If the same key is submitted within 2000ms, we return early
 * to prevent accidental double bookings from rapid clicks.
 */
const pendingRequests = new Map<string, number>();
const DOUBLE_CLICK_WINDOW_MS = 2000;

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function createBooking(
  /** Raw input from the form — validated by Zod internally */
  input: unknown
): Promise<{ redirectUrl?: string; error?: string }> {
  // ── 1. Validate input ──
  const parsed = BookingInputSchema.safeParse(input);
  if (!parsed.success) {
    const firstError = parsed.error.errors[0]?.message ?? 'Datos inválidos';
    return { error: firstError };
  }
  const { serviceId, scheduledAt, customerEmail } = parsed.data;

  // ── 2. Double‑click guard ──
  const dedupeKey = `${serviceId}|${scheduledAt}|${customerEmail}`;
  const lastRequest = pendingRequests.get(dedupeKey);
  const now = Date.now();
  if (lastRequest !== undefined && now - lastRequest < DOUBLE_CLICK_WINDOW_MS) {
    // Silently ignore — the first request is already being processed
    return {
      error:
        'Ya estamos procesando tu reserva. Esperá un momento antes de intentar de nuevo.',
    };
  }
  pendingRequests.set(dedupeKey, now);

  // Cleanup old entries from the dedupe map (opportunistic)
  if (pendingRequests.size > 100) {
    for (const [key, ts] of pendingRequests) {
      if (now - ts > DOUBLE_CLICK_WINDOW_MS) pendingRequests.delete(key);
    }
  }

  try {
    // ── 3. Verify service exists and is active ──
    const [service] = await db
      .select({ id: services.id, priceCop: services.priceCop })
      .from(services)
      .where(and(eq(services.id, serviceId), eq(services.isActive, true)))
      .limit(1);

    if (!service) {
      return { error: 'El servicio seleccionado no está disponible.' };
    }

    // ── 4. Check slot availability (app‑level double‑booking guard) ──
    const scheduledDate = new Date(scheduledAt);
    const [existing] = await db
      .select({ id: sessions.id })
      .from(sessions)
      .where(
        and(
          eq(sessions.serviceId, serviceId),
          eq(sessions.scheduledAt, scheduledDate),
          or(eq(sessions.status, 'pending'), eq(sessions.status, 'approved')),
          gt(sessions.expiresAt, sql`NOW()`),
        )
      )
      .limit(1);

    if (existing) {
      return {
        error:
          'Este horario ya fue reservado por otra persona. Elegí otro horario.',
      };
    }

    // ── 5. Generate Wompi reference ──
    const wompiReference = crypto.randomUUID();

    // ── 6. Calculate expiresAt (now + 15 min TTL) ──
    const expiresAt = new Date(Date.now() + SLOT_TTL_MS);

    // ── 7. INSERT session ──
    //
    // The database unique constraint on (service_id, scheduled_at)
    // is the final guard. If a concurrent request slipped past the
    // app‑level check, PostgreSQL rejects the insert and we catch
    // the error below.
    await db.insert(sessions).values({
      serviceId,
      customerEmail,
      scheduledAt: scheduledDate,
      status: 'pending',
      wompiReference,
      expiresAt,
    });

    // ── 8. Construct Wompi Checkout URL ──
    //
    // Wompi expects amounts in centavos. Our `priceCop` field stores
    // whole pesos (e.g. 80,000 for $80,000 COP), so we multiply by 100.
    const amountInCents = service.priceCop * 100;
    const redirectUrl = initCheckout(
      amountInCents,
      wompiReference,
      customerEmail
    );

    return { redirectUrl };
  } catch (error: unknown) {
    // ── 9. Handle unique constraint violation (race condition) ──
    //
    // If TWO concurrent requests pass the app‑level availability check,
    // the second INSERT will hit the unique index on (service_id,
    // scheduled_at) and throw. We catch it here and return a friendly
    // error instead of a 500.
    if (
      error instanceof Error &&
      'code' in error &&
      (error as Error & { code: string }).code === '23505'
    ) {
      return {
        error:
          'Este horario ya fue reservado mientras elegías. Intentá con otro horario.',
      };
    }

    // Log unexpected errors for debugging, but don't leak internals
    console.error('[createBooking] Unexpected error:', error);
    return {
      error: 'Ocurrió un error al procesar tu reserva. Intentá de nuevo.',
    };
  } finally {
    // Clean up dedupe entry after a short delay so rapid re‑clicks
    // within the window are caught, but future legitimate submissions
    // for the same slot are not blocked.
    setTimeout(() => {
      pendingRequests.delete(dedupeKey);
    }, DOUBLE_CLICK_WINDOW_MS);
  }
}
