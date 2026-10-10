import type { Meta, StoryObj } from "@storybook/react-vite";
import { Progress } from "./progress.tsx";

const meta = {
  title: "UI/Progress",
  component: Progress,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Progress>;

export default meta;
type Story = StoryObj<typeof Progress>;

export const Default: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={60} />
    </div>
  ),
};

export const Empty: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={0} />
    </div>
  ),
};

export const Full: Story = {
  render: () => (
    <div className="w-80">
      <Progress value={100} />
    </div>
  ),
};

export const Multiple: Story = {
  name: "Multiple Values",
  render: () => (
    <div className="flex w-80 flex-col gap-4">
      <Progress value={25} />
      <Progress value={50} />
      <Progress value={75} />
      <Progress value={100} />
    </div>
  ),
};
