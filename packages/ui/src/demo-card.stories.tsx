import type { Meta, StoryObj } from "@storybook/react-vite";
import { DemoCard } from "./demo-card.tsx";

const meta = {
  title: "DemoCard",
  component: DemoCard,
} satisfies Meta<typeof DemoCard>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Web: Story = {
  args: { message: "Hello from Web!", platform: "web" },
};

export const Desktop: Story = {
  args: { message: "Hello from Desktop!", platform: "desktop" },
};

export const EmptyMessage: Story = {
  args: { message: "", platform: "extension" },
};
