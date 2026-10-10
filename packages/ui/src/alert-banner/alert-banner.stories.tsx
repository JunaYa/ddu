import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertBanner } from "./alert-banner.tsx";
import { Button } from "../button/button.tsx";
import { Icons } from "../icons/icons.tsx";

const meta = {
  title: "UI/AlertBanner",
  component: AlertBanner,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["error", "info", "success", "warning"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-full max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AlertBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Error: Story = {
  args: {
    message: "Something went wrong while processing your request.",
    variant: "error",
  },
};

export const ErrorWithDescription: Story = {
  name: "Error with description",
  args: {
    description: "voice-2026-05-19.m4a",
    dismissLabel: "Dismiss",
    message: "Upload failed. Check your connection and try recording again.",
    onDismiss: () => undefined,
    variant: "error",
  },
};

export const Info: Story = {
  args: {
    message: "Your note is still being indexed. Search results may be incomplete.",
    variant: "info",
  },
};

export const InfoDismissible: Story = {
  name: "Info dismissible",
  args: {
    dismissLabel: "Dismiss",
    message: "Tip: You can queue messages while the agent is responding.",
    onDismiss: () => undefined,
    variant: "info",
  },
};

export const Warning: Story = {
  args: {
    message: "This action cannot be undone.",
    variant: "warning",
  },
};

export const Success: Story = {
  args: {
    message: "Voice note uploaded successfully.",
    variant: "success",
  },
};

export const LongMessage: Story = {
  name: "Long message",
  args: {
    dismissLabel: "Dismiss",
    message:
      "Upload failed because the connection dropped mid-transfer. Check your network, then try recording again.",
    onDismiss: () => undefined,
    variant: "error",
  },
};

export const WithActions: Story = {
  name: "With actions",
  args: {
    description: "2 messages remaining",
    message: "Network error — request timed out",
    variant: "error",
  },
  render: (args) => (
    <AlertBanner
      {...args}
      actions={
        <div className="flex items-center gap-0.5">
          <Button aria-label="Retry" size="icon-xs" type="button" variant="ghost">
            <Icons.rotateCcw aria-hidden="true" className="size-3.5" />
          </Button>
          <Button aria-label="Skip" size="icon-xs" type="button" variant="ghost">
            <Icons.skipForward aria-hidden="true" className="size-3.5" />
          </Button>
          <Button aria-label="Clear" size="icon-xs" type="button" variant="ghost-destructive">
            <Icons.trash aria-hidden="true" className="size-3.5" />
          </Button>
        </div>
      }
    />
  ),
};

export const WithActionButton: Story = {
  name: "With action button",
  args: {
    message: "Payment failed",
    description: "Payment failed — update your card to keep Digest.",
    variant: "error",
  },
  render: (args) => (
    <AlertBanner
      {...args}
      actions={
        <Button size="xs" type="button" variant="destructive">
          Update card
        </Button>
      }
    />
  ),
};

export const AllVariants: Story = {
  name: "All variants",
  args: {
    message: "Preview",
    variant: "error",
  },
  render: () => (
    <div className="flex flex-col gap-3">
      <AlertBanner message="Something went wrong." variant="error" />
      <AlertBanner
        description="voice-2026-05-19.m4a"
        dismissLabel="Dismiss"
        message="Upload failed. Check your connection and try recording again."
        onDismiss={() => undefined}
        variant="error"
      />
      <AlertBanner message="Helpful context while you wait." variant="info" />
      <AlertBanner message="Proceed with caution." variant="warning" />
      <AlertBanner message="Changes saved." variant="success" />
    </div>
  ),
};
