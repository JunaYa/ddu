import type { Meta, StoryObj } from "@storybook/react-vite";
import { Mail, Search } from "lucide-react";
import { Button } from "../button/button.tsx";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group.tsx";

const meta = {
  title: "UI/Input Group",
  component: InputGroup,
  parameters: { layout: "centered" },
} satisfies Meta<typeof InputGroup>;

export default meta;
type Story = StoryObj<typeof InputGroup>;

export const WithIcon: Story = {
  name: "With Icon",
  render: () => (
    <div className="w-80">
      <InputGroup>
        <InputGroupAddon>
          <Search className="text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search..." />
      </InputGroup>
    </div>
  ),
};

export const WithText: Story = {
  name: "With Text Addon",
  render: () => (
    <div className="w-80">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>https://</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="example.com" />
      </InputGroup>
    </div>
  ),
};

export const WithEndAddon: Story = {
  name: "With End Addon",
  render: () => (
    <div className="w-80">
      <InputGroup>
        <InputGroupAddon>
          <Mail className="text-muted-foreground" />
        </InputGroupAddon>
        <InputGroupInput placeholder="Email address" />
        <InputGroupAddon align="inline-end">
          <Button size="sm">Subscribe</Button>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};

export const WithTextarea: Story = {
  name: "With Textarea",
  render: () => (
    <div className="w-80">
      <InputGroup>
        <InputGroupAddon align="block-start">
          <InputGroupText>Message</InputGroupText>
        </InputGroupAddon>
        <InputGroupTextarea placeholder="Type your message..." />
      </InputGroup>
    </div>
  ),
};

export const BothAddons: Story = {
  name: "Both Addons",
  render: () => (
    <div className="w-80">
      <InputGroup>
        <InputGroupAddon>
          <InputGroupText>$</InputGroupText>
        </InputGroupAddon>
        <InputGroupInput placeholder="0.00" />
        <InputGroupAddon align="inline-end">
          <InputGroupText>USD</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
};
