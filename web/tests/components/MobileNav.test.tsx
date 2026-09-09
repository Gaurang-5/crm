import { expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { MobileNav } from "../../src/components/layout/MobileNav";

it("keeps phone navigation simple and reveals every tool under More", () => {
  const onOpen = vi.fn();
  const { rerender } = render(
    <MemoryRouter initialEntries={["/crm"]}>
      <MobileNav open={false} coach={{ name: "Deepa", email: "d@example.com" }} onClose={() => {}} onOpen={onOpen} onLogout={() => {}} />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "People" })).toBeInTheDocument();
  expect(screen.getByRole("link", { name: "Activity" })).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "More" }));
  expect(onOpen).toHaveBeenCalledOnce();

  rerender(
    <MemoryRouter initialEntries={["/crm"]}>
      <MobileNav open coach={{ name: "Deepa", email: "d@example.com" }} onClose={() => {}} onOpen={onOpen} onLogout={() => {}} />
    </MemoryRouter>,
  );
  expect(screen.getByRole("link", { name: "Body Analysis" })).toHaveAttribute("href", "/crm/analyses");
  expect(screen.getByRole("link", { name: "Home Visits" })).toHaveAttribute("href", "/crm/homevisit");
  expect(screen.getByRole("link", { name: "Zoom Invitations" })).toHaveAttribute("href", "/crm/meetings");
  expect(screen.getByRole("link", { name: "Money" })).toHaveAttribute("href", "/crm/revenue");
});
