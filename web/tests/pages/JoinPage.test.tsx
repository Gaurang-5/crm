import { beforeEach, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { JoinPage } from "../../src/pages/JoinPage";
import { apiRequest } from "../../src/api/client";
vi.mock("../../src/api/client", () => ({ apiRequest: vi.fn() }));
beforeEach(() => {
  vi.clearAllMocks();
  sessionStorage.clear();
  localStorage.clear();
});
it("asks for details only after Join Zoom and autosaves incomplete input", async () => {
  vi.mocked(apiRequest).mockImplementation(async (url) =>
    url.endsWith("/status")
      ? { available: true }
      : url.endsWith("/visits")
        ? { registered: false, draft_revision: 0 }
        : {},
  );
  render(<JoinPage />);
  expect(screen.queryByLabelText("Full name")).toBeNull();
  await waitFor(() =>
    expect(screen.getByRole("button", { name: /Join Zoom/ })).toBeEnabled(),
  );
  fireEvent.click(screen.getByRole("button", { name: /Join Zoom/ }));
  await screen.findByLabelText("Full name");
  fireEvent.change(screen.getByLabelText("Full name"), {
    target: { value: "Partial visitor" },
  });
  await waitFor(() =>
    expect(apiRequest).toHaveBeenCalledWith(
      expect.stringMatching(/\/draft$/),
      expect.objectContaining({
        method: "PATCH",
        body: expect.stringContaining("Partial visitor"),
      }),
    ),
  );
  expect(
    screen.queryByRole("button", { name: /Open Zoom Meeting/ }),
  ).toBeNull();
  fireEvent.change(screen.getByLabelText("Phone / WhatsApp number"), {
    target: { value: "9876543210" },
  });
  fireEvent.click(screen.getByRole("button", { name: /Continue to session/ }));
  expect(
    await screen.findByRole("button", { name: /Open Zoom Meeting/ }),
  ).toBeEnabled();
  expect(apiRequest).toHaveBeenCalledWith(
    expect.stringMatching(/\/register$/),
    expect.objectContaining({
      body: JSON.stringify({ name: "Partial visitor", phone: "9876543210" }),
    }),
  );
});
it("keeps the invitation disabled when no Zoom destination is active", async () => {
  vi.mocked(apiRequest).mockImplementation(async (url) =>
    url.endsWith("/status")
      ? { available: false }
      : { registered: false, draft_revision: 0 },
  );
  render(<JoinPage />);
  await screen.findByText("The next session link is on its way");
  expect(screen.getByRole("button", { name: /Join Zoom/ })).toBeDisabled();
});
