/**
 * Tests for ServiceCatalog — Visual Polish Phase 5, Task 5.2
 *
 * TDD cycles:
 *   5.2 — Friendly empty-state message instead of null
 *
 * Acceptance criteria (from spec):
 *   - When services array is empty, a friendly message MUST be displayed
 *   - A subtle decorative icon or illustration SHOULD accompany the message
 *   - The message MUST be readable by screen readers
 */
import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import type { Service } from "@/types";
import ServiceCatalog from "./ServiceCatalog";

// Mock ServiceCard to keep tests focused on the catalog logic
vi.mock("./ServiceCard", () => ({
  default: ({ service }: { service: Service }) => (
    <article data-testid="service-card">{service.name}</article>
  ),
}));

describe("ServiceCatalog — empty state (Task 5.2)", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders a friendly message when services array is empty", () => {
    render(<ServiceCatalog services={[]} />);

    const message = screen.getByText(/no hay servicios disponibles/i);
    expect(message).toBeInTheDocument();
  });

  it("renders a decorative icon alongside the empty state message", () => {
    render(<ServiceCatalog services={[]} />);

    // The Sparkles icon from lucide should be present
    const section = screen.getByText(/no hay servicios disponibles/i).closest("section");
    expect(section).not.toBeNull();

    // lucide-react icons render as SVGs with class "lucide-sparkles"
    const icon = section!.querySelector(".lucide-sparkles");
    expect(icon).not.toBeNull();
  });

  it("empty state message is accessible (not aria-hidden)", () => {
    render(<ServiceCatalog services={[]} />);

    const message = screen.getByText(/no hay servicios disponibles/i);
    expect(message).not.toHaveAttribute("aria-hidden", "true");
  });

  it("renders the service grid when services are provided", () => {
    const services: Service[] = [
      {
        id: 1,
        name: "Lectura de Tarot",
        description: "Desc",
        priceCop: 50000,
        durationMin: 60,
        isActive: true,
        availableDays: 127,
        availableSlots: "[]",
        bookingType: "web",
        category: "completa",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(<ServiceCatalog services={services} />);

    const cards = screen.getAllByTestId("service-card");
    expect(cards).toHaveLength(1);
    expect(screen.getByText("Lectura de Tarot")).toBeInTheDocument();
  });

  it("does NOT render the empty state message when services exist", () => {
    const services: Service[] = [
      {
        id: 1,
        name: "Lectura de Tarot",
        description: "Desc",
        priceCop: 50000,
        durationMin: 60,
        isActive: true,
        availableDays: 127,
        availableSlots: "[]",
        bookingType: "web",
        category: "completa",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    render(<ServiceCatalog services={services} />);

    expect(
      screen.queryByText(/no hay servicios disponibles/i),
    ).not.toBeInTheDocument();
  });
});
