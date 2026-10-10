import type { Meta, StoryObj } from "@storybook/react-vite";
import { Filter } from "lucide-react";
import { useState } from "react";
import { Button } from "../button/button.tsx";
import {
  ConnectedPanel,
  ConnectedPanelBody,
  ConnectedPanelContent,
  ConnectedPanelDescription,
  ConnectedPanelFooter,
  ConnectedPanelHeader,
  ConnectedPanelTitle,
  ConnectedPanelTrigger,
} from "./connected-panel.tsx";

const meta = {
  title: "UI/Connected Panel",
  component: ConnectedPanel,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ConnectedPanel>;

export default meta;
type Story = StoryObj<typeof ConnectedPanel>;

export const Default: Story = {
  render: () => (
    <ConnectedPanel>
      <ConnectedPanelTrigger label="Filters" summary="2 active" />
      <ConnectedPanelContent>
        <ConnectedPanelBody>
          <div className="space-y-2 text-sm">
            <p>Filter content goes here.</p>
            <p className="text-muted-foreground">Select your criteria below.</p>
          </div>
        </ConnectedPanelBody>
      </ConnectedPanelContent>
    </ConnectedPanel>
  ),
};

export const DefaultOpen: Story = {
  name: "Default Open",
  render: () => (
    <ConnectedPanel defaultOpen>
      <ConnectedPanelTrigger label="Settings" summary="Appearance" />
      <ConnectedPanelContent>
        <ConnectedPanelHeader>
          <ConnectedPanelTitle>Appearance</ConnectedPanelTitle>
          <ConnectedPanelDescription>Customize how things look.</ConnectedPanelDescription>
        </ConnectedPanelHeader>
        <ConnectedPanelBody>
          <div className="space-y-2 text-muted-foreground text-sm">
            <p>Theme, font size, and density options would go here.</p>
          </div>
        </ConnectedPanelBody>
        <ConnectedPanelFooter>
          <Button size="sm" variant="ghost">
            Reset
          </Button>
          <Button size="sm">Apply</Button>
        </ConnectedPanelFooter>
      </ConnectedPanelContent>
    </ConnectedPanel>
  ),
};

export const CustomIcon: Story = {
  name: "Custom Icon",
  render: () => (
    <ConnectedPanel>
      <ConnectedPanelTrigger
        icon={<Filter className="size-4 shrink-0 text-muted-foreground" />}
        label="Sort"
        summary="Date"
      />
      <ConnectedPanelContent>
        <ConnectedPanelBody>
          <p className="text-muted-foreground text-sm">Sort options here.</p>
        </ConnectedPanelBody>
      </ConnectedPanelContent>
    </ConnectedPanel>
  ),
};

export const Controlled: Story = {
  render: () => {
    function Example() {
      const [open, setOpen] = useState(true);
      return (
        <ConnectedPanel onOpenChange={setOpen} open={open}>
          <ConnectedPanelTrigger label="Filters" summary={open ? "Expanded" : "Collapsed"} />
          <ConnectedPanelContent>
            <ConnectedPanelBody>
              <p className="text-muted-foreground text-sm">Controlled panel content.</p>
            </ConnectedPanelBody>
          </ConnectedPanelContent>
        </ConnectedPanel>
      );
    }
    return <Example />;
  },
};

export const AlignEnd: Story = {
  name: "Align End",
  render: () => (
    <ConnectedPanel align="end" defaultOpen>
      <ConnectedPanelTrigger label="Options" />
      <ConnectedPanelContent>
        <ConnectedPanelBody>
          <p className="text-muted-foreground text-sm">Content aligned to the end.</p>
        </ConnectedPanelBody>
      </ConnectedPanelContent>
    </ConnectedPanel>
  ),
};
