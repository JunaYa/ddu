import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import { Button, buttonVariants } from "./button.tsx";

/**
 * Render-smoke + characterization for the migrated @ddu/ui Button (AE2).
 * Guards that moving Button out of the app into the shared package preserves its
 * styling hooks, default variant/size, the data-slot contract, and accessibility.
 */
describe("@ddu/ui Button", () => {
  it("renders an accessible button exposing the data-slot hook", () => {
    render(<Button>Save</Button>);
    const button = screen.getByRole("button", { name: "Save" });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute("data-slot", "button");
  });

  it("applies the default variant and size styling hooks", () => {
    render(<Button>Save</Button>);
    const { className } = screen.getByRole("button", { name: "Save" });
    expect(className).toContain("bg-foreground"); // default variant
    expect(className).toContain("min-w-16"); // default size
    expect(className).toContain("gap-1.5"); // icon spacing handled via gap, not margins
  });

  it("merges a non-default variant/size and preserves a custom className", () => {
    render(
      <Button className="custom-marker" size="lg" variant="primary-rich">
        Go
      </Button>,
    );
    const { className } = screen.getByRole("button", { name: "Go" });
    expect(className).toContain("custom-marker");
    expect(className).toContain("border-primary/40"); // primary-rich hook survives cn()
  });

  it("exports buttonVariants as a composable class builder", () => {
    expect(buttonVariants({ variant: "ghost" })).toContain("hover:bg-accent");
  });

  it("supports tile sizing with normal visual variants", () => {
    render(
      <Button size="tile" variant="outline">
        <svg aria-hidden="true" />
        Create note
      </Button>,
    );
    const { className } = screen.getByRole("button", { name: "Create note" });
    expect(className).toContain("flex-col");
    expect(className).toContain("h-24");
    expect(className).toContain("w-24");
    expect(className).toContain("border-border");
  });
});
