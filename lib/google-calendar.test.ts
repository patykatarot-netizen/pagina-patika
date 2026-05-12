/**
 * Tests for lib/google-calendar.ts — Google Calendar API integration.
 *
 * All HTTP calls are mocked via vi.fn() + fetch mock. No real API calls.
 *
 * Coverage:
 *   - getAccessToken() — successful token exchange, API error
 *   - createEvent() — successful event creation with Meet link, API error
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getAccessToken, createEvent } from "./google-calendar";

// ── Mock data ──────────────────────────────────────────────────────────────

const MOCK_ACCESS_TOKEN = "ya29.a0AfH6SMB_abc123_test";
const MOCK_REFRESH_TOKEN = "1//0refresh_token_xyz";
const MOCK_CLIENT_ID = "test-client-id.apps.googleusercontent.com";
const MOCK_CLIENT_SECRET = "GOCSPX-test-secret";
const MOCK_EVENT_ID = "abc123event";
const MOCK_HANGOUT_LINK = "https://meet.google.com/abc-def-ghi";
const MOCK_HTML_LINK = "https://www.google.com/calendar/event?eid=abc123";

// ── fetch mock ─────────────────────────────────────────────────────────────

const originalFetch = globalThis.fetch;

beforeEach(() => {
  // Reset fetch before each test
  globalThis.fetch = vi.fn();
});

afterEach(() => {
  // Restore the original fetch
  globalThis.fetch = originalFetch;
});

// ===========================================================================
// getAccessToken
// ===========================================================================

describe("getAccessToken", () => {
  it("exchanges refresh token for access token successfully", async () => {
    // Mock: Google OAuth responds with 200 and access_token
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: MOCK_ACCESS_TOKEN }),
    });

    const token = await getAccessToken(
      MOCK_REFRESH_TOKEN,
      MOCK_CLIENT_ID,
      MOCK_CLIENT_SECRET
    );

    expect(token).toBe(MOCK_ACCESS_TOKEN);

    // Verify the fetch call was correct
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];
    expect(url).toBe("https://oauth2.googleapis.com/token");
    expect(options.method).toBe("POST");
    expect(options.headers["Content-Type"]).toBe(
      "application/x-www-form-urlencoded"
    );

    // options.body is a URLSearchParams instance — convert to string,
    // decode URL-encoding so we can check plaintext param values
    const bodyString = decodeURIComponent(String(options.body));
    expect(bodyString).toContain("grant_type=refresh_token");
    expect(bodyString).toContain(`client_id=${MOCK_CLIENT_ID}`);
    expect(bodyString).toContain(`client_secret=${MOCK_CLIENT_SECRET}`);
    expect(bodyString).toContain(`refresh_token=${MOCK_REFRESH_TOKEN}`);
  });

  it("throws when Google returns a non-200 response", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 400,
      text: async () => '{"error": "invalid_grant"}',
    });

    await expect(
      getAccessToken(MOCK_REFRESH_TOKEN, MOCK_CLIENT_ID, MOCK_CLIENT_SECRET)
    ).rejects.toThrow(/token refresh failed.*400/);
  });

  it("throws when refresh token is revoked (Google returns 401)", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      text: async () => '{"error": "invalid_client"}',
    });

    await expect(
      getAccessToken("revoked_token", MOCK_CLIENT_ID, MOCK_CLIENT_SECRET)
    ).rejects.toThrow(/token refresh failed.*401/);
  });
});

// ===========================================================================
// createEvent
// ===========================================================================

describe("createEvent", () => {
  const startDateTime = "2026-05-10T14:00:00-05:00";
  const endDateTime = "2026-05-10T15:00:00-05:00";

  it("creates a calendar event with Google Meet conferencing successfully", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        id: MOCK_EVENT_ID,
        hangoutLink: MOCK_HANGOUT_LINK,
        htmlLink: MOCK_HTML_LINK,
      }),
    });

    const result = await createEvent(
      "Lectura General — María",
      "Sesión de tarot con María García",
      startDateTime,
      endDateTime,
      "maria@email.com",
      MOCK_ACCESS_TOKEN
    );

    expect(result.eventId).toBe(MOCK_EVENT_ID);
    expect(result.hangoutLink).toBe(MOCK_HANGOUT_LINK);
    expect(result.htmlLink).toBe(MOCK_HTML_LINK);

    // Verify the API call
    const [url, options] = (globalThis.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(url).toContain("https://www.googleapis.com/calendar/v3/calendars/primary/events");
    expect(url).toContain("conferenceDataVersion=1");
    expect(options.method).toBe("POST");
    expect(options.headers["Authorization"]).toBe(`Bearer ${MOCK_ACCESS_TOKEN}`);

    // Verify the event body includes Meet conferencing
    const body = JSON.parse(options.body);
    expect(body.summary).toBe("Lectura General — María");
    expect(body.description).toBe("Sesión de tarot con María García");
    expect(body.start.dateTime).toBe(startDateTime);
    expect(body.end.dateTime).toBe(endDateTime);
    expect(body.start.timeZone).toBe("America/Bogota");
    expect(body.end.timeZone).toBe("America/Bogota");
    expect(body.attendees).toEqual([{ email: "maria@email.com" }]);
    expect(body.conferenceData.createRequest.conferenceSolutionKey.type).toBe(
      "hangoutsMeet"
    );
    expect(body.conferenceData.createRequest.requestId).toBeTruthy();
  });

  it("throws when Google Calendar API returns an error", async () => {
    (globalThis.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 403,
      text: async () =>
        '{"error": {"message": "Calendar usage limits exceeded."}}',
    });

    await expect(
      createEvent(
        "Test Event",
        "Description",
        startDateTime,
        endDateTime,
        "test@email.com",
        MOCK_ACCESS_TOKEN
      )
    ).rejects.toThrow(/event creation failed.*403/);
  });
});
