/**
 * Shared TypeScript types for Patyka Tarot.
 *
 * Convention:
 *   - DB fields use snake_case (matching PostgreSQL column names)
 *   - JS/TS code uses camelCase
 *   - Types follow the Drizzle schema exactly
 */

// ---------------------------------------------------------------------------
// Domain Types (match Drizzle schema)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Booking & Category Types
// ---------------------------------------------------------------------------

/** Booking channel: direct web booking vs WhatsApp-only */
export type BookingType = "web" | "whatsapp_only";

/** Visual grouping category (Miller's Law: 7±2 groups max) */
export type ServiceCategory = "pregunta" | "tematica" | "completa" | "energetico";

/** A tarot reading service Patyka offers */
export interface Service {
  id: number;
  name: string;
  description: string;
  /** Price in Colombian Pesos (whole pesos, not centavos) */
  priceCop: number;
  /** Session duration in minutes */
  durationMin: number;
  isActive: boolean;
  /**
   * Days of the week this service is offered (bitmask).
   *
   * Bit mapping:
   *   Mon=1  Tue=2  Wed=4  Thu=8  Fri=16  Sat=32  Sun=64
   *
   * Examples: Mon+Tue+Thu=11, Wed+Fri=20, All days=127
   */
  availableDays: number;
  /**
   * Available time slots for this service.
   * Stored as a JSON array of "HH:mm" strings.
   *
   * Example: ["08:00", "10:30", "14:00"]
   */
  availableSlots: string;
  /** Booking channel type */
  bookingType: BookingType;
  /** Visual grouping category */
  category: ServiceCategory;
  /** Drizzle returns Date objects for timestamp columns — not strings */
  createdAt: Date;
  updatedAt: Date;
}

/** A customer booking session */
export interface Session {
  id: number;
  serviceId: number;
  customerEmail: string;
  /** Nombre completo del cliente */
  customerName: string;
  /** WhatsApp del cliente (opcional) */
  customerWhatsapp: string | null;
  /** ISO 8601 — when the session starts (Bogotá GMT-5) */
  scheduledAt: string;
  status: SessionStatus;
  wompiReference: string | null;
  calendarEventId: string | null;
  meetLink: string | null;
  /** When the pending slot reservation expires */
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
}

/** Session lifecycle states */
export type SessionStatus = "pending" | "approved" | "cancelled" | "expired";

// ---------------------------------------------------------------------------
// UI / Booking Types
// ---------------------------------------------------------------------------

/** A calendar slot the user can pick from */
export interface Slot {
  /** ISO 8601 start time */
  time: string;
  /** Whether this slot is available (not taken or expired) */
  available: boolean;
}

/** Slot status for display purposes */
export type SlotStatus = "available" | "taken" | "expired" | "selected";

// ---------------------------------------------------------------------------
// Wompi Types
// ---------------------------------------------------------------------------

/**
 * Wompi webhook payload as received in POST /api/wompi/webhook.
 *
 * Signature verification:
 *   Wompi sends an HMAC-SHA256 signature (in X-Event-Checksum header
 *   or inside the payload's top-level `hmac` field) computed over
 *   the serialized `data` object using WOMPI_EVENTS_KEY.
 *
 *   We verify this to ensure the webhook genuinely came from Wompi
 *   and wasn't tampered with (HMAC prevents MITM attacks because
 *   only the server and Wompi share the secret key).
 */
export interface WebhookPayload {
  data: WebhookTransaction;
  /** HMAC-SHA256 signature for integrity verification */
  hmac?: string;
}

/** The inner transaction data from Wompi */
export interface WebhookTransaction {
  /** Wompi transaction ID */
  id: string;
  /** Payment status */
  status: "APPROVED" | "DECLINED" | "VOIDED" | "PENDING" | "ERROR";
  /** Merchant reference we sent during checkout init */
  reference: string;
  /** Amount in COP centavos */
  amount_in_cents: number;
  /** Customer email */
  customer_email: string;
  /** Currency (always COP for Colombia) */
  currency?: string;
}

// ---------------------------------------------------------------------------
// Testimonial Type (from DB)
// ---------------------------------------------------------------------------

/** A customer testimonial from WhatsApp chats (stored in DB) */
export interface Testimonial {
  id: number;
  authorName: string;
  content: string;
  isActive: boolean;
  /** Drizzle returns Date objects for timestamp columns — not strings */
  createdAt: Date;
}
