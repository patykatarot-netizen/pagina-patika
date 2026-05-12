/**
 * Tests for MobileCTA component — Phase 3 (Mobile CTA)
 *
 * TDD cycles:
 *   3.1 — Sticky "Agendar" button visible on mobile, hidden on desktop
 *   3.2 — IntersectionObserver hide near footer + scroll to #booking
 */
import React from "react";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";

// ============================================================
// Mock helpers
// ============================================================

/** Mock matchMedia for a specific viewport. */
function mockMatchMedia(matches: boolean) {
  const listeners = new Set<(e: MediaQueryListEvent) => void>();
  const mql = {
    matches,
    media: "(max-width: 767px)",
    addEventListener: vi.fn(
      (_type: string, fn: (e: MediaQueryListEvent) => void) => {
        listeners.add(fn);
      },
    ),
    removeEventListener: vi.fn(
      (_type: string, fn: (e: MediaQueryListEvent) => void) => {
        listeners.delete(fn);
      },
    ),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    onchange: null,
  } as unknown as MediaQueryList;

  vi.spyOn(window, "matchMedia").mockReturnValue(mql);
  return { mql, listeners };
}

/** Create a stub IntersectionObserver that fires a callback immediately. */
function mockIntersectionObserver(isIntersecting: boolean) {
  let callback: IntersectionObserverCallback | null = null;

  const observer = vi.fn((cb: IntersectionObserverCallback) => {
    callback = cb;
    return {
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
      takeRecords: vi.fn(() => []),
    };
  }) as unknown as {
    mock: {
      calls: Array<[IntersectionObserverCallback, IntersectionObserverInit?]>;
    };
  } & typeof IntersectionObserver;

  vi.stubGlobal("IntersectionObserver", observer);

  return {
    /** Simulate the observer firing with given entries. */
    fireEntries: (entries: Partial<IntersectionObserverEntry>[]) => {
      if (callback) {
        callback(
          entries.map(
            (e) =>
              ({
                isIntersecting: e.isIntersecting ?? false,
                target: e.target ?? document.createElement("div"),
                intersectionRatio: e.intersectionRatio ?? 0,
                boundingClientRect: {} as DOMRectReadOnly,
                intersectionRect: {} as DOMRectReadOnly,
                rootBounds: null,
                time: 0,
              }) as IntersectionObserverEntry,
          ),
          {} as IntersectionObserver,
        );
      }
    },
  };
}

// ============================================================
// Import after mocks are set up
// ============================================================
import MobileCTA from "./MobileCTA";

// ============================================================
// Task 3.1 — Sticky Mobile CTA Button visible on mobile
// ============================================================

describe("MobileCTA — mobile visibility (Task 3.1)", () => {
  beforeEach(() => {
    mockMatchMedia(true); // mobile by default
    mockIntersectionObserver(false); // footer NOT intersecting
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("renders the 'Agendar' button on mobile viewport (<768px)", () => {
    render(<MobileCTA />);
    const button = screen.getByRole("link", { name: /agendar/i });
    expect(button).toBeInTheDocument();
  });

  it("does NOT render the button on desktop viewport (>=768px)", () => {
    vi.restoreAllMocks();
    cleanup();
    mockMatchMedia(false); // desktop
    mockIntersectionObserver(false);

    render(<MobileCTA />);
    const button = screen.queryByRole("link", { name: /agendar/i });
    expect(button).toBeNull();
  });

  it("button links to #booking section", () => {
    render(<MobileCTA />);
    const link = screen.getByRole("link", { name: /agendar/i });
    expect(link).toHaveAttribute("href", "#booking");
  });

  it("button has minimum 44x44px touch target", () => {
    render(<MobileCTA />);
    const link = screen.getByRole("link", { name: /agendar/i });
    // Check that minimum height is at least 44px via class
    expect(link.className).toMatch(/min-h-\[44px\]/);
  });

  it("button uses liquid-glass styling", () => {
    render(<MobileCTA />);
    const link = screen.getByRole("link", { name: /agendar/i });
    expect(link.className).toContain("liquid-glass");
  });

  it("button container respects safe-area-inset-bottom", () => {
    render(<MobileCTA />);
    const link = screen.getByRole("link", { name: /agendar/i });
    // The outer wrapper div has the safe-area padding class
    const outerWrapper = link.parentElement?.parentElement;
    expect(outerWrapper).not.toBeNull();
    expect(outerWrapper!.className).toContain(
      "pb-[env(safe-area-inset-bottom,16px)]",
    );
  });

  it("renders a decorative icon alongside the text", () => {
    render(<MobileCTA />);
    const link = screen.getByRole("link", { name: /agendar/i });
    const svg = link.querySelector("svg");
    expect(svg).not.toBeNull();
  });

  it("button has visible text 'Agendar'", () => {
    render(<MobileCTA />);
    const link = screen.getByRole("link", { name: /agendar/i });
    expect(link).toHaveTextContent("Agendar");
  });
});

// ============================================================
// Task 3.2 — Scroll to booking + hide near footer + drawer event
// ============================================================

describe("MobileCTA — interactions (Task 3.2)", () => {
  beforeEach(() => {
    mockMatchMedia(true); // mobile
    mockIntersectionObserver(false); // footer NOT intersecting
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it("dispatches patyka:close-drawer custom event when clicked", () => {
    render(<MobileCTA />);

    // Listen for custom event on the document
    const handler = vi.fn();
    document.addEventListener("patyka:close-drawer", handler);

    const link = screen.getByRole("link", { name: /agendar/i });
    fireEvent.click(link);

    expect(handler).toHaveBeenCalledTimes(1);
    document.removeEventListener("patyka:close-drawer", handler);
  });

  it("hides button when footer becomes visible via IntersectionObserver", async () => {
    // Add a <footer> element to the DOM so querySelector finds it
    const footerEl = document.createElement("footer");
    document.body.appendChild(footerEl);

    // Set up observer that will fire with isIntersecting=true (footer visible)
    let observerCallback: IntersectionObserverCallback | null = null;
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn((cb: IntersectionObserverCallback) => {
        observerCallback = cb;
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          takeRecords: vi.fn(() => []),
        };
      }),
    );

    render(<MobileCTA />);

    // Button should be visible initially.
    let link = screen.queryByRole("link", { name: /agendar/i });
    expect(link).toBeInTheDocument();
    // The outer wrapper (link.parentElement.parentElement) should not have translate-y-full class.
    const outerWrapper = link!.parentElement!.parentElement!;
    expect(outerWrapper.className).not.toContain("translate-y-full");

    // Simulate footer intersecting
    if (observerCallback) {
      observerCallback(
        [
          {
            isIntersecting: true,
            target: footerEl,
            intersectionRatio: 0.1,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    }

    // After re-render, the outer wrapper should have translate-y-full
    await waitFor(() => {
      const updatedLink = screen.queryByRole("link", { name: /agendar/i });
      expect(updatedLink).toBeInTheDocument(); // still in DOM
      const outerAfter = updatedLink!.parentElement!.parentElement!;
      expect(outerAfter.className).toContain("translate-y-full");
    });

    // Cleanup
    document.body.removeChild(footerEl);
  });

  it("shows button again when footer is no longer visible", async () => {
    // Add a <footer> element to the DOM
    const footerEl = document.createElement("footer");
    document.body.appendChild(footerEl);

    let observerCallback: IntersectionObserverCallback | null = null;
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn((cb: IntersectionObserverCallback) => {
        observerCallback = cb;
        return {
          observe: vi.fn(),
          unobserve: vi.fn(),
          disconnect: vi.fn(),
          takeRecords: vi.fn(() => []),
        };
      }),
    );

    render(<MobileCTA />);

    // First, hide it
    if (observerCallback) {
      observerCallback(
        [
          {
            isIntersecting: true,
            target: footerEl,
            intersectionRatio: 0.1,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    }

    // Then show it again (footer leaves viewport)
    if (observerCallback) {
      observerCallback(
        [
          {
            isIntersecting: false,
            target: footerEl,
            intersectionRatio: 0,
            boundingClientRect: {} as DOMRectReadOnly,
            intersectionRect: {} as DOMRectReadOnly,
            rootBounds: null,
            time: 0,
          } as IntersectionObserverEntry,
        ],
        {} as IntersectionObserver,
      );
    }

    await waitFor(() => {
      const link = screen.queryByRole("link", { name: /agendar/i });
      expect(link).toBeInTheDocument();
      const outerWrapper = link!.parentElement!.parentElement!;
      expect(outerWrapper.className).not.toContain("translate-y-full");
    });

    // Cleanup
    document.body.removeChild(footerEl);
  });

  it("does NOT render anything on desktop even when footer is intersecting", () => {
    vi.restoreAllMocks();
    cleanup();
    mockMatchMedia(false); // desktop
    mockIntersectionObserver(true); // footer IS intersecting

    render(<MobileCTA />);
    const button = screen.queryByRole("link", { name: /agendar/i });
    expect(button).toBeNull();
  });
});
