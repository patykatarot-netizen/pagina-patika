/**
 * Smoke test to verify jsdom + @testing-library/react bootstrapping.
 *
 * This test MUST fail until jsdom is configured as the vitest environment
 * and @testing-library packages are installed. A passing test proves
 * that React components can be rendered and queried in tests.
 */
import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

function Hello() {
  return <h1>Hello, jsdom!</h1>;
}

describe("Test environment bootstrap", () => {
  it("renders a React component with jsdom", () => {
    render(<Hello />);
    expect(screen.getByText("Hello, jsdom!")).toBeInTheDocument();
  });
});
