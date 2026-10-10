import type { Meta, StoryObj } from "@storybook/react-vite";
import { Tabs, TabsList, TabsPanel, TabsTab } from "./tabs.tsx";

const meta = {
  title: "UI/Tabs",
  component: Tabs,
  parameters: { layout: "padded" },
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabsList>
        <TabsTab value="account">Account</TabsTab>
        <TabsTab value="password">Password</TabsTab>
        <TabsTab value="settings">Settings</TabsTab>
      </TabsList>
      <TabsPanel value="account">
        <p className="pt-4 text-muted-foreground text-sm">Account tab content.</p>
      </TabsPanel>
      <TabsPanel value="password">
        <p className="pt-4 text-muted-foreground text-sm">Password tab content.</p>
      </TabsPanel>
      <TabsPanel value="settings">
        <p className="pt-4 text-muted-foreground text-sm">Settings tab content.</p>
      </TabsPanel>
    </Tabs>
  ),
};

export const ExtraSmall: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabsList size="xs">
        <TabsTab size="xs" value="account">
          Account
        </TabsTab>
        <TabsTab size="xs" value="password">
          Password
        </TabsTab>
        <TabsTab size="xs" value="settings">
          Settings
        </TabsTab>
      </TabsList>
      <TabsPanel value="account">
        <p className="pt-4 text-muted-foreground text-sm">Account tab content.</p>
      </TabsPanel>
    </Tabs>
  ),
};

export const Small: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabsList size="sm">
        <TabsTab size="sm" value="account">
          Account
        </TabsTab>
        <TabsTab size="sm" value="password">
          Password
        </TabsTab>
        <TabsTab size="sm" value="settings">
          Settings
        </TabsTab>
      </TabsList>
      <TabsPanel value="account">
        <p className="pt-4 text-muted-foreground text-sm">Account tab content.</p>
      </TabsPanel>
    </Tabs>
  ),
};

export const Large: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabsList size="lg">
        <TabsTab size="lg" value="account">
          Account
        </TabsTab>
        <TabsTab size="lg" value="password">
          Password
        </TabsTab>
        <TabsTab size="lg" value="settings">
          Settings
        </TabsTab>
      </TabsList>
      <TabsPanel value="account">
        <p className="pt-4 text-muted-foreground text-sm">Account tab content.</p>
      </TabsPanel>
    </Tabs>
  ),
};

export const Underline: Story = {
  render: () => (
    <Tabs defaultValue="account">
      <TabsList variant="underline">
        <TabsTab value="account">Account</TabsTab>
        <TabsTab value="password">Password</TabsTab>
        <TabsTab value="settings">Settings</TabsTab>
      </TabsList>
      <TabsPanel value="account">
        <p className="pt-4 text-muted-foreground text-sm">Account tab content.</p>
      </TabsPanel>
      <TabsPanel value="password">
        <p className="pt-4 text-muted-foreground text-sm">Password tab content.</p>
      </TabsPanel>
      <TabsPanel value="settings">
        <p className="pt-4 text-muted-foreground text-sm">Settings tab content.</p>
      </TabsPanel>
    </Tabs>
  ),
};
