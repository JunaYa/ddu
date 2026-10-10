import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextShimmer } from "./text-shimmer.tsx";

const meta = {
  title: "Animated/TextShimmer",
  component: TextShimmer,
  argTypes: {
    children: { control: "text" },
    duration: { control: { type: "number", min: 0.5, max: 6, step: 0.1 } },
    spread: { control: { type: "number", min: 1, max: 10, step: 0.5 } },
  },
  parameters: {
    layout: "centered",
    backgrounds: { default: "light" },
  },
} satisfies Meta<typeof TextShimmer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Thinking…" },
};

export const TitleCase: Story = {
  args: { children: "Graph Main Agent" },
};

export const Long: Story = {
  args: { children: "Generating a deeply considered response for the user" },
};

export const Short: Story = {
  args: { children: "Save" },
};

export const SlowSweep: Story = {
  args: { children: "Reading slowly", duration: 4 },
};

export const FastSweep: Story = {
  args: { children: "Reading quickly", duration: 1 },
};

export const WideSpread: Story = {
  args: { children: "Wide highlight", spread: 6 },
};

export const NarrowSpread: Story = {
  args: { children: "Narrow highlight", spread: 1 },
};

export const InContext: Story = {
  args: { children: "" },
  render: () => (
    <div className="flex flex-col gap-4 p-8">
      <p className="text-muted-foreground text-sm">
        Inline within text: <TextShimmer>streaming response</TextShimmer> incoming.
      </p>
      <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2">
        <span className="text-muted-foreground text-xs">Agent state:</span>
        <TextShimmer className="font-medium text-xs" spread={3}>
          Graph Main Agent
        </TextShimmer>
      </div>
    </div>
  ),
};

export const ReducedMotion: Story = {
  args: { children: "Animation disabled by user preference" },
  parameters: {
    docs: {
      description: {
        story:
          'Toggle "Reduced motion" in Storybook\'s a11y addon (or in your OS settings) to verify the shimmer falls back to flat muted text with no sweep.',
      },
    },
  },
};
