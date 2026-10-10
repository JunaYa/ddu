import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Grid2x2,
  List,
  Moon,
  Sun,
  SunMoon,
} from "lucide-react";
import { useState } from "react";
import { SegmentControl } from "./segment-control.tsx";

const meta = {
  title: "UI/SegmentControl",
  component: SegmentControl,
  args: {
    items: [
      { icon: <Sun />, label: "Light", value: "light" },
      { icon: <Moon />, label: "Dark", value: "dark" },
      { icon: <SunMoon />, label: "Auto", value: "system" },
    ],
    value: "light",
    onValueChange: () => {},
  },
  argTypes: {
    variant: { control: "select", options: ["icon", "text"] },
    size: { control: "select", options: ["xs", "sm", "default", "lg"] },
  },
} satisfies Meta<typeof SegmentControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const themeItems = [
  { icon: <Sun />, label: "Light", value: "light" },
  { icon: <Moon />, label: "Dark", value: "dark" },
  { icon: <SunMoon />, label: "Auto", value: "system" },
];

const alignItems = [
  { icon: <AlignLeft />, label: "Left", value: "left" },
  { icon: <AlignCenter />, label: "Center", value: "center" },
  { icon: <AlignRight />, label: "Right", value: "right" },
];

export const Default: Story = {
  render: (args) => {
    const [value, setValue] = useState("light");
    return <SegmentControl {...args} items={themeItems} onValueChange={setValue} value={value} />;
  },
};

export const TextVariant: Story = {
  render: () => {
    const [value, setValue] = useState("en");
    return (
      <SegmentControl
        items={[
          { label: "English", value: "en" },
          { label: "中文", value: "zh" },
        ]}
        onValueChange={setValue}
        value={value}
        variant="text"
      />
    );
  },
};

export const TextWithIcons: Story = {
  render: () => {
    const [value, setValue] = useState("list");
    return (
      <SegmentControl
        items={[
          { icon: <List />, label: "List", value: "list" },
          { icon: <Grid2x2 />, label: "Grid", value: "grid" },
        ]}
        onValueChange={setValue}
        value={value}
        variant="text"
      />
    );
  },
};

export const Sizes: Story = {
  render: () => {
    const [xs, setXs] = useState("left");
    const [sm, setSm] = useState("left");
    const [md, setMd] = useState("left");
    const [lg, setLg] = useState("left");
    return (
      <div className="flex flex-col items-start gap-4">
        <SegmentControl items={alignItems} onValueChange={setXs} size="xs" value={xs} />
        <SegmentControl items={alignItems} onValueChange={setSm} size="sm" value={sm} />
        <SegmentControl items={alignItems} onValueChange={setMd} value={md} />
        <SegmentControl items={alignItems} onValueChange={setLg} size="lg" value={lg} />
      </div>
    );
  },
};

export const TextSizes: Story = {
  render: () => {
    const [xs, setXs] = useState("default");
    const [sm, setSm] = useState("default");
    const [md, setMd] = useState("default");
    const [lg, setLg] = useState("default");
    const items = [
      { label: "Compact", value: "compact" },
      { label: "Default", value: "default" },
      { label: "Large", value: "large" },
    ];
    return (
      <div className="flex w-64 flex-col gap-4">
        <SegmentControl items={items} onValueChange={setXs} size="xs" value={xs} variant="text" />
        <SegmentControl items={items} onValueChange={setSm} size="sm" value={sm} variant="text" />
        <SegmentControl items={items} onValueChange={setMd} value={md} variant="text" />
        <SegmentControl items={items} onValueChange={setLg} size="lg" value={lg} variant="text" />
      </div>
    );
  },
};

export const AllVariants: Story = {
  render: () => {
    const [iconValue, setIconValue] = useState("light");
    const [textValue, setTextValue] = useState("light");
    const [mixedValue, setMixedValue] = useState("list");
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs">Icon (default)</span>
          <div className="w-fit">
            <SegmentControl items={themeItems} onValueChange={setIconValue} value={iconValue} />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs">Text</span>
          <div className="w-fit">
            <SegmentControl
              items={[
                { label: "Light", value: "light" },
                { label: "Dark", value: "dark" },
                { label: "Auto", value: "system" },
              ]}
              onValueChange={setTextValue}
              value={textValue}
              variant="text"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <span className="text-muted-foreground text-xs">Text + icon</span>
          <div className="w-fit">
            <SegmentControl
              items={[
                { icon: <List />, label: "List", value: "list" },
                { icon: <Grid2x2 />, label: "Grid", value: "grid" },
              ]}
              onValueChange={setMixedValue}
              value={mixedValue}
              variant="text"
            />
          </div>
        </div>
      </div>
    );
  },
};
