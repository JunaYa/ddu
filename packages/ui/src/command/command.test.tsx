import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { Command, CommandInput } from "./command.tsx";

/**
 * The loading affordance the ⌘K palette drives from its in-flight search
 * (PI-1385). `CommandInput` has to render the spinner *and* the non-visual
 * half of it — the start-addon slot is `aria-hidden`, so a spinner on its own
 * is invisible to assistive tech.
 */
function renderInput(props: React.ComponentProps<typeof CommandInput> = {}) {
  return render(
    <Command items={[]}>
      <CommandInput placeholder="Search…" {...props} />
    </Command>,
  );
}

function startAddon(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-slot="autocomplete-start-addon"]');
}

describe("@ddu/ui CommandInput loading state", () => {
  it("renders the search glyph and reports idle by default", () => {
    const { container } = renderInput();

    expect(screen.getByPlaceholderText("Search…")).toHaveAttribute("aria-busy", "false");
    expect(startAddon(container)?.querySelector(".animate-spin")).toBeNull();
    expect(startAddon(container)?.querySelector("svg")).toBeInTheDocument();
  });

  it("swaps the glyph for a spinner and marks the input busy while loading", () => {
    const { container } = renderInput({ loading: true });

    expect(screen.getByPlaceholderText("Search…")).toHaveAttribute("aria-busy", "true");
    // Same fixed addon slot, so the swap costs no layout shift.
    expect(startAddon(container)?.querySelector(".motion-safe\\:animate-spin")).toBeInTheDocument();
  });

  it("announces the injected label through a live region while loading", () => {
    renderInput({ loading: true, loadingLabel: "Searching…" });

    expect(screen.getByRole("status")).toHaveTextContent("Searching…");
  });

  it("keeps the live region mounted but silent when idle", () => {
    renderInput({ loading: false, loadingLabel: "Searching…" });

    // Mounted-then-filled announces reliably; mounted-with-text does not.
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("omits the live region entirely when no label is supplied", () => {
    renderInput({ loading: true });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("restores the search glyph when loading clears", () => {
    const { container, rerender } = render(
      <Command items={[]}>
        <CommandInput loading loadingLabel="Searching…" placeholder="Search…" />
      </Command>,
    );
    expect(startAddon(container)?.querySelector(".motion-safe\\:animate-spin")).toBeInTheDocument();

    rerender(
      <Command items={[]}>
        <CommandInput loading={false} loadingLabel="Searching…" placeholder="Search…" />
      </Command>,
    );

    expect(startAddon(container)?.querySelector(".motion-safe\\:animate-spin")).toBeNull();
    expect(screen.getByPlaceholderText("Search…")).toHaveAttribute("aria-busy", "false");
  });
});
