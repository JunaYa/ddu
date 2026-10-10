import type { Meta, StoryObj } from "@storybook/react-vite";
import { LoadMoreTrigger } from "./load-more-trigger.tsx";

const meta = {
  title: "UI/Load More Trigger",
  component: LoadMoreTrigger,
  parameters: { layout: "centered" },
} satisfies Meta<typeof LoadMoreTrigger>;

export default meta;
type Story = StoryObj<typeof LoadMoreTrigger>;

export const Loading: Story = {
  render: () => (
    <div className="w-80 rounded-lg border p-4">
      <div className="space-y-2 text-muted-foreground text-sm">
        <p>Item 1</p>
        <p>Item 2</p>
        <p>Item 3</p>
      </div>
      <LoadMoreTrigger hasNextPage isFetchingNextPage onLoadMore={() => {}} />
    </div>
  ),
};

export const HasMore: Story = {
  name: "Has More (Idle)",
  render: () => (
    <div className="w-80 rounded-lg border p-4">
      <div className="space-y-2 text-muted-foreground text-sm">
        <p>Item 1</p>
        <p>Item 2</p>
        <p>Item 3</p>
      </div>
      <LoadMoreTrigger hasNextPage isFetchingNextPage={false} onLoadMore={() => {}} />
    </div>
  ),
};

export const NoMore: Story = {
  name: "No More Pages",
  render: () => (
    <div className="w-80 rounded-lg border p-4">
      <div className="space-y-2 text-muted-foreground text-sm">
        <p>Item 1</p>
        <p>Item 2</p>
        <p>Item 3</p>
      </div>
      <LoadMoreTrigger hasNextPage={false} isFetchingNextPage={false} onLoadMore={() => {}} />
    </div>
  ),
};
