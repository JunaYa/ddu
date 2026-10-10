import { renderToString } from "react-dom/server";
import { expect, test } from "vite-plus/test";
import { DemoCard } from "../src/index.ts";

test("DemoCard renders the message and platform", () => {
  const html = renderToString(<DemoCard message="hi there" platform="web" />);
  expect(html).toContain("hi there");
  expect(html).toContain("web");
});

test("DemoCard renders its container even with an empty message", () => {
  const html = renderToString(<DemoCard message="" platform="web" />);
  expect(html).toContain("pi-demo-card");
});
