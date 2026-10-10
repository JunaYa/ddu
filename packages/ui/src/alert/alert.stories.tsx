import type { Meta, StoryObj } from "@storybook/react-vite";
import { AlertCircle, CheckCircle2, Info, Loader2, RefreshCw, TriangleAlert } from "lucide-react";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert.tsx";
import { Button } from "../button/button.tsx";

const meta = {
  title: "UI/Alert",
  component: Alert,
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "default",
        "error",
        "warning",
        "success",
        "info",
        "errorGradient",
        "warningGradient",
        "successGradient",
        "infoGradient",
      ],
    },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: { variant: "default" },
  render: (args) => (
    <Alert {...args}>
      <Info />
      <AlertTitle>Heads up</AlertTitle>
      <AlertDescription>You can change your display settings at any time.</AlertDescription>
    </Alert>
  ),
};

export const Error: Story = {
  args: { variant: "error" },
  render: (args) => (
    <Alert {...args}>
      <AlertCircle />
      <AlertTitle>Failed to process</AlertTitle>
      <AlertDescription>
        The file could not be parsed. Check that it is a supported format and try again.
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline">
          <RefreshCw />
          Retry
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const Warning: Story = {
  args: { variant: "warning" },
  render: (args) => (
    <Alert {...args}>
      <Loader2 className="animate-spin" />
      <AlertTitle>Processing content…</AlertTitle>
      <AlertDescription>We are analyzing and extracting content from your note.</AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  args: { variant: "success" },
  render: (args) => (
    <Alert {...args}>
      <CheckCircle2 />
      <AlertTitle>Changes saved</AlertTitle>
      <AlertDescription>Your preferences have been updated successfully.</AlertDescription>
    </Alert>
  ),
};

export const InfoVariant: Story = {
  name: "Info",
  args: { variant: "info" },
  render: (args) => (
    <Alert {...args}>
      <Info />
      <AlertTitle>New features available</AlertTitle>
      <AlertDescription>
        A new version is available with improved AI suggestions and faster search.
      </AlertDescription>
    </Alert>
  ),
};

export const AllVariants: Story = {
  name: "All Variants",
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <Alert variant="default">
        <Info />
        <AlertTitle>Default</AlertTitle>
        <AlertDescription>Neutral informational message.</AlertDescription>
      </Alert>
      <Alert variant="info">
        <Info />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>Something worth knowing about.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <CheckCircle2 />
        <AlertTitle>Success</AlertTitle>
        <AlertDescription>Operation completed successfully.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <TriangleAlert />
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>Proceed with caution.</AlertDescription>
      </Alert>
      <Alert variant="error">
        <AlertCircle />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    </div>
  ),
};

export const WithAction: Story = {
  name: "With Action",
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <Alert variant="error">
        <AlertCircle />
        <AlertTitle>Failed to sync</AlertTitle>
        <AlertDescription>
          Could not connect to the server. Check your connection and try again.
        </AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline">
            <RefreshCw />
            Retry
          </Button>
        </AlertAction>
      </Alert>
      <Alert variant="warning">
        <TriangleAlert />
        <AlertTitle>Storage almost full</AlertTitle>
        <AlertDescription>You are using 90% of your storage quota.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline">
            Manage storage
          </Button>
        </AlertAction>
      </Alert>
    </div>
  ),
};

export const GradientVariants: Story = {
  name: "Gradient Variants",
  render: () => (
    <div className="flex max-w-xl flex-col gap-3">
      <Alert variant="errorGradient">
        <AlertCircle />
        <AlertTitle>Failed to process</AlertTitle>
        <AlertDescription>
          The file could not be parsed. Check that it is a supported format.
        </AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline">
            <RefreshCw />
            Retry
          </Button>
        </AlertAction>
      </Alert>
      <Alert variant="warningGradient">
        <Loader2 className="animate-spin" />
        <AlertTitle>Processing content…</AlertTitle>
        <AlertDescription>We are analyzing and extracting content from your note.</AlertDescription>
      </Alert>
      <Alert variant="successGradient">
        <CheckCircle2 />
        <AlertTitle>Changes saved</AlertTitle>
        <AlertDescription>Your preferences have been updated successfully.</AlertDescription>
      </Alert>
      <Alert variant="infoGradient">
        <Info />
        <AlertTitle>New features available</AlertTitle>
        <AlertDescription>
          A new version is available with improved AI suggestions.
        </AlertDescription>
      </Alert>
    </div>
  ),
};
