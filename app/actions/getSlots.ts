'use server';

/**
 * Server Action: getAvailableSlots
 *
 * Returns available 60‑minute slots for a given service and date,
 * filtered in Bogotá GMT‑5 timezone.
 *
 * # Query‑time TTL vs Cron
 *
 * Slot reservations have a 15‑minute TTL (`sessions.expires_at`).
 * Instead of running a cron job to mark expired sessions, we use a
 * **query‑time filter**: `WHERE expires_at > NOW()`. This means:
 *
 *   - Sessions whose TTL has expired are simply not returned —
 *     their slots appear available again.
 *   - No background worker, no cron, no "expired" status transitions.
 *   - For a solopreneur with low booking volume, this is simpler and
 *     always correct — no race conditions from cron lag.
 *
 * # Slot Generation
 *
 * Slots are generated at 75‑minute intervals (60 min session +
 * 15 min buffer) from 09:00 to 16:30 Bogotá, resulting in 7 slots:
 *
 *   09:00, 10:15, 11:30, 12:45, 14:00, 15:15, 16:30
 *
 * @param serviceId - The service to check availability for
 * @param date       - Date string in YYYY‑MM‑DD format
 * @returns Array of {@link Slot} objects with HH:mm time and availability
 */

import { and, eq, gt, sql, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions, services } from '@/db/schema';
import { UTC_OFFSET, TIMEZONE } from '@/lib/constants';
import type { Slot } from '@/types';

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function getSlots(
  serviceId: number,
  date: string
): Promise<Slot[]> {
  // ── 1. Get service's allowed slots from DB ──
  const service = await db
    .select({ availableSlots: services.availableSlots })
    .from(services)
    .where(eq(services.id, serviceId))
    .limit(1);

  if (!service.length) return [];

  const allowedSlots = JSON.parse(
    service[0].availableSlots || '[]',
  ) as string[];

  // If no slots defined, fallback to empty
  if (!allowedSlots.length) return [];

  // ── 2. Build ISO timestamps for each allowed slot ──
  const allSlots = allowedSlots.map((time) => ({
    time,
    iso: `${date}T${time}:00${UTC_OFFSET}`,
  }));

  // ── 3. Query booked sessions that are still active ──
  const booked = await db
    .select({
      time: sql<string>`TO_CHAR(${sessions.scheduledAt} AT TIME ZONE ${sql.raw(`'${TIMEZONE}'`)}, 'HH24:MI')`,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.serviceId, serviceId),
        sql`DATE(${sessions.scheduledAt} AT TIME ZONE ${sql.raw(`'${TIMEZONE}'`)}) = ${date}`,
        inArray(sessions.status, ['pending', 'approved'] as const),
        gt(sessions.expiresAt, sql`NOW()`),
      )
    );

  // ── 4. Build a set of blocked HH:mm times ──
  const blockedTimes = new Set(booked.map((b) => b.time));

  // ── 5. Map slots to the return type ──
  return allSlots.map((s) => ({
    time: s.time,
    available: !blockedTimes.has(s.time),
  }));
}
