import type { Meta, StoryObj } from "@storybook/react-vite";
import { AspectRatio } from "./aspect-ratio.tsx";

const meta = {
  title: "UI/Aspect Ratio",
  component: AspectRatio,
  parameters: { layout: "centered" },
  argTypes: {
    ratio: { control: { type: "number", min: 0.25, max: 4, step: 0.25 } },
  },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof AspectRatio>;

export const Landscape: Story = {
  name: "16:9",
  args: { ratio: 16 / 9 },
  render: (args) => (
    <AspectRatio {...args}>
      <div className="flex size-full items-center justify-center rounded-xl bg-muted text-muted-foreground text-sm">
        16 : 9
      </div>
    </AspectRatio>
  ),
};

export const Square: Story = {
  name: "1:1",
  args: { ratio: 1 },
  render: (args) => (
    <AspectRatio {...args}>
      <div className="flex size-full items-center justify-center rounded-xl bg-muted text-muted-foreground text-sm">
        1 : 1
      </div>
    </AspectRatio>
  ),
};

export const Portrait: Story = {
  name: "3:4",
  args: { ratio: 3 / 4 },
  render: (args) => (
    <AspectRatio {...args}>
      <div className="flex size-full items-center justify-center rounded-xl bg-muted text-muted-foreground text-sm">
        3 : 4
      </div>
    </AspectRatio>
  ),
};

export const WithImage: Story = {
  name: "With Image",
  args: { ratio: 16 / 9 },
  render: (args) => (
    <AspectRatio {...args}>
      <img
        alt="Placeholder"
        className="size-full rounded-xl object-cover"
        src="https://images.unsplash.com/photo-1588345921523-c2dcdb7f1dcd?w=800&dpr=2&q=80"
      />
    </AspectRatio>
  ),
};

export const AllRatios: Story = {
  name: "All Ratios",
  decorators: [(Story) => <Story />],
  render: () => (
    <div className="grid w-[640px] grid-cols-3 gap-4">
      {(
        [
          { ratio: 1, label: "1 : 1" },
          { ratio: 4 / 3, label: "4 : 3" },
          { ratio: 16 / 9, label: "16 : 9" },
          { ratio: 21 / 9, label: "21 : 9" },
          { ratio: 3 / 4, label: "3 : 4" },
          { ratio: 9 / 16, label: "9 : 16" },
        ] as const
      ).map(({ ratio, label }) => (
        <div key={label}>
          <AspectRatio ratio={ratio}>
            <div className="flex size-full items-center justify-center rounded-xl bg-muted text-muted-foreground text-xs">
              {label}
            </div>
          </AspectRatio>
          <p className="mt-1 text-center text-muted-foreground text-xs">{label}</p>
        </div>
      ))}
    </div>
  ),
};
