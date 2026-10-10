import type { Meta, StoryObj } from "@storybook/react-vite";
import { Info, Lightbulb, Search, Sparkles } from "lucide-react";
import { IconLabel } from "./icon-label.tsx";

const meta = {
  title: "UI/IconLabel",
  component: IconLabel,
  parameters: {
    layout: "centered",
    docs: {
      description: {
        component:
          "Compact icon + label row extracted from the agent chat refactor. Replaces AlertBanner (info variant) for waiting tips — the blue border/background/icon made friendly tips look like warnings. Shared across shimmer indicators, thinking blocks, and tips for consistent icon-to-text alignment via a fixed size-4 icon slot.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof IconLabel>;

export default meta;
type Story = StoryObj<typeof IconLabel>;

export const Default: Story = {
  args: {
    icon: <Search className="size-3 text-muted-foreground" />,
    children: <span className="text-muted-foreground text-xs">Searching notes…</span>,
  },
};

export const WithDismiss: Story = {
  name: "With dismiss",
  args: {
    icon: <Lightbulb className="size-3 text-muted-foreground" />,
    children: (
      <span className="text-muted-foreground text-xs">
        Attach notes or collections to give Pi sharper context.
      </span>
    ),
    dismissLabel: "Dismiss tip",
    onDismiss: () => {},
  },
};

export const InfoVariant: Story = {
  name: "Info style",
  args: {
    icon: <Info className="size-3 text-info" />,
    children: <span className="text-info text-xs">3 notes matched your query.</span>,
  },
};

export const LongText: Story = {
  name: "Long text wrapping",
  args: {
    icon: <Sparkles className="size-3 text-muted-foreground" />,
    children: (
      <span className="text-muted-foreground text-xs">
        Paste a supercalifragilisticexpialidocious URL into chat and Pi will read it, summarize it,
        and attach the result to your conversation history for later reference.
      </span>
    ),
    dismissLabel: "Dismiss",
    onDismiss: () => {},
  },
};
