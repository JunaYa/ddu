import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "../button/button.tsx";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogTitle,
  DialogTrigger,
} from "./dialog.tsx";

const meta = {
  title: "UI/Dialog",
  component: Dialog,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Dialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open Dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove all
            associated data from our servers.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button variant="destructive">Delete Account</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithScrollablePanel: Story = {
  name: "With Scrollable Panel",
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open Dialog</Button>} />
      <DialogContent className="max-h-[70vh]">
        <DialogHeader>
          <DialogTitle>Terms of Service</DialogTitle>
          <DialogDescription>Please read and accept the terms before continuing.</DialogDescription>
        </DialogHeader>
        <DialogPanel>
          {Array.from({ length: 8 }, (_, i) => (
            <p className="mb-4 text-muted-foreground text-sm last:mb-0" key={i}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
              incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
              exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure
              dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.
            </p>
          ))}
        </DialogPanel>
        <DialogFooter variant="bare">
          <DialogClose render={<Button variant="outline">Decline</Button>} />
          <Button>Accept Terms</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const BareFooter: Story = {
  name: "Bare Footer Variant",
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open Dialog</Button>} />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Save Changes</DialogTitle>
          <DialogDescription>
            You have unsaved changes. Would you like to save before leaving?
          </DialogDescription>
        </DialogHeader>
        <DialogFooter variant="bare">
          <DialogClose render={<Button variant="outline">Discard</Button>} />
          <Button>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const WithoutCloseButton: Story = {
  name: "Without Close Button",
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open Dialog</Button>} />
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>Confirm Action</DialogTitle>
          <DialogDescription>
            Dismissed via footer actions only — no X button in the corner.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose render={<Button variant="outline">Cancel</Button>} />
          <Button>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};

export const Nested: Story = {
  name: "Nested Dialogs",
  render: () => (
    <Dialog>
      <DialogTrigger render={<Button variant="outline">Open Dialog</Button>} />
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Parent Dialog</DialogTitle>
          <DialogDescription>
            Opening a nested dialog dims and scales the parent behind it.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter variant="bare">
          <DialogClose render={<Button variant="outline">Close</Button>} />
          <Dialog>
            <DialogTrigger render={<Button>Open Nested Dialog</Button>} />
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nested Dialog</DialogTitle>
                <DialogDescription>
                  The parent dialog is dimmed and scaled behind this one.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose render={<Button variant="outline">Close</Button>} />
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  ),
};
