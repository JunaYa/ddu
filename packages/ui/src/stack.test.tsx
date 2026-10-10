import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";
import StackDefault, { Stack } from "./stack.tsx";

interface Card {
  id: string;
  label: string;
}

const cards: Card[] = [
  { id: "alpha", label: "Alpha" },
  { id: "beta", label: "Beta" },
  { id: "gamma", label: "Gamma" },
];

// Assert the card wrapper exists before clicking — a null `closest` would
// otherwise surface as a confusing runtime cast error if the markup changes.
function clickStackCard(label: string) {
  const card = screen.getByText(label).closest('[data-slot="stack-card"]');
  expect(card).not.toBeNull();
  fireEvent.click(card as HTMLElement);
}

describe("Stack", () => {
  it("exports the default Stack component", () => {
    expect(StackDefault).toBe(Stack);
  });

  it("renders the active card with peeking inactive cards", () => {
    render(
      <Stack
        getKey={(card) => card.id}
        items={cards}
        renderCard={(card, state) => (
          <span>
            {state.active ? "active" : "behind"} {card.label}
          </span>
        )}
        visibleCount={2}
      />,
    );

    expect(screen.getByText("active Alpha")).toBeInTheDocument();
    expect(screen.getByText("behind Gamma")).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByText("active Alpha").closest('[data-slot="stack-card"]') as HTMLElement,
      { key: "Enter" },
    );
    expect(screen.getByText("active Gamma")).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByText("active Gamma").closest('[data-slot="stack-card"]') as HTMLElement,
      { key: "Enter" },
    );
    expect(screen.getByText("active Beta")).toBeInTheDocument();
  });

  it("supports controlled index state", () => {
    render(
      <Stack
        getKey={(card) => card.id}
        index={1}
        items={cards}
        renderCard={(card, state) => (
          <span>
            {state.active ? "active" : "behind"} {card.label}
          </span>
        )}
      />,
    );

    expect(screen.getByText("active Beta")).toBeInTheDocument();
  });

  it("loops by moving the active card to the back of the pile", () => {
    render(
      <Stack
        getKey={(card) => card.id}
        items={cards}
        renderCard={(card, state) => (
          <span>
            {state.active ? "active" : "behind"} {card.label}
          </span>
        )}
        sendToBackOnClick
      />,
    );

    clickStackCard("active Alpha");
    expect(screen.getByText("active Gamma")).toBeInTheDocument();

    clickStackCard("active Gamma");
    expect(screen.getByText("active Beta")).toBeInTheDocument();

    clickStackCard("active Beta");
    expect(screen.getByText("active Alpha")).toBeInTheDocument();
  });

  it("supports keyboard activation with the default drag-enabled card", () => {
    render(
      <Stack
        getKey={(card) => card.id}
        items={cards}
        renderCard={(card, state) => (
          <span>
            {state.active ? "active" : "behind"} {card.label}
          </span>
        )}
      />,
    );

    const card = screen.getByText("active Alpha").closest('[data-slot="stack-card"]');
    expect(card).toHaveAttribute("role", "button");
    expect(card).toHaveAttribute("tabindex", "0");

    fireEvent.keyDown(card as HTMLElement, { key: "Enter" });
    expect(screen.getByText("active Gamma")).toBeInTheDocument();

    fireEvent.keyDown(
      screen.getByText("active Gamma").closest('[data-slot="stack-card"]') as HTMLElement,
      {
        key: " ",
      },
    );
    expect(screen.getByText("active Beta")).toBeInTheDocument();
  });

  it("renders empty content for exhausted finite stacks", () => {
    const { rerender } = render(
      <Stack
        empty={<span>All done</span>}
        getKey={(card) => card.id}
        index={cards.length}
        items={cards}
        mode="finite"
        renderCard={(card) => <span>{card.label}</span>}
      />,
    );

    expect(screen.getByText("All done")).toBeInTheDocument();

    rerender(
      <Stack
        empty={<span>All done</span>}
        getKey={(card) => card.id}
        index={0}
        items={cards}
        mode="finite"
        renderCard={(card) => <span>{card.label}</span>}
      />,
    );

    expect(screen.getByText("Alpha")).toBeInTheDocument();
  });

  it("supports simple card nodes", () => {
    render(<Stack cards={[<span key="one">One</span>, <span key="two">Two</span>]} />);

    expect(screen.getByText("One")).toBeInTheDocument();
    expect(screen.getByText("Two")).toBeInTheDocument();
  });

  it("starts finite card-node stacks at the first card", () => {
    render(
      <Stack cards={[<span key="one">One</span>, <span key="two">Two</span>]} mode="finite" />,
    );

    expect(screen.getByText("One").closest('[data-active="true"]')).not.toBeNull();
  });
});
