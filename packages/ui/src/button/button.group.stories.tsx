import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ChevronDown,
  Italic,
  Underline,
} from "lucide-react";
import { Button } from "./button.tsx";
import { ButtonGroup, ButtonGroupSeparator, ButtonGroupText } from "./button.group.tsx";

const meta = {
  title: "UI/Button Group",
  component: ButtonGroup,
  parameters: { layout: "centered" },
  argTypes: {
    orientation: {
      control: "select",
      options: ["horizontal", "vertical"],
    },
  },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: () => (
    <ButtonGroup>
      <Button variant="outline">First</Button>
      <Button variant="outline">Second</Button>
      <Button variant="outline">Third</Button>
    </ButtonGroup>
  ),
};

export const TextFormatting: Story = {
  name: "Text Formatting",
  render: () => (
    <ButtonGroup>
      <Button size="icon" variant="outline">
        <Bold />
      </Button>
      <Button size="icon" variant="outline">
        <Italic />
      </Button>
      <Button size="icon" variant="outline">
        <Underline />
      </Button>
    </ButtonGroup>
  ),
};

export const Alignment: Story = {
  render: () => (
    <ButtonGroup>
      <Button size="icon" variant="outline">
        <AlignLeft />
      </Button>
      <Button size="icon" variant="outline">
        <AlignCenter />
      </Button>
      <Button size="icon" variant="outline">
        <AlignRight />
      </Button>
    </ButtonGroup>
  ),
};

export const WithSeparator: Story = {
  name: "With Separator",
  render: () => (
    <ButtonGroup>
      <Button variant="outline">Copy</Button>
      <ButtonGroupSeparator />
      <Button variant="outline">Paste</Button>
      <ButtonGroupSeparator />
      <Button variant="outline">Cut</Button>
    </ButtonGroup>
  ),
};

export const WithText: Story = {
  name: "With Text Label",
  render: () => (
    <ButtonGroup>
      <ButtonGroupText>Page 1 of 10</ButtonGroupText>
      <Button variant="outline">Previous</Button>
      <Button variant="outline">Next</Button>
    </ButtonGroup>
  ),
};

export const SplitButton: Story = {
  name: "Split Button",
  render: () => (
    <ButtonGroup>
      <Button>Save</Button>
      <Button size="icon">
        <ChevronDown />
      </Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ButtonGroup orientation="vertical">
      <Button variant="outline">Top</Button>
      <Button variant="outline">Middle</Button>
      <Button variant="outline">Bottom</Button>
    </ButtonGroup>
  ),
};

export const Mixed: Story = {
  name: "Mixed Variants",
  render: () => (
    <div className="flex flex-col items-start gap-4">
      <ButtonGroup>
        <Button variant="outline">First</Button>
        <Button variant="outline">Second</Button>
        <Button variant="outline">Third</Button>
      </ButtonGroup>
      <ButtonGroup>
        <Button size="icon" variant="outline">
          <Bold />
        </Button>
        <Button size="icon" variant="outline">
          <Italic />
        </Button>
        <Button size="icon" variant="outline">
          <Underline />
        </Button>
        <ButtonGroupSeparator />
        <Button size="icon" variant="outline">
          <AlignLeft />
        </Button>
        <Button size="icon" variant="outline">
          <AlignCenter />
        </Button>
        <Button size="icon" variant="outline">
          <AlignRight />
        </Button>
      </ButtonGroup>
      <ButtonGroup orientation="vertical">
        <Button variant="outline">Option A</Button>
        <Button variant="outline">Option B</Button>
        <Button variant="outline">Option C</Button>
      </ButtonGroup>
    </div>
  ),
};
