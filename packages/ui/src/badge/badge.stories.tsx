import type { Meta, StoryObj } from "@storybook/react-vite";
import { Badge } from "./badge.tsx";

const meta = {
  title: "UI/Badge",
  component: Badge,
  parameters: { layout: "centered" },
  argTypes: {
    variant: {
      control: "select",
      description:
        "Visual style — core semantic variants, named color variants, and solid/filled color variants",
      options: [
        "default",
        "primary",
        "primary-muted",
        "secondary",
        "mutedBackground",
        "destructive",
        "outline",
        "ghost",
        "link",
        "glass",
        "success",
        "warning",
        "info",
        "neutral",
        "slate",
        "gray",
        "zinc",
        "stone",
        "red",
        "orange",
        "amber",
        "yellow",
        "lime",
        "green",
        "emerald",
        "teal",
        "cyan",
        "sky",
        "blue",
        "indigo",
        "violet",
        "purple",
        "fuchsia",
        "pink",
        "rose",
        "neutral-solid",
        "slate-solid",
        "gray-solid",
        "zinc-solid",
        "stone-solid",
        "red-solid",
        "orange-solid",
        "amber-solid",
        "yellow-solid",
        "lime-solid",
        "green-solid",
        "emerald-solid",
        "teal-solid",
        "cyan-solid",
        "sky-solid",
        "blue-solid",
        "indigo-solid",
        "violet-solid",
        "purple-solid",
        "fuchsia-solid",
        "pink-solid",
        "rose-solid",
      ],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: { children: "Badge", variant: "default" },
};

export const Primary: Story = {
  args: { children: "Badge", variant: "primary" },
};

export const PrimaryMuted: Story = {
  args: { children: "Badge", variant: "primary-muted" },
};

export const Secondary: Story = {
  args: { children: "Badge", variant: "secondary" },
};

export const MutedBackground: Story = {
  args: { children: "Badge", variant: "mutedBackground" },
};

export const Destructive: Story = {
  args: { children: "Error", variant: "destructive" },
};

export const Outline: Story = {
  args: { children: "Badge", variant: "outline" },
};

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex flex-col gap-6">
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Core
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "default",
              "primary",
              "primary-muted",
              "secondary",
              "mutedBackground",
              "destructive",
              "outline",
              "ghost",
              "link",
              "glass",
            ] as const
          ).map((v) => (
            <Badge key={v} variant={v}>
              {v}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Status
        </p>
        <div className="flex flex-wrap gap-2">
          {(["success", "warning", "info"] as const).map((v) => (
            <Badge key={v} variant={v}>
              {v}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Colors
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "neutral",
              "slate",
              "gray",
              "zinc",
              "stone",
              "red",
              "orange",
              "amber",
              "yellow",
              "lime",
              "green",
              "emerald",
              "teal",
              "cyan",
              "sky",
              "blue",
              "indigo",
              "violet",
              "purple",
              "fuchsia",
              "pink",
              "rose",
            ] as const
          ).map((c) => (
            <Badge key={c} variant={c}>
              {c}
            </Badge>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 font-medium text-muted-foreground text-xs uppercase tracking-wide">
          Solid
        </p>
        <div className="flex flex-wrap gap-2">
          {(
            [
              "neutral",
              "slate",
              "gray",
              "zinc",
              "stone",
              "red",
              "orange",
              "amber",
              "yellow",
              "lime",
              "green",
              "emerald",
              "teal",
              "cyan",
              "sky",
              "blue",
              "indigo",
              "violet",
              "purple",
              "fuchsia",
              "pink",
              "rose",
            ] as const
          ).map((c) => (
            <Badge key={c} variant={`${c}-solid`}>
              {c}
            </Badge>
          ))}
        </div>
      </div>
    </div>
  ),
};
