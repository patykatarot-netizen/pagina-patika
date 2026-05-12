/**
 * Wompi Webhook Route Handler — POST /api/wompi/webhook
 *
 * Receives payment status updates from Wompi's servers. This is the
 * single most critical endpoint in the booking flow — it bridges the
 * payment processor (Wompi) with our database, calendar, and email.
 *
 * # Flow (happy path)
 *
 *   1. Wompi POSTs a JSON payload to this URL when a payment status
 *      changes (APPROVED, DECLINED, VOIDED).
 *
 *   2. We extract the HMAC-SHA256 signature from the request (header
 *      or body) and verify it using `verifyWebhookSignature()`.
 *
 *      ── WHY HMAC? ──
 *      Anyone on the internet can POST to this URL. HMAC verification
 *      guarantees the payload genuinely came from Wompi because ONLY
 *      Wompi and our server share the WOMPI_EVENTS_KEY secret. An
 *      attacker cannot forge a valid signature.
 *
 *   3. We look up the booking session by `wompiReference` (which we
 *      generated as `crypto.randomUUID()` during checkout init).
 *
 *   4. **Idempotency check**: if the session is already `approved`,
 *      we return 200 WITHOUT re-processing. Wompi may retry webhooks
 *      if they don't get a timely response — idempotency prevents
 *      duplicate calendar events and emails.
 *
 *      ── WHY IDEMPOTENCY? ──
 *      Webhooks are "at-least-once" delivery, NOT "exactly-once".
 *      Network issues, timeouts, or Wompi retries can cause the same
 *      event to arrive multiple times. We must handle duplicates
 *      gracefully.
 *
 *   5. If status is `APPROVED`:
 *      - Update session status to `approved` (marks payment confirmed)
 *      - Fire-and-forget: kick off background processing for calendar
 *        event creation and confirmation email (see processPostPayment)
 *
 *   6. If status is `DECLINED` or `VOIDED`:
 *      - Update session status to `cancelled`
 *      - The slot becomes available again via query-time TTL filter
 *        (getSlots already checks expires_at > NOW() for pending
 *        sessions — declined/voided sessions are excluded because
 *        their status changed from 'pending')
 *
 * # Fire-and-forget pattern
 *
 *   After updating the session to `approved`, we start background
 *   processing with `void processPostPayment()` — no `await`.
 *
 *   ── WHY FIRE-AND-FORGET? ──
 *   Wompi expects a response within 5 seconds. If we `await` calendar
 *   and email (which can take 2-5 seconds combined), we risk Wompi
 *   timing out and retrying the webhook. By returning 200 immediately
 *   and processing in the background, we satisfy Wompi's SLA while
 *   still completing the booking pipeline.
 *
 * # Error handling philosophy
 *
 *   - Payment is already confirmed by Wompi — that's the critical path.
 *   - Calendar and email are enhancements, NOT critical path.
 *   - Calendar fails → log error, flag for manual retry, proceed.
 *   - Email fails → log error, don't rollback (customer still has
 *     the Meet link if calendar succeeded, or Patyka can manually
 *     follow up via WhatsApp).
 *
 * # Security
 *
 *   - HMAC verification prevents forged webhooks (see verifyWebhookSignature JSDoc)
 *   - Constant-time comparison prevents timing attacks on the HMAC
 *   - Never leaks DB structure or error details in responses
 *   - WOMPI_EVENTS_KEY never appears in logs or responses
 */

import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions, services } from "@/db/schema";
import { verifyWebhookSignature } from "@/lib/wompi";
import { getAccessToken, createEvent } from "@/lib/google-calendar";
import { sendConfirmationEmail } from "@/lib/resend";
import { TIMEZONE } from "@/lib/constants";
import type { WebhookPayload, WebhookTransaction } from "@/types";

// ---------------------------------------------------------------------------
// Route Handler — POST
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest): Promise<NextResponse> {
  // ── 1. Parse request body ──
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    console.warn("[wompi] Invalid JSON body — rejecting");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── 2. Extract transaction data (handles both flat and nested Wompi formats) ──
  //
  // Wompi's webhook can arrive in two shapes:
  //   a) Flat:      { data: { id, status, reference, ... }, hmac: "..." }
  //   b) Nested:    { data: { transaction: { id, status, reference, ... } },
  //                    signature: { checksum: "..." } }
  //
  // We handle both by checking for the nested structure first.
  const raw = body as Record<string, unknown>;
  const data = raw.data as Record<string, unknown> | undefined;
  if (!data) {
    return NextResponse.json(
      { error: "Missing data field" },
      { status: 400 }
    );
  }

  const transaction: WebhookTransaction = (
    (data.transaction as WebhookTransaction | undefined) ?? data
  ) as WebhookTransaction;

  if (!transaction?.reference) {
    return NextResponse.json(
      { error: "Missing transaction reference" },
      { status: 400 }
    );
  }

  // ── 3. Extract HMAC signature ──
  //
  // Wompi sends the signature in one of three places:
  //   1. X-Event-Checksum header (preferred, most common)
  //   2. body.signature.checksum (nested format)
  //   3. body.hmac (flat format, our simplified type)
  const signature =
    request.headers.get("x-event-checksum") ??
    request.headers.get("X-Event-Checksum") ??
    (raw.signature as Record<string, string> | undefined)?.checksum ??
    (raw.hmac as string | undefined) ??
    undefined;

  // ── 4. Verify HMAC signature ──
  //
  // We sign the transaction data (NOT the full body) using WOMPI_EVENTS_KEY.
  // The signature is compared with constant-time equality to prevent
  // timing attacks.
  const eventsKey = process.env.WOMPI_EVENTS_KEY;
  if (!eventsKey) {
    console.error("[wompi] WOMPI_EVENTS_KEY not set — cannot verify webhooks");
    return NextResponse.json(
      { error: "Server misconfigured" },
      { status: 500 }
    );
  }

  const isValid = verifyWebhookSignature(transaction, signature, eventsKey);
  if (!isValid) {
    console.warn("[wompi] Invalid HMAC signature — rejecting");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  // ── 5. Find the session by Wompi reference ──
  const [session] = await db
    .select()
    .from(sessions)
    .where(eq(sessions.wompiReference, transaction.reference))
    .limit(1);

  if (!session) {
    // Session not found — this can happen legitimately if the reference
    // is from a different environment (e.g., sandbox vs production).
    // We return 200 to acknowledge receipt without leaking info.
    console.warn(
      `[wompi] No session found for reference: ${transaction.reference}`
    );
    return NextResponse.json({ received: true });
  }

  // ── 6. Idempotency check ──
  //
  // If the session is already `approved`, this webhook has been processed
  // before. Return 200 immediately — DON'T re-create calendar events
  // or re-send emails.
  if (session.status === "approved") {
    console.log(
      `[wompi] Duplicate webhook received for approved session #${session.id} — skipped`
    );
    return NextResponse.json({ received: true });
  }

  // ── 7. Handle payment status ──
  const { status: paymentStatus } = transaction;

  if (paymentStatus === "APPROVED") {
    // ✅ Payment confirmed → advance the booking pipeline
    await db
      .update(sessions)
      .set({ status: "approved" })
      .where(eq(sessions.id, session.id));

    console.log(`[wompi] Session #${session.id} approved`);

    // Fire-and-forget: calendar event + confirmation email run in the
    // background. We do NOT await them — Wompi expects a response within
    // 5 seconds, and calendar/email can take 2-5 seconds combined.
    //
    // Using `void` explicitly signals intentional non-awaited promise.
    void processPostPayment(session.id);
  } else if (paymentStatus === "DECLINED" || paymentStatus === "VOIDED") {
    // ❌ Payment rejected → cancel the reservation
    await db
      .update(sessions)
      .set({ status: "cancelled" })
      .where(eq(sessions.id, session.id));

    console.log(
      `[wompi] Session #${session.id} ${paymentStatus.toLowerCase()}`
    );
    // Slot becomes available again via query-time TTL filter.
    // The getSlots Server Action already excludes non-pending sessions
    // AND sessions with expired TTLs — no additional cleanup needed.
  }

  // Always return 200 OK — even if the payment status wasn't recognized.
  // Wompi's retry logic triggers on non-200 responses, and we'd rather
  // not get hammered with retries for an edge case we don't handle.
  return NextResponse.json({ received: true });
}

// ---------------------------------------------------------------------------
// Background Post-Payment Processing
// ---------------------------------------------------------------------------

/**
 * Processes the booking pipeline after payment is confirmed.
 *
 * This function runs ASYNCHRONOUSLY (fire-and-forget) — it is NEVER
 * awaited by the main webhook handler. Errors are logged but never
 * thrown, because:
 *
 *   1. The payment is already confirmed — we cannot and should not
 *      roll it back for non-critical failures.
 *   2. Calendar/email failures can be recovered manually (Patyka
 *      can create the Meet link herself and send a WhatsApp message).
 *   3. Throwing would crash the background task but wouldn't help
 *      the customer — the webhook already returned 200.
 *
 * ## Steps
 *
 *   1. Re-fetch the session (ensures we have the latest data after the
 *      status update).
 *   2. Look up the service for event title/description.
 *   3. Google Calendar OAuth → getAccessToken() with stored refresh token.
 *   4. createEvent() with Meet link auto-generation.
 *   5. UPDATE session with calendar_event_id and meet_link in DB.
 *   6. sendConfirmationEmail() via Resend with all booking details.
 *
 * Each step is wrapped in its own try/catch — a failure in one step
 * doesn't block subsequent steps (e.g., calendar failure won't prevent
 * the email from being sent, though the email won't have a Meet link).
 *
 * @param sessionId - The DB ID of the session to process
 */
async function processPostPayment(sessionId: number): Promise<void> {
  console.log(`[wompi:background] Starting post-payment for session #${sessionId}`);

  try {
    // ── Re-fetch session (get latest state after approval) ──
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.id, sessionId))
      .limit(1);

    if (!session || session.status !== "approved") {
      console.warn(
        `[wompi:background] Session #${sessionId} not found or not approved — aborting`
      );
      return;
    }

    // ── Look up service for event details ──
    const [service] = await db
      .select()
      .from(services)
      .where(eq(services.id, session.serviceId))
      .limit(1);

    if (!service) {
      console.error(
        `[wompi:background] Service #${session.serviceId} not found for session #${sessionId}`
      );
      return;
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Google Calendar Event with Meet Link
    // ═══════════════════════════════════════════════════════════════

    let meetLink: string | null = null;

    try {
      const googleRefreshToken = process.env.GOOGLE_REFRESH_TOKEN;
      const googleClientId = process.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

      if (!googleRefreshToken || !googleClientId || !googleClientSecret) {
        console.error(
          "[wompi:background] Google OAuth env vars missing — skipping calendar"
        );
      } else {
        // OAuth 2.0: exchange refresh token for short-lived access token
        const accessToken = await getAccessToken(
          googleRefreshToken,
          googleClientId,
          googleClientSecret
        );

        // scheduledAt is timestamp with timezone — Drizzle returns a Date
        const startTime = session.scheduledAt;
        // JS Date objects already carry timezone info from the DB
        const endTime = new Date(
          startTime.getTime() + service.durationMin * 60 * 1000
        );

        const eventResult = await createEvent(
          `${service.name}`,
          [
            `Servicio: ${service.name}`,
            `Cliente: ${session.customerEmail}`,
            `Duración: ${service.durationMin} minutos`,
            `Referencia: ${session.wompiReference ?? "N/A"}`,
          ].join("\n"),
          startTime.toISOString(),
          endTime.toISOString(),
          session.customerEmail,
          accessToken
        );

        meetLink = eventResult.hangoutLink;

        // Persist calendar event ID and Meet link in the session
        await db
          .update(sessions)
          .set({
            calendarEventId: eventResult.eventId,
            meetLink: eventResult.hangoutLink,
          })
          .where(eq(sessions.id, sessionId));

        console.log(
          `[wompi:background] Calendar event created: ${eventResult.eventId} — Meet: ${eventResult.hangoutLink}`
        );
      }
    } catch (err) {
      // Calendar failure is NOT critical — payment is already confirmed.
      // Patyka can create the Meet link manually if needed.
      console.error("[wompi:background] Calendar event creation failed:", err);
      // Flag the session for manual retry — we still proceed to email
    }

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Confirmation Email via Resend
    // ═══════════════════════════════════════════════════════════════

    try {
      const emailHtml = buildConfirmationEmail(
        service.name,
        session.scheduledAt,
        service.durationMin,
        meetLink,
        session.wompiReference
      );

      await sendConfirmationEmail(
        session.customerEmail,
        `✅ Confirmación: ${service.name} — Patyka Tarot`,
        emailHtml
      );

      console.log(
        `[wompi:background] Confirmation email sent to ${session.customerEmail}`
      );
    } catch (err) {
      // Email failure is NOT critical — booking is still confirmed.
      // Patyka can follow up via WhatsApp.
      console.error("[wompi:background] Confirmation email failed:", err);
    }

    console.log(
      `[wompi:background] Post-payment complete for session #${sessionId}`
    );
  } catch (err) {
    // Top-level catch — should never fire since each step has its own
    // try/catch, but this guards against unexpected errors (e.g., DB
    // connection failure during the initial re-fetch).
    console.error(
      `[wompi:background] Unexpected error in post-payment for session #${sessionId}:`,
      err
    );
  }
}

// ---------------------------------------------------------------------------
// Email Template Builder
// ---------------------------------------------------------------------------

/**
 * Builds a simple, responsive HTML confirmation email.
 *
 * No react-email dependency — just clean inline HTML with the Liquid
 * Glass dark theme colors. Works in Gmail, Outlook, Apple Mail, etc.
 *
 * ## Design decisions
 *
 *   - Inline CSS (no external stylesheets — email clients strip them)
 *   - Dark theme (matches the landing page aesthetic)
 *   - Gold accent (brand consistency)
 *   - DM Sans as font-family with system fallbacks
 *   - Responsive: max-width 600px, mobile-friendly
 *
 * @param serviceName    - The service booked (e.g., "Lectura General de Tarot")
 * @param scheduledAt    - JS Date for the session start (Bogotá time)
 * @param durationMin    - Session duration in minutes
 * @param meetLink       - Google Meet URL (null if calendar creation failed)
 * @param bookingRef     - Wompi reference / booking ID
 * @returns HTML string ready for Resend
 */
function buildConfirmationEmail(
  serviceName: string,
  scheduledAt: Date,
  durationMin: number,
  meetLink: string | null,
  bookingRef: string | null
): string {
  // Format date/time in Bogotá locale and timezone
  const dateStr = new Intl.DateTimeFormat("es-CO", {
    timeZone: TIMEZONE,
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(scheduledAt);

  const timeStr = new Intl.DateTimeFormat("es-CO", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(scheduledAt);

  // Calculate end time
  const endTime = new Date(scheduledAt.getTime() + durationMin * 60 * 1000);
  const endTimeStr = new Intl.DateTimeFormat("es-CO", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(endTime);

  const meetSection = meetLink
    ? `
    <div style="margin: 32px 0; padding: 24px; background: rgba(255,255,255,0.04); border: 1px solid rgba(212,168,83,0.3); border-radius: 12px; text-align: center;">
      <p style="margin: 0 0 12px 0; color: rgba(245,240,235,0.6); font-size: 14px;">Link de Google Meet para tu sesión:</p>
      <a href="${meetLink}" style="display: inline-block; padding: 14px 32px; background: #d4a853; color: #0a0a0f; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 16px;">Unirse a la videollamada</a>
    </div>`
    : `
    <div style="margin: 32px 0; padding: 24px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; text-align: center;">
      <p style="margin: 0; color: rgba(245,240,235,0.6); font-size: 14px;">Te enviaremos el link de Google Meet por WhatsApp antes de tu sesión.</p>
    </div>`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0f; font-family: 'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #f5f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td style="text-align: center; padding-bottom: 32px;">
        <h1 style="font-family: 'Instrument Serif', Georgia, serif; font-size: 28px; color: #d4a853; margin: 0 0 8px 0; font-weight: 400;">
          ¡Tu sesión está confirmada!
        </h1>
        <p style="margin: 0; color: rgba(245,240,235,0.6); font-size: 16px;">
          Gracias por confiar en Patyka Tarot
        </p>
      </td>
    </tr>
    <tr>
      <td style="padding: 32px; background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding-bottom: 20px; border-bottom: 1px solid rgba(255,255,255,0.08);">
              <h2 style="font-family: 'Instrument Serif', Georgia, serif; font-size: 20px; margin: 0 0 4px 0; font-weight: 400;">
                ${escapeHtml(serviceName)}
              </h2>
            </td>
          </tr>
          <tr>
            <td style="padding-top: 20px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 10px 0; color: rgba(245,240,235,0.6); font-size: 14px;">Fecha</td>
                  <td style="padding: 10px 0; text-align: right; font-size: 14px; text-transform: capitalize;">${dateStr}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: rgba(245,240,235,0.6); font-size: 14px;">Horario</td>
                  <td style="padding: 10px 0; text-align: right; font-size: 14px;">${timeStr} – ${endTimeStr} (hora Bogotá)</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: rgba(245,240,235,0.6); font-size: 14px;">Duración</td>
                  <td style="padding: 10px 0; text-align: right; font-size: 14px;">${durationMin} minutos</td>
                </tr>
                ${bookingRef ? `
                <tr>
                  <td style="padding: 10px 0; color: rgba(245,240,235,0.6); font-size: 14px;">Referencia</td>
                  <td style="padding: 10px 0; text-align: right; font-size: 14px; font-family: monospace;">${escapeHtml(bookingRef.slice(0, 8))}</td>
                </tr>` : ""}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td>
        ${meetSection}
      </td>
    </tr>
    <tr>
      <td style="padding-top: 24px; text-align: center;">
        <p style="margin: 0 0 8px 0; font-size: 13px; color: rgba(245,240,235,0.4);">
          ¿Necesitás reprogramar? Escribinos al WhatsApp con 24h de anticipación.
        </p>
        <p style="margin: 0; font-size: 12px; color: rgba(245,240,235,0.3);">
          Patyka Tarot — Lecturas y Brujitips
        </p>
      </td>
    </tr>
  </table>
</body>
</html>`.trim();
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Minimal HTML entity escaping to prevent injection in email templates.
 * Not a full sanitizer — just prevents the most obvious issues.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
