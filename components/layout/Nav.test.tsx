/**
 * Tests for Nav component — Mobile Navigation (Phase 2)
 *
 * TDD cycles:
 *   2.1 — Hamburger toggle + drawer open/close
 *   2.2 — Focus trap + Escape-to-close
 *   2.3 — IntersectionObserver scroll spy
 *   2.4 — Responsive font sizes (globals.css)
 */
import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// ============================================================
// Mock helpers
// ============================================================

/** Mock matchMedia for a specific viewport. */
function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: "(max-width: 767px)",
    addEventListener: vi.fn((_type: string, fn: (e: MediaQueryListEvent) => void) => {
      listeners.add(fn);
    }),
    removeEventListener: vi.fn((_type: string, fn: (e: MediaQueryListEvent) => void) => {
      listeners.delete(fn);
    }),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
  } as unknown as MediaQueryList;

  vi.spyOn(window, "matchMedia").mockReturnValue(mql);
  return mql;
}

// ============================================================
// Task 2.1 — Hamburger Menu Toggle
// ============================================================

import Nav from "./Nav";

describe("Nav — hamburger toggle (Task 2.1)", () => {
  beforeEach(() => {
    mockMatchMedia(true); // mobile by default
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders hamburger button on mobile viewport", () => {
    render(<Nav />);
    const button = screen.getByRole("button", { name: /abrir menú/i });
    expect(button).toBeInTheDocument();
  });

  it("renders Menu icon when drawer is closed", () => {
    render(<Nav />);
    const button = screen.getByRole("button", { name: /abrir menú/i });
    const svg = button.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("does NOT render hamburger button on desktop viewport", () => {
    vi.restoreAllMocks();
    mockMatchMedia(false); // desktop
    render(<Nav />);
    const button = screen.queryByRole("button", { name: /abrir menú/i });
    expect(button).toBeNull();
  });

  it("opens mobile drawer when hamburger is clicked", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const button = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(button);
    // Drawer should be visible now
    const drawer = screen.getByRole("dialog", { name: /navegación/i });
    expect(drawer).toBeInTheDocument();
  });

  it("closes mobile drawer when hamburger is clicked again (toggle)", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const button = screen.getByRole("button", { name: /abrir menú/i });
    // Open
    await user.click(button);
    // Button is now "Cerrar menú"
    const closeButton = screen.getByRole("button", { name: /cerrar menú/i });
    await user.click(closeButton);
    // Drawer should be gone
    const drawer = screen.queryByRole("dialog", { name: /navegación/i });
    expect(drawer).toBeNull();
  });

  it("closes drawer when a nav link is clicked inside the drawer", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const hamburger = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(hamburger);
    // Click a nav link inside the drawer
    const drawer = screen.getByRole("dialog", { name: /navegación/i });
    const serviciosLink = drawer.querySelector('a[href="#services"]');
    expect(serviciosLink).not.toBeNull();
    await user.click(serviciosLink!);
    // Drawer should close
    expect(screen.queryByRole("dialog", { name: /navegación/i })).toBeNull();
  });

  it("has minimum 44x44px touch target on hamburger button", () => {
    render(<Nav />);
    const button = screen.getByRole("button", { name: /abrir menú/i });
    expect(button.className).toMatch(/min-w-\[44px\]/);
    expect(button.className).toMatch(/min-h-\[44px\]/);
  });

  it("toggles correctly on rapid clicks without desync", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const button = screen.getByRole("button", { name: /abrir menú/i });

    // Rapid triple-click: open → close → open → should be OPEN
    await user.click(button);
    await user.click(button);
    await user.click(button);

    const drawer = screen.getByRole("dialog", { name: /navegación/i });
    expect(drawer).toBeInTheDocument();
  });

  it("drawer contains all navigation links", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const button = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(button);

    // All three nav links should be inside the drawer
    const drawer = screen.getByRole("dialog", { name: /navegación/i });
    expect(drawer).toHaveTextContent("Servicios");
    expect(drawer).toHaveTextContent("Brujitips");
    expect(drawer).toHaveTextContent("Agendar");
  });
});

// ============================================================
// Task 2.2 — Focus Trap
// ============================================================

describe("Nav — focus trap (Task 2.2)", () => {
  beforeEach(() => {
    mockMatchMedia(true); // mobile
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("moves focus to first nav link when drawer opens", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const hamburger = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(hamburger);

    // First link inside drawer should receive focus (rAF in React)
    const drawer = screen.getByRole("dialog", { name: /navegación/i });
    const firstLink = drawer.querySelector('a[href="#services"]');
    expect(firstLink).not.toBeNull();
    // rAF runs synchronously in jsdom, so focus should be immediate
    await waitFor(() => {
      expect(document.activeElement).toBe(firstLink);
    });
  });

  it("returns focus to hamburger button when drawer closes via Escape", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const hamburger = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(hamburger);
    // Press Escape
    await user.keyboard("{Escape}");
    // Focus should return to hamburger
    expect(document.activeElement).toBe(hamburger);
  });

  it("returns focus to hamburger button when drawer closes via toggle click", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const hamburger = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(hamburger); // open
    // Now close via toggle
    const closeButton = screen.getByRole("button", { name: /cerrar menú/i });
    await user.click(closeButton);
    // Focus should return to hamburger
    expect(document.activeElement).toBe(hamburger);
  });

  it("closes drawer on Escape key", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const hamburger = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(hamburger);
    // Drawer is open
    expect(screen.getByRole("dialog", { name: /navegación/i })).toBeInTheDocument();
    // Press Escape
    await user.keyboard("{Escape}");
    // Drawer should close
    expect(screen.queryByRole("dialog", { name: /navegación/i })).toBeNull();
  });

  it("drawer has aria-modal attribute when open", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const hamburger = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(hamburger);
    const drawer = screen.getByRole("dialog", { name: /navegación/i });
    expect(drawer).toHaveAttribute("aria-modal", "true");
  });

  it("Tab wraps from last focusable element back to first inside drawer", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const hamburger = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(hamburger);

    // Focus should be on first link after open
    await waitFor(() => {
      const firstLink = screen.getByRole("dialog").querySelector('a[href="#services"]');
      expect(document.activeElement).toBe(firstLink);
    });

    // Get all focusable links in order
    const links = screen.getByRole("dialog").querySelectorAll<HTMLAnchorElement>("a");
    const lastLink = links[links.length - 1]; // "Agendar Sesión"

    // Navigate to the last focusable element
    for (let i = 0; i < links.length - 1; i++) {
      await user.tab();
    }
    expect(document.activeElement).toBe(lastLink);

    // Tab from last should wrap to first
    await user.tab();
    expect(document.activeElement).toBe(links[0]); // "Servicios"
  });

  it("Shift+Tab wraps from first focusable element back to last inside drawer", async () => {
    const user = userEvent.setup();
    render(<Nav />);
    const hamburger = screen.getByRole("button", { name: /abrir menú/i });
    await user.click(hamburger);

    // Focus should be on first link after open
    const links = screen.getByRole("dialog").querySelectorAll<HTMLAnchorElement>("a");
    await waitFor(() => {
      expect(document.activeElement).toBe(links[0]);
    });

    // Shift+Tab from first should wrap to last
    await user.tab({ shift: true });
    const lastLink = links[links.length - 1];
    expect(document.activeElement).toBe(lastLink);
  });
});
