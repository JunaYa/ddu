import type { Meta, StoryObj } from "@storybook/react-vite";
import { Calculator, Calendar, CreditCard, Search, Settings, Smile, User } from "lucide-react";
import { useState } from "react";
import { Button } from "../button/button.tsx";
import {
  Command,
  CommandDialog,
  CommandDialogPopup,
  CommandDialogTrigger,
  CommandEmpty,
  CommandFooter,
  CommandGroup,
  CommandGroupLabel,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPanel,
  CommandSeparator,
  CommandShortcut,
} from "./command.tsx";

const meta = {
  title: "UI/Command",
  component: Command,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Command>;

export default meta;
type Story = StoryObj<typeof Command>;

export const Default: Story = {
  render: () => (
    <div className="w-80 rounded-xl border shadow-md">
      <Command>
        <CommandInput placeholder="Type a command or search…" />
        <CommandPanel>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandGroupLabel>Suggestions</CommandGroupLabel>
              <CommandItem>
                <Calendar className="mr-2 size-4" /> Calendar
              </CommandItem>
              <CommandItem>
                <Smile className="mr-2 size-4" /> Search Emoji
              </CommandItem>
              <CommandItem>
                <Calculator className="mr-2 size-4" /> Calculator
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup>
              <CommandGroupLabel>Settings</CommandGroupLabel>
              <CommandItem>
                <User className="mr-2 size-4" /> Profile <CommandShortcut>⌘P</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <CreditCard className="mr-2 size-4" /> Billing <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem>
                <Settings className="mr-2 size-4" /> Settings <CommandShortcut>⌘S</CommandShortcut>
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandPanel>
      </Command>
    </div>
  ),
};

export const WithFooter: Story = {
  name: "With Footer",
  render: () => (
    <div className="w-80 rounded-xl border shadow-md">
      <Command>
        <CommandInput placeholder="Search…" />
        <CommandPanel>
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup>
              <CommandGroupLabel>Actions</CommandGroupLabel>
              <CommandItem>
                <Search className="mr-2 size-4" /> Search notes
              </CommandItem>
              <CommandItem>
                <Calendar className="mr-2 size-4" /> Open calendar
              </CommandItem>
              <CommandItem>
                <Settings className="mr-2 size-4" /> Open settings
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandPanel>
        <CommandFooter>
          <span>↑↓ Navigate</span>
          <span>↵ Select</span>
          <span>Esc Close</span>
        </CommandFooter>
      </Command>
    </div>
  ),
};

export const Loading: Story = {
  name: "Loading",
  render: () => (
    <div className="w-80 rounded-xl border shadow-md">
      <Command>
        {/* The spinner takes the search glyph's slot, so the rows below hold
            their position while a query is in flight. */}
        <CommandInput loading loadingLabel="Searching…" placeholder="Search…" />
        <CommandPanel>
          <CommandList>
            <CommandGroup>
              <CommandGroupLabel>Suggestions</CommandGroupLabel>
              <CommandItem>
                <Calendar className="mr-2 size-4" /> Calendar
              </CommandItem>
              <CommandItem>
                <Calculator className="mr-2 size-4" /> Calculator
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandPanel>
      </Command>
    </div>
  ),
};

export const InDialog: Story = {
  name: "In Dialog",
  render: () => {
    function Example() {
      const [open, setOpen] = useState(false);
      return (
        <CommandDialog onOpenChange={setOpen} open={open}>
          <CommandDialogTrigger render={<Button variant="outline" />}>
            <Search className="size-4" />
            Search…
            <kbd className="ml-auto rounded border bg-muted px-1.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </CommandDialogTrigger>
          <CommandDialogPopup>
            <Command>
              <CommandInput placeholder="Type a command or search…" />
              <CommandPanel>
                <CommandList>
                  <CommandEmpty>No results found.</CommandEmpty>
                  <CommandGroup>
                    <CommandGroupLabel>Suggestions</CommandGroupLabel>
                    <CommandItem>
                      <Calendar className="mr-2 size-4" /> Calendar
                    </CommandItem>
                    <CommandItem>
                      <Smile className="mr-2 size-4" /> Search Emoji
                    </CommandItem>
                    <CommandItem>
                      <Calculator className="mr-2 size-4" /> Calculator
                    </CommandItem>
                  </CommandGroup>
                  <CommandSeparator />
                  <CommandGroup>
                    <CommandGroupLabel>Settings</CommandGroupLabel>
                    <CommandItem>
                      <User className="mr-2 size-4" /> Profile <CommandShortcut>⌘P</CommandShortcut>
                    </CommandItem>
                    <CommandItem>
                      <CreditCard className="mr-2 size-4" /> Billing{" "}
                      <CommandShortcut>⌘B</CommandShortcut>
                    </CommandItem>
                    <CommandItem>
                      <Settings className="mr-2 size-4" /> Settings{" "}
                      <CommandShortcut>⌘S</CommandShortcut>
                    </CommandItem>
                  </CommandGroup>
                </CommandList>
              </CommandPanel>
              <CommandFooter>
                <span>↑↓ Navigate</span>
                <span>↵ Select</span>
                <span>Esc Close</span>
              </CommandFooter>
            </Command>
          </CommandDialogPopup>
        </CommandDialog>
      );
    }
    return <Example />;
  },
};
