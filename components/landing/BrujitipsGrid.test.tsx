/**
 * Tests for BrujitipsGrid — Visual Polish Phase 5, Task 5.3
 *
 * TDD cycles:
 *   5.3 — Replace emoji in h2 with accessible SVG wand icon
 */
import React from "react";
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { render, screen } from "@testing-library/react";

beforeAll(() => {
  vi.stubGlobal("IntersectionObserver", class {
    root = null; rootMargin = ""; thresholds: number[] = [];
    constructor() {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return []; }
  });
  vi.stubGlobal("fetch", () =>
    Promise.resolve({ json: () => Promise.resolve({ thumbnails: [] }) }),
  );
});

afterAll(() => {
  vi.unstubAllGlobals();
});

import BrujitipsGrid from "./BrujitipsGrid";

describe("BrujitipsGrid — SVG wand icon replaces emoji (Task 5.3)", () => {
  it("heading does NOT contain emoji characters", () => {
    render(<BrujitipsGrid />);

    // Find h2 by text content (it currently contains "Mis Mejores Brujitips 🪄")
    const h2 = document.querySelector("h2")!;
    expect(h2).not.toBeNull();

    const text = h2.textContent ?? "";
    const emojiPattern = /[\u{1F000}-\u{1FFFF}]|[\u{2600}-\u{27BF}]|[\u{FE00}-\u{FE0F}]/u;
    expect(text).not.toMatch(emojiPattern);
  });

  it("heading contains an inline SVG wand icon", () => {
    render(<BrujitipsGrid />);

    const h2 = document.querySelector("h2")!;
    const svg = h2.querySelector("svg");
    expect(svg).not.toBeNull();
    expect(svg!.tagName).toBe("svg");
  });

  it("SVG icon has aria-hidden='true' (decorative)", () => {
    render(<BrujitipsGrid />);

    const h2 = document.querySelector("h2")!;
    const svg = h2.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
  });

  it("heading text remains readable ('Mis Mejores Brujitips')", () => {
    render(<BrujitipsGrid />);

    const h2 = document.querySelector("h2")!;
    expect(h2).toBeInTheDocument();
    expect(h2.textContent).toContain("Mis Mejores Brujitips");
  });
});
