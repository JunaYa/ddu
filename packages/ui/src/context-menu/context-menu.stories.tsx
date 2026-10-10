import type { Meta, StoryObj } from "@storybook/react-vite";
import { Copy, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuRadioGroup,
  ContextMenuRadioItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from "./context-menu.tsx";

const meta = {
  title: "UI/Context Menu",
  component: ContextMenu,
  parameters: { layout: "centered" },
} satisfies Meta<typeof ContextMenu>;

export default meta;
type Story = StoryObj<typeof ContextMenu>;

export const Default: Story = {
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-48 w-80 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          <Pencil /> Edit <ContextMenuShortcut>⌘E</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuItem>
          <Copy /> Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">
          <Trash2 /> Delete <ContextMenuShortcut>⌫</ContextMenuShortcut>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithGroups: Story = {
  name: "With Groups",
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-48 w-80 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuGroup>
          <ContextMenuLabel>Edit</ContextMenuLabel>
          <ContextMenuItem>
            Cut <ContextMenuShortcut>⌘X</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Paste <ContextMenuShortcut>⌘V</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
        <ContextMenuSeparator />
        <ContextMenuGroup>
          <ContextMenuLabel>View</ContextMenuLabel>
          <ContextMenuItem>
            Zoom In <ContextMenuShortcut>⌘+</ContextMenuShortcut>
          </ContextMenuItem>
          <ContextMenuItem>
            Zoom Out <ContextMenuShortcut>⌘-</ContextMenuShortcut>
          </ContextMenuItem>
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  ),
};

export const WithCheckbox: Story = {
  name: "With Checkbox Items",
  render: () => {
    function Example() {
      const [showStatus, setShowStatus] = useState(true);
      const [showActivity, setShowActivity] = useState(false);
      return (
        <ContextMenu>
          <ContextMenuTrigger className="flex h-48 w-80 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
            Right-click here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel>Columns</ContextMenuLabel>
              <ContextMenuCheckboxItem checked={showStatus} onCheckedChange={setShowStatus}>
                Status
              </ContextMenuCheckboxItem>
              <ContextMenuCheckboxItem checked={showActivity} onCheckedChange={setShowActivity}>
                Activity
              </ContextMenuCheckboxItem>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
    return <Example />;
  },
};

export const WithRadio: Story = {
  name: "With Radio Items",
  render: () => {
    function Example() {
      const [sort, setSort] = useState("date");
      return (
        <ContextMenu>
          <ContextMenuTrigger className="flex h-48 w-80 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
            Right-click here
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuGroup>
              <ContextMenuLabel>Sort by</ContextMenuLabel>
              <ContextMenuRadioGroup onValueChange={setSort} value={sort}>
                <ContextMenuRadioItem value="date">Date</ContextMenuRadioItem>
                <ContextMenuRadioItem value="name">Name</ContextMenuRadioItem>
                <ContextMenuRadioItem value="size">Size</ContextMenuRadioItem>
              </ContextMenuRadioGroup>
            </ContextMenuGroup>
          </ContextMenuContent>
        </ContextMenu>
      );
    }
    return <Example />;
  },
};

export const WithSubmenu: Story = {
  name: "With Submenu",
  render: () => (
    <ContextMenu>
      <ContextMenuTrigger className="flex h-48 w-80 items-center justify-center rounded-lg border border-dashed text-muted-foreground text-sm">
        Right-click here
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem>
          New File <ContextMenuShortcut>⌘N</ContextMenuShortcut>
        </ContextMenuItem>
        <ContextMenuSub>
          <ContextMenuSubTrigger>Share</ContextMenuSubTrigger>
          <ContextMenuSubContent>
            <ContextMenuItem>Email</ContextMenuItem>
            <ContextMenuItem>Slack</ContextMenuItem>
            <ContextMenuItem>Copy link</ContextMenuItem>
          </ContextMenuSubContent>
        </ContextMenuSub>
        <ContextMenuSeparator />
        <ContextMenuItem variant="destructive">Delete</ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  ),
};
