import type { Meta, StoryObj } from "@storybook/react-vite";
import { TextTicker } from "./text-ticker.tsx";

const meta = {
  title: "UI/Text Ticker",
  component: TextTicker,
  parameters: { layout: "centered" },
} satisfies Meta<typeof TextTicker>;

export default meta;
type Story = StoryObj<typeof TextTicker>;

export const Default: Story = {
  render: () => (
    <div className="w-40">
      <TextTicker>Short text</TextTicker>
    </div>
  ),
};

export const Overflow: Story = {
  name: "Overflow (Truncated)",
  render: () => (
    <div className="w-40">
      <TextTicker>
        This is a very long text that will be truncated because it overflows the container
      </TextTicker>
    </div>
  ),
};
