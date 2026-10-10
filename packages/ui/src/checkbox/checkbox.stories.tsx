import type { Meta, StoryObj } from "@storybook/react-vite";
import { Checkbox } from "./checkbox.tsx";

const meta = {
  title: "UI/Checkbox",
  component: Checkbox,
  parameters: { layout: "centered" },
  tags: ["autodocs"],
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default", "lg"],
      description: "Visual size of the checkbox",
      table: { defaultValue: { summary: "default" } },
    },
    disabled: {
      control: "boolean",
      description: "Prevents interaction and dims the checkbox",
    },
    defaultChecked: {
      control: "boolean",
      description: "Initial checked state (uncontrolled)",
    },
    indeterminate: {
      control: "boolean",
      description: "Mixed state — shown when child checkboxes have different values",
    },
  },
} satisfies Meta<typeof Checkbox>;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Default: Story = {
  args: { size: "default" },
};

export const Checked: Story = {
  args: { size: "default", defaultChecked: true },
};

export const Indeterminate: Story = {
  args: { size: "default", indeterminate: true },
};

export const Disabled: Story = {
  args: { size: "default", disabled: true },
};

export const DisabledChecked: Story = {
  args: { size: "default", disabled: true, defaultChecked: true },
};

export const Invalid: Story = {
  args: { size: "default", "aria-invalid": true },
};

export const Large: Story = {
  args: { size: "lg", defaultChecked: true },
};

// ─── Overview ─────────────────────────────────────────────────────────────────

const STATES = [
  { label: "Unchecked", props: {} },
  { label: "Checked", props: { defaultChecked: true } },
  { label: "Indeterminate", props: { indeterminate: true } },
  { label: "Disabled", props: { disabled: true } },
  { label: "Dis. checked", props: { disabled: true, defaultChecked: true } },
] as const;

const SIZES = ["sm", "default", "lg"] as const;

export const AllStates: Story = {
  name: "All States × Sizes",
  parameters: { layout: "padded" },
  render: () => (
    <div className="space-y-10">
      {SIZES.map((size) => (
        <div key={size}>
          <p className="mb-4 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
            {size}
          </p>
          <div className="flex items-start gap-8">
            {STATES.map(({ label, props }) => (
              <div className="flex flex-col items-center gap-2.5" key={label}>
                <Checkbox size={size} {...props} />
                <span className="whitespace-nowrap text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const AllSizes: Story = {
  name: "All Sizes",
  parameters: { layout: "padded" },
  render: () => (
    <div className="flex items-end gap-10">
      {SIZES.map((size) => (
        <div className="flex flex-col items-center gap-3" key={size}>
          <div className="flex items-center gap-3">
            <Checkbox size={size} />
            <Checkbox defaultChecked size={size} />
          </div>
          <span className="text-muted-foreground text-xs">{size}</span>
        </div>
      ))}
    </div>
  ),
};

export const WithLabels: Story = {
  name: "With Labels",
  parameters: { layout: "padded" },
  render: () => (
    <div className="min-w-64 space-y-8">
      {SIZES.map((size) => (
        <div key={size}>
          <p className="mb-3 font-semibold text-muted-foreground text-xs uppercase tracking-widest">
            {size}
          </p>
          <div className="space-y-3">
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox defaultChecked size={size} />
              <span className="text-sm">Accept terms and conditions</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox size={size} />
              <span className="text-sm">Send me email notifications</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox indeterminate size={size} />
              <span className="text-sm">Manage all permissions</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox disabled size={size} />
              <span className="text-muted-foreground text-sm">
                Sync with calendar (unavailable)
              </span>
            </label>
          </div>
        </div>
      ))}
    </div>
  ),
};
