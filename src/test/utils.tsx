import type { ReactElement } from "react";
import { render, type RenderOptions } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

// Custom render function (can add providers here if needed)
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return {
    user: userEvent.setup(),
    ...render(ui, { ...options }),
  };
}

// Re-export everything from testing-library
export * from "@testing-library/react";
export { userEvent };
