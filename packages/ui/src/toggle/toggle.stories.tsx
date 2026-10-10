import type { Meta, StoryObj } from "@storybook/react-vite";
import { Bold, Italic, Underline } from "lucide-react";
import { Toggle } from "./toggle.tsx";

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold">
      <Bold className="size-4" />
    </Toggle>
  ),
};

export const WithText: Story = {
  name: "With Text",
  render: () => (
    <Toggle aria-label="Toggle italic">
      <Italic className="size-4" />
      Italic
    </Toggle>
  ),
};

export const Outline: Story = {
  render: () => (
    <Toggle aria-label="Toggle underline" variant="outline">
      <Underline className="size-4" />
    </Toggle>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-2">
      <Toggle aria-label="Small" size="sm">
        <Bold className="size-4" />
      </Toggle>
      <Toggle aria-label="Default" size="default">
        <Bold className="size-4" />
      </Toggle>
      <Toggle aria-label="Large" size="lg">
        <Bold className="size-4" />
      </Toggle>
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Toggle aria-label="Toggle bold" disabled>
      <Bold className="size-4" />
    </Toggle>
  ),
};
