/**
 * Tests for lib/wompi.ts — Wompi payment integration.
 *
 * These are PURE unit tests: no real API calls, no environment
 * variables beyond what we explicitly set in beforeEach/afterEach.
 *
 * Coverage:
 *   - initCheckout() — valid URL construction, invalid inputs, missing env
 *   - verifyWebhookSignature() — valid signature, invalid signature,
 *     missing signature, length mismatch, different payload
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { initCheckout, verifyWebhookSignature } from "./wompi";
import crypto from "node:crypto";

// ── Helpers ────────────────────────────────────────────────────────────────

/** A known events key we use across tests */
const TEST_EVENTS_KEY = "test_events_secret_abc123";

/** Compute the exact HMAC our verify function expects */
function computeValidHmac(dataPayload: unknown, key: string): string {
  return crypto
    .createHmac("sha256", key)
    .update(JSON.stringify(dataPayload))
    .digest("hex");
}

// ── Env setup ──────────────────────────────────────────────────────────────

beforeEach(() => {
  // Set a known public key so initCheckout doesn't fail on missing env var
  process.env.WOMPI_PUBLIC_KEY = "pk_test_testpublic123";
});

afterEach(() => {
  // Clean up: remove all env vars we set so tests are isolated
  delete process.env.WOMPI_PUBLIC_KEY;
});

// ===========================================================================
// initCheckout
// ===========================================================================

describe("initCheckout", () => {
  it("constructs a valid Wompi checkout URL with all required query parameters", () => {
    const url = initCheckout(8000000, "ref-abc-123", "cliente@email.com");

    expect(url).toContain("https://checkout.wompi.co/p/?");
    expect(url).toContain("public-key=pk_test_testpublic123");
    expect(url).toContain("currency=COP");
    expect(url).toContain("amount-in-cents=8000000");
    expect(url).toContain("reference=ref-abc-123");
    expect(url).toContain("customer-email=cliente%40email.com");
  });

  it("throws when amountInCents is zero", () => {
    expect(() => initCheckout(0, "ref", "email@test.com")).toThrow(
      /Invalid amountInCents/
    );
  });

  it("throws when amountInCents is negative", () => {
    expect(() => initCheckout(-100, "ref", "email@test.com")).toThrow(
      /Invalid amountInCents/
    );
  });

  it("throws when reference is empty", () => {
    expect(() => initCheckout(5000, "", "email@test.com")).toThrow(
      /Reference is required/
    );
  });

  it("throws when reference is whitespace only", () => {
    expect(() => initCheckout(5000, "   ", "email@test.com")).toThrow(
      /Reference is required/
    );
  });

  it("throws when customer email is invalid (no @)", () => {
    expect(() => initCheckout(5000, "ref", "notanemail")).toThrow(
      /valid customer email/
    );
  });

  it("throws when WOMPI_PUBLIC_KEY is not set", () => {
    delete process.env.WOMPI_PUBLIC_KEY;
    expect(() => initCheckout(5000, "ref", "email@test.com")).toThrow(
      /WOMPI_PUBLIC_KEY/
    );
  });
});

// ===========================================================================
// verifyWebhookSignature
// ===========================================================================

describe("verifyWebhookSignature", () => {
  /** A typical Wompi webhook data payload */
  const validPayload = {
    id: "txn_abc123",
    status: "APPROVED" as const,
    reference: "ref-abc-123",
    amount_in_cents: 8000000,
    customer_email: "cliente@email.com",
  };

  it("returns true for a valid HMAC signature (happy path)", () => {
    const validHmac = computeValidHmac(validPayload, TEST_EVENTS_KEY);
    const result = verifyWebhookSignature(
      validPayload,
      validHmac,
      TEST_EVENTS_KEY
    );
    expect(result).toBe(true);
  });

  it("returns false for an invalid (tampered) signature", () => {
    // A completely forged HMAC that doesn't match the payload
    const fakeHmac = computeValidHmac(
      { id: "someone_elses_txn", status: "DECLINED", reference: "hack" },
      TEST_EVENTS_KEY
    );
    const result = verifyWebhookSignature(
      validPayload,
      fakeHmac,
      TEST_EVENTS_KEY
    );
    expect(result).toBe(false);
  });

  it("returns false when the events key differs (wrong secret)", () => {
    const hmacWithWrongKey = computeValidHmac(validPayload, "wrong_secret");
    const result = verifyWebhookSignature(
      validPayload,
      hmacWithWrongKey,
      TEST_EVENTS_KEY
    );
    expect(result).toBe(false);
  });

  it("returns false when signature is undefined", () => {
    const result = verifyWebhookSignature(
      validPayload,
      undefined,
      TEST_EVENTS_KEY
    );
    expect(result).toBe(false);
  });

  it("returns false when signature is null", () => {
    const result = verifyWebhookSignature(
      validPayload,
      null,
      TEST_EVENTS_KEY
    );
    expect(result).toBe(false);
  });

  it("returns false when signature is empty string", () => {
    const result = verifyWebhookSignature(validPayload, "", TEST_EVENTS_KEY);
    expect(result).toBe(false);
  });

  it("returns false when HMAC buffers have different lengths", () => {
    // A truncated signature (only 2 hex chars instead of full SHA-256)
    const shortHmac = "ab";
    const result = verifyWebhookSignature(
      validPayload,
      shortHmac,
      TEST_EVENTS_KEY
    );
    expect(result).toBe(false);
  });

  it("returns false when payload is modified but signature is for original", () => {
    const hmacForOriginal = computeValidHmac(validPayload, TEST_EVENTS_KEY);

    // Modify the payload after HMAC was computed
    const tamperedPayload = {
      ...validPayload,
      amount_in_cents: 1, // changed from 8000000 to 1
    };

    const result = verifyWebhookSignature(
      tamperedPayload,
      hmacForOriginal,
      TEST_EVENTS_KEY
    );
    expect(result).toBe(false);
  });
});
