import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { type ScrollableTabItem, ScrollableTabs } from "./scrollable-tabs.tsx";

const FEW_ITEMS: ScrollableTabItem[] = [
  { value: "design", label: "Design" },
  { value: "code", label: "Code" },
  { value: "docs", label: "Docs" },
];

const MANY_ITEMS: ScrollableTabItem[] = [
  { value: "all-notes", label: "All Notes" },
  { value: "articles", label: "Articles" },
  { value: "bookmarks", label: "Bookmarks" },
  { value: "code-snippets", label: "Code Snippets" },
  { value: "design-refs", label: "Design References" },
  { value: "ideas", label: "Ideas" },
  { value: "meeting-notes", label: "Meeting Notes" },
  { value: "projects", label: "Projects" },
  { value: "research", label: "Research" },
  { value: "tasks", label: "Tasks" },
  { value: "templates", label: "Templates" },
  { value: "tutorials", label: "Tutorials" },
];

function Controlled({
  defaultValue = "all",
  ...props
}: Omit<React.ComponentProps<typeof ScrollableTabs>, "value" | "onValueChange"> & {
  defaultValue?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return <ScrollableTabs {...props} onValueChange={setValue} value={value} />;
}

const meta = {
  title: "UI/ScrollableTabs",
  parameters: { layout: "padded" },
  decorators: [
    (Story) => (
      <div className="w-full max-w-md bg-background text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const CustomAllLabel: Story = {
  render: () => <Controlled allOptionLabel="Everything" items={MANY_ITEMS} />,
};

export const Default: Story = {
  render: () => <Controlled items={MANY_ITEMS} />,
};

export const FewTabs: Story = {
  render: () => <Controlled items={FEW_ITEMS} />,
};

export const Loading: Story = {
  render: () => <Controlled isLoading items={MANY_ITEMS} />,
};

export const NoAllOption: Story = {
  render: () => <Controlled defaultValue="articles" items={MANY_ITEMS} showAllOption={false} />,
};

export const PreselectedTab: Story = {
  render: () => <Controlled defaultValue="research" items={MANY_ITEMS} />,
};
