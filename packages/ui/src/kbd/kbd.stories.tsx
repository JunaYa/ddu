import type { Meta, StoryObj } from "@storybook/react-vite";
import { Kbd, KbdGroup } from "./kbd.tsx";

const meta = {
  title: "UI/Kbd",
  component: Kbd,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Kbd>;

export default meta;
type Story = StoryObj<typeof Kbd>;

export const Single: Story = {
  render: () => <Kbd>K</Kbd>,
};

export const Modifier: Story = {
  render: () => (
    <KbdGroup>
      <Kbd>⌘</Kbd>
      <Kbd>K</Kbd>
    </KbdGroup>
  ),
};

export const Combinations: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm">Search</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm">Save</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>S</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm">New note</span>
        <KbdGroup>
          <Kbd>⌘</Kbd>
          <Kbd>⇧</Kbd>
          <Kbd>N</Kbd>
        </KbdGroup>
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm">Delete</span>
        <Kbd>⌫</Kbd>
      </div>
      <div className="flex items-center justify-between gap-8">
        <span className="text-sm">Escape</span>
        <Kbd>Esc</Kbd>
      </div>
    </div>
  ),
};
