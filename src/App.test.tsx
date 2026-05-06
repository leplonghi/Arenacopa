import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("App", () => {
  it("renders without crashing", () => {
    // This is a dummy test to ensure Vitest is configured correctly
    render(<App />);
    expect(document.body).toBeInTheDocument();
  });
});
