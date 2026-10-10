import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button.tsx";
import { Input } from "../input/input.tsx";
import { Label } from "../label/label.tsx";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from "./popover.tsx";

const meta = {
  title: "UI/Popover",
  component: Popover,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof Popover>;

export const Default: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">Open popover</Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverTitle>Dimensions</PopoverTitle>
        <PopoverDescription>Set the dimensions for the layer.</PopoverDescription>
        <div className="mt-4 grid gap-2">
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="width">Width</Label>
            <Input className="col-span-2" defaultValue="100%" id="width" />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
            <Label htmlFor="height">Height</Label>
            <Input className="col-span-2" defaultValue="25px" id="height" />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  ),
};
