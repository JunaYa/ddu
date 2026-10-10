import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Underline } from "lucide-react";
import { Toggle, ToggleGroup } from "./toggle-group.tsx";

const meta = {
  title: "UI/Toggle Group",
  component: ToggleGroup,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ToggleGroup>;

export default meta;
type Story = StoryObj<typeof ToggleGroup>;

export const Default: Story = {
  render: () => (
    <ToggleGroup multiple>
      <Toggle aria-label="Toggle bold" value="bold">
        <Bold className="size-4" />
      </Toggle>
      <Toggle aria-label="Toggle italic" value="italic">
        <Italic className="size-4" />
      </Toggle>
      <Toggle aria-label="Toggle underline" value="underline">
        <Underline className="size-4" />
      </Toggle>
    </ToggleGroup>
  ),
};

export const Single: Story = {
  render: () => (
    <ToggleGroup defaultValue={["left"]}>
      <Toggle aria-label="Align left" value="left">
        <AlignLeft className="size-4" />
      </Toggle>
      <Toggle aria-label="Align center" value="center">
        <AlignCenter className="size-4" />
      </Toggle>
      <Toggle aria-label="Align right" value="right">
        <AlignRight className="size-4" />
      </Toggle>
    </ToggleGroup>
  ),
};

export const Outline: Story = {
  render: () => (
    <ToggleGroup multiple variant="outline">
      <Toggle aria-label="Toggle bold" value="bold">
        <Bold className="size-4" />
      </Toggle>
      <Toggle aria-label="Toggle italic" value="italic">
        <Italic className="size-4" />
      </Toggle>
      <Toggle aria-label="Toggle underline" value="underline">
        <Underline className="size-4" />
      </Toggle>
    </ToggleGroup>
  ),
};
