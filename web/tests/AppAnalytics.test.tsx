import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

vi.mock("@vercel/analytics/react", () => ({
  Analytics: () => <span data-testid="vercel-analytics" />,
}));

import { App } from "../src/App";

it("loads Vercel Analytics once at the application root", () => {
  render(<MemoryRouter initialEntries={["/join"]}><App /></MemoryRouter>);
  expect(screen.getAllByTestId("vercel-analytics")).toHaveLength(1);
});
