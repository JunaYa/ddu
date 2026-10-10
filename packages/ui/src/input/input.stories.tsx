import type { Meta, StoryObj } from "@storybook/react-vite";
import { Input } from "./input.tsx";

const meta = {
  title: "UI/Input",
  component: Input,
  parameters: { layout: "padded" },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Input>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { placeholder: "Enter text…" },
};

export const Small: Story = {
  args: { placeholder: "Small input", size: "sm" },
};

export const Large: Story = {
  args: { placeholder: "Large input", size: "lg" },
};

export const Disabled: Story = {
  args: { placeholder: "Disabled", disabled: true },
};

export const Invalid: Story = {
  args: { placeholder: "Invalid input", "aria-invalid": true },
};

export const Password: Story = {
  args: { type: "password", placeholder: "Password" },
};

export const AllSizes: Story = {
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex w-80 flex-col gap-3">
      <Input placeholder="Small" size="sm" />
      <Input placeholder="Default" size="default" />
      <Input placeholder="Large" size="lg" />
    </div>
  ),
};
