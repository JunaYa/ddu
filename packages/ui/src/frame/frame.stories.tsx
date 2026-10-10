import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button.tsx";
import {
  Frame,
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FramePanel,
  FrameTitle,
} from "./frame.tsx";

const meta = {
  title: "UI/Frame",
  component: Frame,
  parameters: {
    layout: "padded",
    docs: {
      description: {
        component:
          "A `Frame` is a muted tray that hosts one or more `FramePanel` cards, optionally bookended by `FrameHeader` and `FrameFooter`. Header / panels / footer are all **siblings** under `Frame` — never nested inside a panel. Consecutive panels are auto-spaced by 1px so the tray background shows through as a divider.",
      },
    },
  },
} satisfies Meta<typeof Frame>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Frame className="w-full max-w-md">
      <FrameHeader>
        <FrameTitle>Section header</FrameTitle>
        <FrameDescription>Brief description about the section</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <h2 className="font-semibold text-sm">Section title</h2>
        <p className="text-muted-foreground text-sm">Section description</p>
      </FramePanel>
      <FrameFooter>
        <p className="text-muted-foreground text-sm">Footer</p>
      </FrameFooter>
    </Frame>
  ),
};

export const PanelOnly: Story = {
  name: "Panel only",
  parameters: {
    docs: {
      description: {
        story:
          "A `Frame` with a single `FramePanel`, no header or footer — the minimal arrangement.",
      },
    },
  },
  render: () => (
    <Frame className="w-full max-w-md">
      <FramePanel>
        <h2 className="font-semibold text-sm">Just a panel</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          No header, no footer. The tray still wraps the panel with its muted background and 1px
          ring.
        </p>
      </FramePanel>
    </Frame>
  ),
};

export const MultiplePanels: Story = {
  name: "Multiple panels",
  parameters: {
    docs: {
      description: {
        story:
          "Consecutive `FramePanel`s are auto-spaced by 1px via the tray's `*:[[data-slot=frame-panel]+[data-slot=frame-panel]]:mt-1` rule. The muted tray background shows through as a divider — no manual borders or margins needed.",
      },
    },
  },
  render: () => (
    <Frame className="w-full max-w-md">
      <FrameHeader>
        <FrameTitle>Configuration</FrameTitle>
        <FrameDescription>Three independent panels stacked in one tray</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <h3 className="font-semibold text-sm">Notifications</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Choose how and when you receive updates.
        </p>
      </FramePanel>
      <FramePanel>
        <h3 className="font-semibold text-sm">Display</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Theme, density, and accent color preferences.
        </p>
      </FramePanel>
      <FramePanel>
        <h3 className="font-semibold text-sm">Privacy</h3>
        <p className="mt-1 text-muted-foreground text-sm">
          Control what telemetry is collected from this device.
        </p>
      </FramePanel>
      <FrameFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button>Save changes</Button>
      </FrameFooter>
    </Frame>
  ),
};

export const HeaderAndPanel: Story = {
  name: "Header + panel",
  parameters: {
    docs: {
      description: {
        story:
          "Header and a single panel — for sections that don't need a trailing footer or action row.",
      },
    },
  },
  render: () => (
    <Frame className="w-full max-w-md">
      <FrameHeader>
        <FrameTitle>API keys</FrameTitle>
        <FrameDescription>Manage credentials used by integrations.</FrameDescription>
      </FrameHeader>
      <FramePanel>
        <code className="font-mono text-muted-foreground text-xs">sk_live_a1b2c3d4e5f6g7h8</code>
      </FramePanel>
    </Frame>
  ),
};

export const PanelAndFooter: Story = {
  name: "Panel + footer",
  parameters: {
    docs: {
      description: {
        story: "Panel with a trailing footer — common for confirmation or action-row arrangements.",
      },
    },
  },
  render: () => (
    <Frame className="w-full max-w-md">
      <FramePanel>
        <h2 className="font-semibold text-sm">Delete workspace?</h2>
        <p className="mt-1 text-muted-foreground text-sm">
          This action is irreversible. All artifacts, notes, and conversations will be permanently
          removed.
        </p>
      </FramePanel>
      <FrameFooter className="flex justify-end gap-2">
        <Button variant="outline">Cancel</Button>
        <Button variant="destructive">Delete</Button>
      </FrameFooter>
    </Frame>
  ),
};
