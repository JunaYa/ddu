import type { Meta, StoryObj } from "@storybook/react-vite";
import { DropOverlay } from "./drop-overlay.tsx";

const meta = {
  title: "UI/Drop Overlay",
  component: DropOverlay,
  parameters: { layout: "centered" },
} satisfies Meta<typeof DropOverlay>;

export default meta;
type Story = StoryObj<typeof DropOverlay>;

const container = "relative w-[480px] rounded-xl border border-dashed bg-muted/30";

export const Default: Story = {
  render: () => (
    <div className={container} style={{ height: 320 }}>
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Drop target area
      </div>
      <DropOverlay
        description="Upload images, documents, or other files"
        title="Drop files here"
        visible
      />
    </div>
  ),
};

export const Hidden: Story = {
  render: () => (
    <div className={container} style={{ height: 320 }}>
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Overlay is hidden (visible=false)
      </div>
      <DropOverlay
        description="Upload images, documents, or other files"
        title="Drop files here"
        visible={false}
      />
    </div>
  ),
};

export const CustomCopy: Story = {
  name: "Custom Copy",
  render: () => (
    <div className={container} style={{ height: 320 }}>
      <div className="flex h-full items-center justify-center text-muted-foreground text-sm">
        Drop target area
      </div>
      <DropOverlay
        description="Drop notes or files to add them to this collection"
        title="Add to collection"
        visible
      />
    </div>
  ),
};
