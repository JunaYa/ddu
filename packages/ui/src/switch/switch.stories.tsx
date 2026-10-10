import type { Meta, StoryObj } from "@storybook/react-vite";
import { Switch } from "./switch.tsx";

const meta = {
  title: "UI/Switch",
  component: Switch,
  argTypes: {
    defaultChecked: { control: "boolean" },
    disabled: { control: "boolean" },
    loading: { control: "boolean" },
  },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Off: Story = {};

export const On: Story = {
  args: { defaultChecked: true },
};

export const Disabled: Story = {
  args: { disabled: true },
};

export const DisabledOn: Story = {
  args: { disabled: true, defaultChecked: true },
};

export const Loading: Story = {
  args: { loading: true },
};

export const LoadingOn: Story = {
  args: { loading: true, defaultChecked: true },
};

export const AllStates: Story = {
  render: () => (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3">
      <span className="text-muted-foreground text-xs">Off</span>
      <span className="text-muted-foreground text-xs">On</span>

      <Switch />
      <Switch defaultChecked />

      <Switch disabled />
      <Switch defaultChecked disabled />

      <Switch loading />
      <Switch defaultChecked loading />
    </div>
  ),
};
