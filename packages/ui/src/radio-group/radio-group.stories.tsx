import type { Meta, StoryObj } from "@storybook/react-vite";
import { Label } from "../label/label.tsx";
import { Radio, RadioGroup } from "./radio-group.tsx";

const meta = {
  title: "UI/Radio Group",
  component: RadioGroup,
  parameters: { layout: "centered" },
} satisfies Meta<typeof RadioGroup>;

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: () => (
    <RadioGroup defaultValue="comfortable">
      <div className="flex items-center gap-2">
        <Radio value="default" />
        <Label>Default</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio value="comfortable" />
        <Label>Comfortable</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio value="compact" />
        <Label>Compact</Label>
      </div>
    </RadioGroup>
  ),
};

export const Horizontal: Story = {
  render: () => (
    <RadioGroup className="flex-row gap-4" defaultValue="sm">
      <div className="flex items-center gap-2">
        <Radio value="sm" />
        <Label>Small</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio value="md" />
        <Label>Medium</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio value="lg" />
        <Label>Large</Label>
      </div>
    </RadioGroup>
  ),
};

export const Disabled: Story = {
  render: () => (
    <RadioGroup defaultValue="option-one" disabled>
      <div className="flex items-center gap-2">
        <Radio value="option-one" />
        <Label>Option One</Label>
      </div>
      <div className="flex items-center gap-2">
        <Radio value="option-two" />
        <Label>Option Two</Label>
      </div>
    </RadioGroup>
  ),
};
