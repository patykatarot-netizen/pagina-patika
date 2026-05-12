/**
 * Wompi (Colombia) payment integration.
 *
 * Wompi is the de facto payment processor for Colombia — it handles
 * credit/debit cards, PSE (ACH transfers), Nequi, Bancolombia buttons,
 * and more through a single hosted checkout page.
 *
 * Flow:
 *   1. Server Action calls initCheckout() → returns a URL
 *   2. Next.js redirects the user to Wompi's hosted checkout
 *   3. User pays on Wompi's domain
 *   4. Wompi POSTs a webhook to our app with the payment result
 *   5. We verify the webhook's HMAC signature then update the DB
 *
 * Why HMAC verification?
 *   - Anyone can POST to /api/wompi/webhook
 *   - HMAC (Hash-based Message Authentication Code) lets us verify
 *     that the payload genuinely came from Wompi
 *   - It works because only Wompi and our server know the
 *     WOMPI_EVENTS_KEY secret — an attacker can't forge a valid HMAC
 *   - We use constant-time comparison (timingSafeEqual) so attackers
 *     can't brute-force the signature byte-by-byte by measuring
 *     response times
 *
 * Environment variables used:
 *   - WOMPI_PUBLIC_KEY  → sandbox public key
 *   - WOMPI_EVENTS_KEY  → webhook integrity secret
 *
 * Sandbox URLs:
 *   - API:           https://sandbox.wompi.co/v1/
 *   - Checkout:      https://checkout.wompi.co/p/
 */

import crypto from "node:crypto";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Wompi sandbox checkout URL — production version uses wompi.co domain */
const CHECKOUT_BASE_URL = "https://checkout.wompi.co/p/";

// ---------------------------------------------------------------------------
// initCheckout
// ---------------------------------------------------------------------------

/**
 * Constructs the Wompi Checkout URL with query parameters.
 *
 * Wompi's hosted checkout is a full-page redirect — we don't embed
 * the payment form in our app. This keeps PCI compliance simple:
 * card data never touches our server.
 *
 * @param amountInCents - Price in COP centavos (e.g., 8000000 = $80,000 COP)
 * @param reference    - Unique merchant reference (we use session UUID)
 * @param customerEmail - Customer's email for receipts
 * @returns The full Wompi checkout URL to redirect the user to
 *
 * @example
 *   initCheckout(8000000, "ref-abc-123", "cliente@email.com")
 *   // → "https://checkout.wompi.co/p/?public-key=pk_test_xxx&currency=COP&..."
 */
export function initCheckout(
  amountInCents: number,
  reference: string,
  customerEmail: string
): string {
  // Validate inputs — fail loudly on bad data before constructing URL
  if (!amountInCents || amountInCents <= 0) {
    throw new Error(
      `Invalid amountInCents: ${amountInCents}. Must be a positive integer (COP centavos).`
    );
  }
  if (!reference || reference.trim().length === 0) {
    throw new Error("Reference is required — it identifies the booking session.");
  }
  if (!customerEmail || !customerEmail.includes("@")) {
    throw new Error("A valid customer email is required for Wompi checkout.");
  }

  const publicKey = process.env.WOMPI_PUBLIC_KEY;
  if (!publicKey) {
    throw new Error("WOMPI_PUBLIC_KEY environment variable is not set.");
  }

  // Construct query string with all required Wompi parameters
  const params = new URLSearchParams({
    "public-key": publicKey,
    "currency": "COP",
    "amount-in-cents": String(amountInCents),
    "reference": reference,
    "customer-email": customerEmail,
  });

  return `${CHECKOUT_BASE_URL}?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// verifyWebhookSignature
// ---------------------------------------------------------------------------

/**
 * Verifies a Wompi webhook signature using HMAC-SHA256 with constant-time
 * comparison.
 *
 * ## Why this matters
 *
 * Wompi sends webhooks to /api/wompi/webhook when a payment is approved,
 * declined, or voided. Anyone on the internet can POST to that URL, so
 * we MUST verify every request comes from Wompi.
 *
 * ## How it works
 *
 * 1. Wompi computes `HMAC-SHA256(dataAsJSON, WOMPI_EVENTS_KEY)` and
 *    sends it in the `X-Event-Checksum` header (or inside the `hmac`
 *    field of the JSON body).
 *
 * 2. We recompute the same HMAC on our side using the same secret key.
 *
 * 3. If our HMAC matches Wompi's HMAC, the payload is authentic —
 *    because ONLY Wompi and our server know the secret key.
 *    A man-in-the-middle cannot forge a valid HMAC.
 *
 * 4. We use `crypto.timingSafeEqual()` for the comparison. This prevents
 *    timing attacks: if we used `===`, Node would short-circuit on the
 *    first mismatched byte, and an attacker could brute-force the
 *    signature byte-by-byte by measuring how long our server takes to
 *    respond. Constant-time comparison always compares ALL bytes.
 *
 * @param dataPayload - The `data` object from the webhook payload (not the whole body)
 * @param signature   - The HMAC-SHA256 hex string from Wompi's header or body
 * @param eventsKey   - WOMPI_EVENTS_KEY from env — the shared secret
 * @returns `true` if the signature is valid, `false` otherwise
 */
export function verifyWebhookSignature(
  dataPayload: unknown,
  signature: string | undefined | null,
  eventsKey: string
): boolean {
  // Guard: no signature means we can't verify — reject immediately
  if (!signature || signature.length === 0) {
    console.warn("[wompi] Missing webhook signature — rejecting request");
    return false;
  }

  // Serialize the data payload the same way Wompi does (JSON string
  // without pretty-printing). Using JSON.stringify on the data object
  // directly ensures deterministic output.
  const payloadString = JSON.stringify(dataPayload);

  // Compute our HMAC-SHA256 using the shared secret
  const computedHmac = crypto
    .createHmac("sha256", eventsKey)
    .update(payloadString)
    .digest("hex");

  const computedBuffer = Buffer.from(computedHmac, "hex");
  const receivedBuffer = Buffer.from(signature, "hex");

  // CRITICAL: Use constant-time comparison to prevent timing attacks.
  // If the buffers have different lengths, timingSafeEqual throws.
  // We guard against that by checking lengths first.
  if (computedBuffer.length !== receivedBuffer.length) {
    console.warn("[wompi] HMAC length mismatch — rejecting request");
    return false;
  }

  return crypto.timingSafeEqual(computedBuffer, receivedBuffer);
}
