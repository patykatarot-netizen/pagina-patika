/**
 * Tests for BioSection — Visual Polish Phase 5, Task 5.1
 *
 * TDD cycles:
 *   5.1 — Replace gradient placeholder with tarot-themed SVG illustration
 *
 * Acceptance criteria (from spec):
 *   - A decorative tarot-themed SVG MUST be visible
 *   - SVG MUST have role="img" with aria-label
 *   - Desktop layout preserves Liquid Glass aesthetic
 *   - Mobile layout adapts (hidden md:block on decorative column)
 */
import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import BioSection from "./BioSection";

describe("BioSection — tarot SVG illustration (Task 5.1)", () => {
  afterEach(() => {
    cleanup();
  });
  it("renders a decorative SVG in the visual column", () => {
    render(<BioSection />);

    // The SVG should exist with role="img" and an aria-label
    const svg = screen.getByRole("img", { name: /ilustración de tarot/i });
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe("svg");
  });

  it("SVG has role='img' with descriptive aria-label", () => {
    render(<BioSection />);

    const svg = screen.getByRole("img", { name: /ilustración de tarot/i });
    // The SVG is accessible via role="img" with a descriptive aria-label.
    // It does NOT use aria-hidden because we want screen readers to identify it.
    expect(svg).toHaveAttribute("aria-label", "Ilustración de tarot");
    expect(svg).toHaveAttribute("role", "img");
    expect(svg).not.toHaveAttribute("aria-hidden");
  });

  it("SVG contains tarot-themed elements (stars, geometric motifs)", () => {
    render(<BioSection />);

    const svg = screen.getByRole("img", { name: /ilustración de tarot/i });

    // The SVG should contain star-shaped paths (The Star arcana motif)
    const stars = svg.querySelectorAll("[data-motif='star']");
    expect(stars.length).toBeGreaterThanOrEqual(1);
  });

  it("decorative column is hidden on mobile (hidden md:block)", () => {
    render(<BioSection />);

    // The wrapper around the SVG has hidden md:block for responsive behavior
    const svg = screen.getByRole("img", { name: /ilustración de tarot/i });
    const decorativeColumn = svg.closest(".hidden.md\\:block");
    expect(decorativeColumn).not.toBeNull();
  });

  it("the gradient placeholder div is no longer rendered", () => {
    render(<BioSection />);

    // The previous implementation had a div with inline linear-gradient style.
    // After the SVG replacement, no element should have that style.
    const svg = screen.getByRole("img", { name: /ilustración de tarot/i });
    const parent = svg.closest(".hidden.md\\:block")!;

    // The decorative column should contain the SVG wrapped in liquid-glass,
    // NOT an empty gradient div
    const gradientDivs = parent.querySelectorAll(
      'div[style*="linear-gradient"]',
    );
    expect(gradientDivs.length).toBe(0);
  });
});
