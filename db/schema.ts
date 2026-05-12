/**
 * Drizzle ORM schema for Patyka Tarot.
 *
 * Tables:
 *   - services     → Tarot reading services Patyka offers
 *   - sessions     → Customer bookings with status tracking
 *   - testimonials → Social proof from WhatsApp chats
 *
 * Enums:
 *   - session_status → Lifecycle of a booking session
 *
 * Design decisions reflected here:
 *   - ON DELETE RESTRICT on session → service FK prevents orphan sessions
 *   - Unique constraint on (service_id, scheduled_at) prevents double-booking at DB level
 *   - Index on expires_at enables efficient query-time TTL filtering
 *   - Index on wompi_reference enables fast idempotency checks on webhooks
 */

import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  timestamp,
  pgEnum,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------

/**
 * Session status lifecycle:
 *   pending   → created, waiting for Wompi payment
 *   approved  → payment confirmed via webhook
 *   cancelled → cancelled by customer or admin
 *   expired   → slot reservation TTL expired (15 min default)
 */
export const sessionStatus = pgEnum("session_status", [
  "pending",
  "approved",
  "cancelled",
  "expired",
]);

// ---------------------------------------------------------------------------
// Tables
// ---------------------------------------------------------------------------

/**
 * Services that Patyka offers.
 * Seed data is in db/seed.ts — Patyka can edit these directly in PostgreSQL
 * via Coolify's DB UI without touching code (Seed-and-Swap strategy).
 */
export const services = pgTable("services", {
  id: serial().primaryKey(),

  /** Display name: "Lectura General de Tarot" */
  name: text().notNull(),

  /** Marketing description for the service card */
  description: text().notNull(),

  /** Price in Colombian Pesos (COP) — whole pesos, not cents */
  priceCop: integer("price_cop").notNull(),

  /** Duration in minutes: 30, 45, 60 */
  durationMin: integer("duration_min").notNull().default(60),

  /** Soft-delete: false hides the service from the catalog without deleting sessions */
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/**
 * Customer booking sessions.
 * Created by Server Action (createBooking), status updated by webhook handler.
 *
 * Design guarantees:
 *   - Double-booking prevented by UNIQUE(service_id, scheduled_at)
 *   - Slot TTL enforced in queries via expires_at > NOW()
 *   - Webhook idempotency via wompi_reference UNIQUE
 */
export const sessions = pgTable(
  "sessions",
  {
    id: serial().primaryKey(),

    /** FK to services — ON DELETE RESTRICT prevents deleting a service that has bookings */
    serviceId: integer("service_id")
      .references(() => services.id, { onDelete: "restrict" })
      .notNull(),

    /** Email entered during booking — used for Resend confirmation */
    customerEmail: text("customer_email").notNull(),

    /** When the session starts (Bogotá GMT-5, business hours 09:00-18:00) */
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }).notNull(),

    /** Lifecycle state — starts as 'pending', advances via webhook */
    status: sessionStatus().notNull().default("pending"),

    /** Wompi payment reference — UNIQUE for idempotent webhook processing */
    wompiReference: text("wompi_reference").unique(),

    /** Google Calendar event ID — populated after payment approval */
    calendarEventId: text("calendar_event_id"),

    /** Google Meet link — populated after event creation */
    meetLink: text("meet_link"),

    /** When the pending slot reservation expires (created_at + 15 min TTL) */
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    // Guarantee at DB level: no two sessions for the same service at the same time
    uniqueIndex("slot_unique").on(table.serviceId, table.scheduledAt),

    // Speeds up query-time TTL filtering: WHERE expires_at > NOW()
    index("expires_idx").on(table.expiresAt),

    // Fast lookup by Wompi reference during webhook idempotency checks
    index("wompi_ref_idx").on(table.wompiReference),
  ]
);

/**
 * Customer testimonials from WhatsApp chats.
 * Table is seeded empty — Patyka adds them later via DB UI.
 * Until populated, the SocialProof section shows a fallback message.
 */
export const testimonials = pgTable("testimonials", {
  id: serial().primaryKey(),

  /** Name or alias of the customer who left the testimonial */
  authorName: text("author_name").notNull(),

  /** The testimonial text (copied from WhatsApp) */
  content: text().notNull(),

  /** Soft toggle — hide without deleting */
  isActive: boolean("is_active").notNull().default(true),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
