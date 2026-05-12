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

import { and, eq, or, gt, sql, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { sessions } from '@/db/schema';
import {
  BUSINESS_START_HOUR,
  BUSINESS_END_HOUR,
  SLOT_DURATION_MINUTES,
  BUFFER_MINUTES,
  TIMEZONE,
  UTC_OFFSET,
} from '@/lib/constants';
import type { Slot } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Generates all possible 60‑minute slot start times for a given date
 * within Patyka's business hours (09:00–17:00 Bogotá), with a 15‑min
 * buffer between consecutive slots.
 *
 * @returns Array of `{ time: "HH:mm", iso: "YYYY-MM-DDTHH:mm:ss±HH:MM" }`
 */
function generateSlotTimes(date: string): { time: string; iso: string }[] {
  const slots: { time: string; iso: string }[] = [];
  const startMinutes = BUSINESS_START_HOUR * 60; // 540 = 09:00
  const endMinutes = BUSINESS_END_HOUR * 60; // 1020 = 17:00
  const interval = SLOT_DURATION_MINUTES + BUFFER_MINUTES; // 75 min

  for (let m = startMinutes; m <= endMinutes; m += interval) {
    const hours = Math.floor(m / 60);
    const mins = m % 60;
    const time = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const iso = `${date}T${time}:00${UTC_OFFSET}`; // e.g. "2026-05-08T09:00:00-05:00"
    slots.push({ time, iso });
  }

  return slots;
}

// ---------------------------------------------------------------------------
// Server Action
// ---------------------------------------------------------------------------

export async function getSlots(
  serviceId: number,
  date: string
): Promise<Slot[]> {
  // ── 1. Generate all possible slot times for this date ──
  const allSlots = generateSlotTimes(date);

  // ── 2. Query booked sessions that are still active ──
  //
  // Active sessions are those with status 'pending' or 'approved'
  // whose `expires_at` has not yet passed. We filter by date using
  // PostgreSQL's AT TIME ZONE to correctly handle Bogotá GMT‑5.
  const booked = await db
    .select({
      time: sql<string>`TO_CHAR(${sessions.scheduledAt} AT TIME ZONE ${sql.raw(`'${TIMEZONE}'`)}, 'HH24:MI')`,
    })
    .from(sessions)
    .where(
      and(
        eq(sessions.serviceId, serviceId),
        // Filter to this specific date in Bogotá timezone
        sql`DATE(${sessions.scheduledAt} AT TIME ZONE ${sql.raw(`'${TIMEZONE}'`)}) = ${date}`,
        // Only pending or approved sessions block a slot
        inArray(sessions.status, ['pending', 'approved'] as const),
        // Query‑time TTL: expired sessions don't block slots
        gt(sessions.expiresAt, sql`NOW()`),
      )
    );

  // ── 3. Build a set of blocked HH:mm times ──
  const blockedTimes = new Set(booked.map((b) => b.time));

  // ── 4. Map slots to the return type ──
  return allSlots.map((s) => ({
    time: s.time,
    available: !blockedTimes.has(s.time),
  }));
}
