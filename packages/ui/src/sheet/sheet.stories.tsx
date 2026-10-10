import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button.tsx";
import { Input } from "../input/input.tsx";
import { Label } from "../label/label.tsx";
import {
  Sheet,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetPopup,
  SheetTitle,
  SheetTrigger,
} from "./sheet.tsx";

const meta = {
  title: "UI/Sheet",
  component: Sheet,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof Sheet>;

export const Right: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open Sheet</Button>} />
      <SheetPopup side="right">
        <SheetHeader>
          <SheetTitle>Edit Profile</SheetTitle>
          <SheetDescription>Make changes to your profile here.</SheetDescription>
        </SheetHeader>
        <SheetPanel>
          <div className="grid gap-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="name">
                Name
              </Label>
              <Input className="col-span-3" defaultValue="John Doe" id="name" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right" htmlFor="username">
                Username
              </Label>
              <Input className="col-span-3" defaultValue="@johndoe" id="username" />
            </div>
          </div>
        </SheetPanel>
        <SheetFooter variant="bare">
          <Button type="submit">Save changes</Button>
        </SheetFooter>
      </SheetPopup>
    </Sheet>
  ),
};

export const Left: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open Left</Button>} />
      <SheetPopup side="left">
        <SheetHeader>
          <SheetTitle>Navigation</SheetTitle>
          <SheetDescription>Browse the app sections.</SheetDescription>
        </SheetHeader>
        <SheetPanel>
          <nav className="grid gap-2">
            {["Dashboard", "Notes", "Collections", "Settings"].map((item) => (
              <Button className="justify-start" key={item} variant="ghost">
                {item}
              </Button>
            ))}
          </nav>
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  ),
};

export const Bottom: Story = {
  render: () => (
    <Sheet>
      <SheetTrigger render={<Button variant="outline">Open Bottom</Button>} />
      <SheetPopup side="bottom">
        <SheetHeader>
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>Adjust your search filters.</SheetDescription>
        </SheetHeader>
        <SheetPanel>
          <p className="text-muted-foreground text-sm">Filter options would go here.</p>
        </SheetPanel>
      </SheetPopup>
    </Sheet>
  ),
};
