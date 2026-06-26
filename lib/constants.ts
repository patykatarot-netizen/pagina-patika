/**
 * Business constants for Patyka Tarot.
 *
 * All times are Bogotá GMT-5 (Colombia). Colombia does NOT observe
 * daylight saving time, so GMT-5 is constant year-round.
 */

// ---------------------------------------------------------------------------
// Time
// ---------------------------------------------------------------------------

/** Timezone for all scheduling operations */
export const TIMEZONE = "America/Bogota" as const;

/** UTC offset for Bogotá — used when constructing ISO strings manually */
export const UTC_OFFSET = "-05:00" as const;

// ---------------------------------------------------------------------------
// Business Hours
// ---------------------------------------------------------------------------

/**
 * First available session slot each day (9:00 AM Bogotá).
 * Hour is in 24h format.
 */
export const BUSINESS_START_HOUR = 9;

/**
 * Last session START time (17:00 = 5:00 PM).
 * A 60-min session at 17:00 ends at 18:00, matching the closing time.
 */
export const BUSINESS_END_HOUR = 17;

/** Days Patyka works: Monday (1) through Saturday (6) */
export const WORKING_DAYS = [1, 2, 3, 4, 5, 6] as const; // Lun–Sáb

// ---------------------------------------------------------------------------
// Session Durations
// ---------------------------------------------------------------------------

/** Standard session duration in minutes */
export const SLOT_DURATION_MINUTES = 60;

/**
 * Buffer between sessions (15 minutes).
 * This gives Patyka time to wrap up notes, take a break, or handle
 * sessions that run slightly over before the next one starts.
 */
export const BUFFER_MINUTES = 15;

// ---------------------------------------------------------------------------
// Slot Reservation TTL
// ---------------------------------------------------------------------------

/**
 * How long a pending slot stays reserved while the user is on Wompi's
 * checkout page (15 minutes = 900000 ms).
 *
 * If the user closes their browser, the slot is released after this
 * TTL via query-time filtering: `WHERE expires_at > NOW()`.
 *
 * Why query-time instead of a cron job?
 *   - Low volume (solopreneur): a cron would add unnecessary infrastructure
 *   - Query-time is simpler and always correct (no race conditions from
 *     cron lag)
 */
export const SLOT_TTL_MS = 15 * 60 * 1000; // 900000 ms
export const SLOT_TTL_MINUTES = 15;

// ---------------------------------------------------------------------------
// Business Invariants — Slot & Day Constraints (Ley de Hick)
// ---------------------------------------------------------------------------

/**
 * Hardcoded slot/day constraints per service category.
 *
 * These are BUSINESS INVARIANTS — they override whatever the database says.
 * If the DB has incorrect values, the frontend still enforces the correct
 * business rules. This is intentional: the invariants must survive DB
 * misconfiguration.
 *
 * Bitmask semantics: 1=Lun, 2=Mar, 4=Mié, 8=Jue, 16=Vie, 32=Sáb, 64=Dom
 */
export const CATEGORY_SLOT_CONSTRAINTS: Record<
  string,
  { days: number; slots: string[] }
> = {
  completa: {
    // Mon + Tue + Thu = 1 + 2 + 8 = 11
    days: 11,
    slots: ['08:00', '09:30', '11:00', '14:00', '15:30', '17:00'],
  },
  tematica: {
    // Wed + Fri = 4 + 16 = 20
    days: 20,
    slots: [
      '08:00', '09:00', '10:00', '11:00', '12:00',
      '14:00', '15:00', '16:00', '17:00',
    ],
  },
};
