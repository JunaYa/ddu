import { createElement } from "react";
import "./preview.css";
import type { Preview } from "@storybook/react-vite";

const preview: Preview = {
  initialGlobals: { theme: "light" },
  globalTypes: {
    theme: {
      description: "Color theme",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      document.documentElement.classList.toggle("dark", context.globals.theme === "dark");
      return createElement(Story);
    },
  ],
  parameters: {
    controls: { matchers: { color: /(background|color)$/i, date: /Date$/i } },
  },
};

export default preview;
