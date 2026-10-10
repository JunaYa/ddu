import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "../label/label.tsx";
import { Textarea } from "./textarea.tsx";

const meta = {
  title: "UI/Textarea",
  component: Textarea,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Textarea>;

export default meta;
type Story = StoryObj<typeof Textarea>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Textarea placeholder="Type your message here." />
    </div>
  ),
};

export const WithLabel: Story = {
  name: "With Label",
  render: () => (
    <div className="w-80 space-y-2">
      <Label htmlFor="message">Your message</Label>
      <Textarea id="message" placeholder="Type your message here." />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="w-80">
      <Textarea disabled placeholder="Disabled textarea" />
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Textarea placeholder="Small" size="sm" />
      <Textarea placeholder="Default" size="default" />
      <Textarea placeholder="Large" size="lg" />
    </div>
  ),
};
