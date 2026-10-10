import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { ExpandableTextarea } from "./expandable-textarea.tsx";

const meta = {
  title: "UI/ExpandableTextarea",
  component: ExpandableTextarea,
  parameters: { layout: "padded" },
  argTypes: {
    rows: { control: { type: "number", min: 1, max: 12 } },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof ExpandableTextarea>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: "Start typing… (focus to reveal expand)",
    rows: 3,
  },
};

export const WithTitle: Story = {
  name: "With Expanded Title",
  args: {
    placeholder: "Describe your idea in detail…",
    rows: 4,
    expandedTitle: "Content Editor",
  },
};

export const FiveRows: Story = {
  name: "Five Rows",
  args: {
    placeholder: "More visible rows…",
    rows: 5,
    expandedTitle: "Edit",
  },
};

export const Disabled: Story = {
  args: {
    placeholder: "This field is disabled",
    rows: 3,
    disabled: true,
    defaultValue: "This content cannot be edited.",
  },
};

export const WithDefaultValue: Story = {
  name: "With Default Value (scrollable)",
  args: {
    rows: 3,
    expandedTitle: "Edit Content",
    defaultValue: `Line 1: The quick brown fox jumps over the lazy dog.
Line 2: Pack my box with five dozen liquor jugs.
Line 3: How vaguely quizzical and jaded a fop I became.
Line 4: Sphinx of black quartz, judge my vow.
Line 5: The five boxing wizards jump quickly.
Line 6: Waltz, nymph, for quick jigs vex Bud.`,
  },
};

export const Controlled: Story = {
  name: "Controlled",
  render: () => {
    const [value, setValue] = useState("Controlled value here.");
    return (
      <div className="flex w-full max-w-md flex-col gap-3">
        <ExpandableTextarea
          expandedTitle="Edit Note"
          onChange={(e) => setValue(e.target.value)}
          placeholder="Type something…"
          rows={3}
          value={value}
        />
        <p className="text-muted-foreground text-xs">Character count: {value.length}</p>
      </div>
    );
  },
};

export const InForm: Story = {
  name: "In a Form Context",
  render: () => (
    <form className="flex w-full max-w-md flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label className="font-medium text-sm" htmlFor="description">
          Description
        </label>
        <ExpandableTextarea
          expandedTitle="Edit Description"
          id="description"
          name="description"
          placeholder="Enter a description…"
          rows={3}
        />
        <p className="text-muted-foreground text-xs">
          Focus the textarea to reveal the expand button.
        </p>
      </div>
    </form>
  ),
};
