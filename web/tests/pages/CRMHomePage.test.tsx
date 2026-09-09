import { expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CRMHomePage } from "../../src/pages/CRMHomePage";

it("puts the three everyday coach tasks first", () => {
  render(<MemoryRouter><CRMHomePage /></MemoryRouter>);
  expect(screen.getByRole("link", { name: /Start body analysis/i })).toHaveAttribute("href", "/crm/analyses");
  expect(screen.getByRole("link", { name: /Plan a home visit/i })).toHaveAttribute("href", "/crm/homevisit");
  expect(screen.getByRole("link", { name: /Create Zoom invitation/i })).toHaveAttribute("href", "/crm/meetings");
  expect(screen.getByText("What would you like to do today?")).toBeInTheDocument();
});
