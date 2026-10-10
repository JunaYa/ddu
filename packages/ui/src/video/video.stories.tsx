import type { Meta, StoryObj } from "@storybook/react-vite";
import { Video } from "./video.tsx";

const meta = {
  title: "UI/Video",
  component: Video,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Video>;

export default meta;
type Story = StoryObj<typeof Video>;

export const Default: Story = {
  render: () => (
    <div className="w-[480px]">
      <Video
        controls
        sources={[
          {
            src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
            type: "video/webm",
          },
        ]}
      />
    </div>
  ),
};

export const Thumbnail: Story = {
  name: "As Thumbnail",
  render: () => (
    <div className="w-60">
      <Video
        asThumbnail
        sources={[
          {
            src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.webm",
            type: "video/webm",
          },
        ]}
      />
    </div>
  ),
};
