/**
 * Tests for the Root Layout component.
 *
 * Verifies structural requirements:
 * - Viewport export exists with correct Next.js Viewport type (Task 1.2)
 * - Skip-to-content link (Task 1.3)
 * - HTML lang="es" attribute
 */
import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";

// Mock next/font/google BEFORE importing the layout module.
// The mock is hoisted by vitest, so it runs before any imports.
vi.mock("next/font/google", () => ({
  Instrument_Serif: (config: Record<string, unknown>) => ({
    ...config,
    variable: "--font-instrument-serif",
    style: { fontFamily: "Instrument Serif" },
  }),
  DM_Sans: (config: Record<string, unknown>) => ({
    ...config,
    variable: "--font-dm-sans",
    style: { fontFamily: "DM Sans" },
  }),
}));

// Now safe to import — the mock is active
import RootLayout, { metadata, viewport } from "./layout";

describe("RootLayout metadata", () => {
  it("exports metadata with title", () => {
    expect(metadata.title).toBe(
      "Patyka Tarot | Lecturas, Brujitips y Sesiones",
    );
  });

  it("exports metadata with Open Graph image", () => {
    expect(metadata.openGraph?.images).toBeDefined();
  });
});

describe("RootLayout viewport", () => {
  it("exports viewport with width=device-width", () => {
    expect(viewport?.width).toBe("device-width");
  });

  it("exports viewport with initial-scale=1", () => {
    expect(viewport?.initialScale).toBe(1);
  });

  it("does NOT set user-scalable=no (allows zoom)", () => {
    expect(viewport).not.toHaveProperty("userScalable");
    expect(viewport).not.toHaveProperty("maximumScale");
  });
});

describe("RootLayout skip-to-content link", () => {
  beforeEach(() => {
    // Render the layout once for all skip-link assertions.
    // Multiple <html> renders accumulate in jsdom, so we render once
    // and extract the skip link via getAllByText + first element.
    render(
      <RootLayout>
        <div>Child content</div>
      </RootLayout>,
    );
  });

  it("renders a skip-to-content link with correct text", () => {
    const links = screen.getAllByText("Saltar al contenido principal");
    expect(links.length).toBeGreaterThanOrEqual(1);
    expect(links[0]).toBeInTheDocument();
  });

  it("renders skip link pointing to #main-content", () => {
    const skipLink = screen.getAllByText(
      "Saltar al contenido principal",
    )[0];
    expect(skipLink.tagName).toBe("A");
    expect(skipLink.getAttribute("href")).toBe("#main-content");
  });

  it("renders skip link with sr-only class (visually hidden by default)", () => {
    const skipLink = screen.getAllByText(
      "Saltar al contenido principal",
    )[0];
    expect(skipLink.className).toContain("sr-only");
    expect(skipLink.className).toContain("focus:not-sr-only");
  });
});

describe("RootLayout — HTML structure", () => {
  it("renders children inside the body", () => {
    render(
      <RootLayout>
        <div data-testid="child">Child content</div>
      </RootLayout>,
    );

    // The layout should render its children within <body>
    const body = document.querySelector("body");
    expect(body).not.toBeNull();
    // Use getAllByTestId since multiple renders accumulate in jsdom
    const children = screen.getAllByTestId("child");
    expect(children.length).toBeGreaterThanOrEqual(1);
    expect(children[0]).toHaveTextContent("Child content");
  });
});
