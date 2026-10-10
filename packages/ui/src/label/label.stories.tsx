import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "../input/input.tsx";
import { Label } from "./label.tsx";

const meta = {
  title: "UI/Label",
  component: Label,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
  render: () => <Label>Email address</Label>,
};

export const WithInput: Story = {
  name: "With Input",
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="email">Email</Label>
      <Input id="email" placeholder="you@example.com" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80 space-y-2" data-disabled="true">
      <Label>Disabled label</Label>
      <Input disabled placeholder="Disabled" />
    </div>
  ),
};
