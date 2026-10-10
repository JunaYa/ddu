import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "./separator.tsx";

const meta = {
  title: "UI/Separator",
  component: Separator,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof Separator>;

export const Horizontal: Story = {
  render: () => (
    <div className="w-80">
      <div className="space-y-1">
        <h4 className="font-medium text-sm leading-none">Radix Primitives</h4>
        <p className="text-muted-foreground text-sm">An open-source UI component library.</p>
      </div>
      <Separator className="my-4" />
      <div className="flex h-5 items-center gap-4 text-sm">
        <span>Blog</span>
        <Separator orientation="vertical" />
        <span>Docs</span>
        <Separator orientation="vertical" />
        <span>Source</span>
      </div>
    </div>
  ),
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center gap-4">
      <span className="text-sm">Item 1</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Item 2</span>
      <Separator orientation="vertical" />
      <span className="text-sm">Item 3</span>
    </div>
  ),
};

export const Gradient: Story = {
  render: () => (
    <div className="w-80 space-y-6">
      <Separator variant="gradient" />
      <div className="flex h-12 items-center gap-4">
        <span className="text-sm">Left</span>
        <Separator orientation="vertical" variant="gradient" />
        <span className="text-sm">Right</span>
      </div>
    </div>
  ),
};
