import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, FileText, Plus, Search, Sparkles } from "lucide-react";
import { Button } from "./button.tsx";

const meta = {
  title: "UI/Button",
  component: Button,
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "destructive",
        "destructive-muted",
        "outline",
        "secondary",
        "ghost",
        "ghost-destructive",
        "primary",
        "primary-rich",
        "primary-muted",
        "link",
        "tile",
      ],
    },
    size: {
      control: "select",
      options: [
        "default",
        "xs",
        "sm",
        "lg",
        "xl",
        "icon",
        "icon-xs",
        "icon-sm",
        "icon-lg",
        "icon-xl",
        "tile",
      ],
    },
    disabled: { control: "boolean" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Button" },
};

export const Destructive: Story = {
  args: { children: "Delete", variant: "destructive" },
};

export const Outline: Story = {
  args: { children: "Button", variant: "outline" },
};

export const Secondary: Story = {
  args: { children: "Button", variant: "secondary" },
};

export const Ghost: Story = {
  args: { children: "Button", variant: "ghost" },
};

export const Primary: Story = {
  args: { children: "Button", variant: "primary" },
};

export const PrimaryRich: Story = {
  args: { children: "Button", variant: "primary-rich" },
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Button variant="default">Default</Button>
      <Button variant="destructive">Destructive</Button>
      <Button variant="destructive-muted">Destructive Muted</Button>
      <Button variant="outline">Outline</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="ghost-destructive">Ghost Destructive</Button>
      <Button variant="primary">Primary</Button>
      <Button variant="primary-rich">Primary Rich</Button>
      <Button variant="primary-muted">Primary Muted</Button>
      <Button variant="link">Link</Button>
      <Button variant="tile">
        <Sparkles />
        Generate
      </Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">Extra Small</Button>
      <Button size="sm">Small</Button>
      <Button size="default">Default</Button>
      <Button size="lg">Large</Button>
      <Button size="xl">Extra Large</Button>
      <Button size="tile" variant="tile">
        <FileText />
        Tile
      </Button>
    </div>
  ),
};

export const AllIconSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button aria-label="Add" size="icon-xs">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon-sm">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon-lg">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon-xl">
        <Plus />
      </Button>
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="xs">
        <Plus />
        New
      </Button>
      <Button size="sm">
        <Plus />
        New
      </Button>
      <Button size="default">
        Continue
        <ArrowRight />
      </Button>
      <Button size="lg">
        Continue
        <ArrowRight />
      </Button>
      <Button size="xl">
        Continue
        <ArrowRight />
      </Button>
    </div>
  ),
};

export const Tile: Story = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Button size="tile" variant="default">
        <Sparkles />
        Default
      </Button>
      <Button size="tile" variant="tile">
        <Sparkles />
        Card
      </Button>
      <Button size="tile" variant="outline">
        <Search />
        Outline
      </Button>
      <Button size="tile" variant="ghost">
        <FileText />
        Ghost
      </Button>
      <Button size="tile" variant="primary">
        <Plus />
        Primary
      </Button>
      <Button disabled size="tile" variant="secondary">
        <FileText />
        Disabled
      </Button>
    </div>
  ),
};

export const IconVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Button aria-label="Add" size="icon" variant="default">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon" variant="destructive">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon" variant="destructive-muted">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon" variant="outline">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon" variant="secondary">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon" variant="ghost">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon" variant="ghost-destructive">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon" variant="primary">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon" variant="primary-rich">
        <Plus />
      </Button>
      <Button aria-label="Add" size="icon" variant="primary-muted">
        <Plus />
      </Button>
    </div>
  ),
};

export const Disabled: Story = {
  args: { children: "Button", disabled: true },
};
