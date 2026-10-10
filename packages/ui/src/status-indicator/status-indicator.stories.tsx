import type { Meta, StoryObj } from "@storybook/react-vite";
import { StatusIndicator } from "./status-indicator.tsx";

const meta = {
  title: "UI/StatusIndicator",
  component: StatusIndicator,
  tags: ["autodocs"],
  parameters: { layout: "centered" },
  argTypes: {
    status: { control: "select", options: ["processing", "success", "danger", "warning"] },
    display: { control: "select", options: ["icon", "label", "icon-label"] },
    size: { control: "select", options: ["sm", "md", "lg"] },
  },
} satisfies Meta<typeof StatusIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Processing: Story = {
  args: { status: "processing" },
};

export const Success: Story = {
  args: { status: "success" },
};

export const Danger: Story = {
  args: { status: "danger" },
};

export const Warning: Story = {
  args: { status: "warning" },
};

export const IconWithLabel: Story = {
  name: "Icon + label",
  args: { status: "success", display: "icon-label", label: "Done" },
};

export const LabelOnly: Story = {
  name: "Label only",
  args: { status: "processing", display: "label", label: "Processing…" },
};

export const AllStatuses: Story = {
  name: "All statuses",
  render: () => (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-6">
        <span className="w-20 text-muted-foreground text-xs">Icon</span>
        <StatusIndicator status="processing" />
        <StatusIndicator status="success" />
        <StatusIndicator status="danger" />
        <StatusIndicator status="warning" />
      </div>
      <div className="flex items-center gap-6">
        <span className="w-20 text-muted-foreground text-xs">Icon + label</span>
        <StatusIndicator display="icon-label" label="Processing" status="processing" />
        <StatusIndicator display="icon-label" label="Done" status="success" />
        <StatusIndicator display="icon-label" label="Error" status="danger" />
        <StatusIndicator display="icon-label" label="Warning" status="warning" />
      </div>
      <div className="flex items-center gap-6">
        <span className="w-20 text-muted-foreground text-xs">Label</span>
        <StatusIndicator display="label" label="Processing" status="processing" />
        <StatusIndicator display="label" label="Done" status="success" />
        <StatusIndicator display="label" label="Error" status="danger" />
        <StatusIndicator display="label" label="Warning" status="warning" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex items-center gap-6">
      <StatusIndicator display="icon-label" label="Small" size="sm" status="success" />
      <StatusIndicator display="icon-label" label="Medium" size="md" status="success" />
      <StatusIndicator display="icon-label" label="Large" size="lg" status="success" />
    </div>
  ),
};
