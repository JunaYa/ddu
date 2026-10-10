import type { Meta, StoryObj } from "@storybook/react-vite";
import { AsciiLoader, type AsciiLoaderName } from "./index.tsx";
import { spinners } from "./spinners.ts";

const SPINNER_NAMES = Object.keys(spinners) as AsciiLoaderName[];

const meta = {
  title: "Animated/AsciiLoader",
  component: AsciiLoader,
  argTypes: {
    name: {
      control: { type: "select" },
      options: SPINNER_NAMES,
    },
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof AsciiLoader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { name: "dots" },
};

export const Dots2: Story = { args: { name: "dots2" } };
export const Dots3: Story = { args: { name: "dots3" } };
export const Line: Story = { args: { name: "line" } };
export const SimpleDots: Story = { args: { name: "simpleDots" } };
export const Pipe: Story = { args: { name: "pipe" } };
export const Star: Story = { args: { name: "star" } };
export const ArrowSpinner: Story = { args: { name: "arrow3" } };
export const Bounce: Story = { args: { name: "bouncingBar" } };
export const Earth: Story = { args: { name: "earth" } };
export const Moon: Story = { args: { name: "moon" } };
export const Clock: Story = { args: { name: "clock" } };
export const Pong: Story = { args: { name: "pong" } };
export const Aesthetic: Story = { args: { name: "aesthetic" } };

export const Catalogue: Story = {
  args: { name: "dots" },
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="grid grid-cols-2 gap-x-8 gap-y-3 p-8 sm:grid-cols-3 lg:grid-cols-4">
      {SPINNER_NAMES.map((name) => (
        <div className="flex items-center gap-3" key={name}>
          <span className="inline-flex w-6 justify-center font-mono text-foreground text-sm">
            <AsciiLoader name={name} />
          </span>
          <span className="font-mono text-muted-foreground text-xs">{name}</span>
        </div>
      ))}
    </div>
  ),
};
