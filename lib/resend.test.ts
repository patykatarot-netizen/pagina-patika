/**
 * Tests for lib/resend.ts — Resend transactional email.
 *
 * All HTTP calls are mocked via vi.fn(). No real API calls.
 *
 * Coverage:
 *   - sendConfirmationEmail() — successful send, API error (returns null,
 *     does NOT throw), missing API key
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { sendConfirmationEmail } from "./resend";

// ── fetch mock ─────────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

beforeEach(() => {
  globalThis.fetch = vi.fn();
  process.env.RESEND_API_KEY = "re_test_api_key_123";
});

afterEach(() => {
  globalThis.fetch = originalFetch;
  delete process.env.RESEND_API_KEY;
});

// ===========================================================================
// sendConfirmationEmail
// ===========================================================================

describe("sendConfirmationEmail", () => {
  it("sends a confirmation email successfully and returns the message ID", async () => {
    const mockMessageId = "email_msg_abc123";

    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ id: mockMessageId }),
    });

    const id = await sendConfirmationEmail(
      "cliente@email.com",
      "Confirmación: Lectura General de Tarot",
      "<h1>¡Reserva confirmada!</h1>"
    );

    expect(id).toBe(mockMessageId);

    // Verify the correct API call was made
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(url).toBe("https://api.resend.com/emails");
    expect(options.method).toBe("POST");
    expect(options.headers["Authorization"]).toBe(
      "Bearer re_test_api_key_123"
    );
    expect(options.headers["Content-Type"]).toBe("application/json");

    const body = JSON.parse(options.body);
    expect(body.from).toContain("sesiones@patykatarot.com");
    expect(body.to).toBe("cliente@email.com");
    expect(body.subject).toBe("Confirmación: Lectura General de Tarot");
    expect(body.html).toBe("<h1>¡Reserva confirmada!</h1>");
  });

  it("returns null (does NOT throw) when Resend API returns an error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 429,
      text: async () => '{"message": "Too many requests"}',
    });

    const result = await sendConfirmationEmail(
      "cliente@email.com",
      "Subject",
      "<p>Body</p>"
    );

    // Should return null, NOT throw — email failures must never block booking
    expect(result).toBeNull();
  });

  it("returns null when RESEND_API_KEY is not set", async () => {
    delete process.env.RESEND_API_KEY;

    const result = await sendConfirmationEmail(
      "cliente@email.com",
      "Subject",
      "<p>Body</p>"
    );

    expect(result).toBeNull();
    // fetch should NOT have been called (no API key means no point)
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it("returns null on network error (fetch throws)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("ECONNREFUSED")
    );

    const result = await sendConfirmationEmail(
      "cliente@email.com",
      "Subject",
      "<p>Body</p>"
    );

    // Network error should not crash — returns null gracefully
    expect(result).toBeNull();
  });
});
