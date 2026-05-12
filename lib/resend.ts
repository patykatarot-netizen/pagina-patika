/**
 * Resend.com transactional email integration.
 *
 * Resend is a modern email API (by the creators of React Email) that
 * handles deliverability, spam compliance, and tracking. We use it
 * to send booking confirmation emails after payment is approved.
 *
 * ## Why Resend instead of Nodemailer/SMTP?
 *
 *   - No SMTP server to maintain or warm up
 *   - Built-in deliverability (DKIM, SPF, DMARC configured automatically)
 *   - Simple REST API — a single fetch() call
 *   - Free tier: 100 emails/day (more than enough for a solopreneur)
 *
 * ## Error handling philosophy
 *
 *   Email delivery is best-effort, NOT critical path. If the email
 *   fails to send:
 *     - We log the error (so we know it happened)
 *     - We do NOT throw (so the booking flow continues)
 *     - The user still sees the confirmation page with their Meet link
 *     - We can manually follow up via WhatsApp if needed
 *
 *   The booking itself is confirmed by Wompi's webhook — the email is
 *   an enhancement, not a requirement.
 *
 * Environment variables used:
 *   - RESEND_API_KEY → API key from https://resend.com/api-keys
 */

const RESEND_API_URL = "https://api.resend.com/emails";

// ---------------------------------------------------------------------------
// sendConfirmationEmail
// ---------------------------------------------------------------------------

/**
 * Sends a transactional confirmation email via Resend.
 *
 * Gracefully handles errors: logs them but never throws, so a failed
 * email doesn't block the booking flow.
 *
 * @param to      - Recipient email address
 * @param subject - Email subject line
 * @param html    - Email body as HTML string
 * @returns The Resend message ID if successful, `null` if it failed
 *
 * @example
 *   await sendConfirmationEmail(
 *     "cliente@email.com",
 *     "Confirmación: Lectura General de Tarot",
 *     "<h1>¡Reserva confirmada!</h1><p>Google Meet: ...</p>"
 *   );
 */
export async function sendConfirmationEmail(
  to: string,
  subject: string,
  html: string
): Promise<string | null> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("[resend] RESEND_API_KEY is not set — skipping email");
    return null;
  }

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Patyka Tarot <sesiones@patykatarot.com>",
        to,
        subject,
        html,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[resend] Failed to send email (${response.status}): ${errorBody}`
      );
      return null;
    }

    const data = (await response.json()) as { id: string };
    console.log(`[resend] Email sent successfully — ID: ${data.id}`);
    return data.id;
  } catch (err) {
    // Network error, DNS failure, etc. — log and continue
    console.error("[resend] Unexpected error sending email:", err);
    return null;
  }
}
