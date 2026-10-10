import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  viteFinal: async (config) => {
    const { default: tailwindcss } = await import("@tailwindcss/vite");
    return { ...config, plugins: [...(config.plugins ?? []), tailwindcss()] };
  },
  stories: ["../src/**/*.stories.@(ts|tsx)", "../../iconography/src/**/*.stories.@(ts|tsx)"],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
};

export default config;
