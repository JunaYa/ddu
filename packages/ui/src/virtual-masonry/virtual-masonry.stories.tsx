import type { Meta, StoryObj } from "@storybook/react-vite";
import type { RenderComponentProps } from "masonic";
import { useRef } from "react";
import { VirtualMasonry } from "./virtual-masonry.tsx";

const meta = {
  title: "UI/Virtual Masonry",
  parameters: { layout: "fullscreen" },
} satisfies Meta;

export default meta;
type Story = StoryObj;

interface DemoItem {
  color: string;
  height: number;
  id: string;
}

const COLORS = [
  "bg-red-500/20",
  "bg-blue-500/20",
  "bg-green-500/20",
  "bg-yellow-500/20",
  "bg-purple-500/20",
  "bg-pink-500/20",
  "bg-orange-500/20",
  "bg-teal-500/20",
];

const items: DemoItem[] = Array.from({ length: 40 }, (_, i) => ({
  id: `item-${String(i)}`,
  height: 100 + Math.floor(Math.random() * 200),
  color: COLORS[i % COLORS.length]!,
}));

function MasonryCard({ data }: RenderComponentProps<DemoItem>) {
  return (
    <div
      className={`flex items-center justify-center rounded-lg border ${data.color}`}
      style={{ height: data.height }}
    >
      <span className="text-muted-foreground text-sm">{data.id}</span>
    </div>
  );
}

function MasonryDemo({ columnWidth = 180, gap = 12 }: { columnWidth?: number; gap?: number }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  return (
    <div className="h-[500px] overflow-y-auto p-4" ref={scrollRef}>
      <VirtualMasonry
        columnWidth={columnWidth}
        gap={gap}
        getItemKey={(item) => item.id}
        items={items}
        renderItem={MasonryCard}
        scrollRef={scrollRef}
      />
    </div>
  );
}

export const Default: Story = {
  render: () => <MasonryDemo />,
};

export const NarrowColumns: Story = {
  name: "Narrow Columns",
  render: () => <MasonryDemo columnWidth={120} gap={8} />,
};

export const WideColumns: Story = {
  name: "Wide Columns",
  render: () => <MasonryDemo columnWidth={280} gap={16} />,
};
