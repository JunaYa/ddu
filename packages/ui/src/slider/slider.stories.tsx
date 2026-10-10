import type { Meta, StoryObj } from "@storybook/react-vite";
import { Slider } from "./slider.tsx";

const meta = {
  title: "UI/Slider",
  component: Slider,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Slider>;

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[50]} max={100} step={1} />
    </div>
  ),
};

export const Range: Story = {
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[25, 75]} max={100} step={1} />
    </div>
  ),
};

export const WithSteps: Story = {
  name: "With Steps",
  render: () => (
    <div className="w-80">
      <Slider defaultValue={[50]} max={100} step={10} />
    </div>
  ),
};
