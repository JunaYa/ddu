import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vite-plus/test";

import { TextTicker } from "./text-ticker.tsx";

describe("TextTicker", () => {
  it("renders marquee content with a duplicated aria-hidden copy for continuous scrolling", () => {
    render(
      <TextTicker animationType="marquee" marqueeDelay={300} marqueeSpeed={40}>
        A very long title that should scroll across the available width
      </TextTicker>,
    );

    const ticker = screen.getByTestId("text-ticker");
    const copies = screen.getAllByText(
      "A very long title that should scroll across the available width",
    );

    expect(ticker).toHaveStyle({
      "--marquee-delay": "300ms",
      "--marquee-duration": "40s",
    });
    expect(ticker).toHaveClass("pi-text-ticker-mask-x");
    expect(copies).toHaveLength(2);
    expect(copies[1]).toHaveAttribute("aria-hidden", "true");
    expect(copies[0]).toHaveClass("pi-text-ticker-marquee");
  });
});
