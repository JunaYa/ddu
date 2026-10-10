import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronsUpDown } from "lucide-react";
import { useState } from "react";
import { Button } from "../button/button.tsx";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./collapsible.tsx";

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof Collapsible>;

export const Default: Story = {
  render: () => (
    <Collapsible className="w-80 space-y-2">
      <div className="flex items-center justify-between gap-4 px-1">
        <h4 className="font-semibold text-sm">3 items</h4>
        <CollapsibleTrigger render={<Button size="icon-sm" variant="ghost" />}>
          <ChevronsUpDown className="size-4" />
          <span className="sr-only">Toggle</span>
        </CollapsibleTrigger>
      </div>
      <div className="rounded-lg border px-4 py-2 text-sm">Item 1 (always visible)</div>
      <CollapsiblePanel>
        <div className="space-y-2">
          <div className="rounded-lg border px-4 py-2 text-sm">Item 2</div>
          <div className="rounded-lg border px-4 py-2 text-sm">Item 3</div>
        </div>
      </CollapsiblePanel>
    </Collapsible>
  ),
};

export const DefaultOpen: Story = {
  name: "Default Open",
  render: () => (
    <Collapsible className="w-80 space-y-2" defaultOpen>
      <div className="flex items-center justify-between gap-4 px-1">
        <h4 className="font-semibold text-sm">Settings</h4>
        <CollapsibleTrigger render={<Button size="icon-sm" variant="ghost" />}>
          <ChevronsUpDown className="size-4" />
        </CollapsibleTrigger>
      </div>
      <CollapsiblePanel>
        <div className="space-y-2">
          <div className="rounded-lg border px-4 py-2 text-sm">Notifications</div>
          <div className="rounded-lg border px-4 py-2 text-sm">Privacy</div>
          <div className="rounded-lg border px-4 py-2 text-sm">Appearance</div>
        </div>
      </CollapsiblePanel>
    </Collapsible>
  ),
};

export const Controlled: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <div className="w-80 space-y-3">
          <Collapsible className="space-y-2" onOpenChange={setOpen} open={open}>
            <div className="flex items-center justify-between gap-4 px-1">
              <h4 className="font-semibold text-sm">{open ? "Collapse" : "Expand"} details</h4>
              <CollapsibleTrigger render={<Button size="sm" variant="outline" />}>
                <ChevronsUpDown className="size-3.5" />
                {open ? "Hide" : "Show"}
              </CollapsibleTrigger>
            </div>
            <CollapsiblePanel>
              <div className="rounded-lg border p-4 text-muted-foreground text-sm">
                This content is revealed when expanded. The parent controls the open state.
              </div>
            </CollapsiblePanel>
          </Collapsible>
        </div>
      );
    }
    return <Example />;
  },
};
