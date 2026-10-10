import type { Meta, StoryObj } from "@storybook/react-vite";
import { AnimatedBorder } from "./animated-border.tsx";

const meta = {
  title: "UI/Animated Border",
  component: AnimatedBorder,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      options: ["dash", "solid"],
    },
    borderWidth: { control: { type: "range", min: 1, max: 4, step: 0.5 } },
    duration: { control: { type: "range", min: 0.5, max: 6, step: 0.5 } },
  },
  decorators: [
    (Story) => (
      <div className="relative flex h-32 w-64 items-center justify-center rounded-xl">
        <Story />
        <span className="text-muted-foreground text-sm">Content</span>
      </div>
    ),
  ],
} satisfies Meta<typeof AnimatedBorder>;

export default meta;
type Story = StoryObj<typeof AnimatedBorder>;

export const Dash: Story = {
  args: {
    variant: "dash",
    shineColor: "var(--primary)",
    borderWidth: 1,
    duration: 2,
  },
};

export const Solid: Story = {
  args: {
    variant: "solid",
    shineColor: "var(--primary)",
    borderWidth: 1,
    duration: 2,
  },
};

export const MultiColor: Story = {
  name: "Multi-Color Gradient",
  args: {
    variant: "solid",
    shineColor: ["#6366f1", "#ec4899", "#f59e0b"],
    borderWidth: 1.5,
    duration: 3,
  },
};

export const ThickBorder: Story = {
  name: "Thick Border",
  args: {
    variant: "dash",
    shineColor: ["var(--primary)", "transparent"],
    borderWidth: 2,
    duration: 2,
  },
};

export const Variants: Story = {
  name: "All Variants",
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="relative flex h-24 w-64 items-center justify-center rounded-xl">
        <AnimatedBorder shineColor="var(--primary)" variant="dash" />
        <span className="text-muted-foreground text-sm">Dash</span>
      </div>
      <div className="relative flex h-24 w-64 items-center justify-center rounded-xl">
        <AnimatedBorder shineColor="var(--primary)" variant="solid" />
        <span className="text-muted-foreground text-sm">Solid</span>
      </div>
      <div className="relative flex h-24 w-64 items-center justify-center rounded-xl">
        <AnimatedBorder
          borderWidth={1.5}
          duration={3}
          shineColor={["#6366f1", "#ec4899", "#f59e0b"]}
          variant="solid"
        />
        <span className="text-muted-foreground text-sm">Multi-color</span>
      </div>
    </div>
  ),
};
