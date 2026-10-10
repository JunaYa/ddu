import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconRenderer } from "../icons/icons.tsx";
import { UpsellCard } from "./upsell-card.tsx";

const meta = {
  title: "UI/UpsellCard",
  component: UpsellCard,
  tags: ["autodocs"],
  parameters: { layout: "padded" },
  argTypes: {
    radius: {
      control: "select",
      options: ["xs", "sm", "md", "default", "lg", "xl", "2xl", "3xl", "4xl"],
    },
  },
  decorators: [
    (Story) => (
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof UpsellCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    icon: <IconRenderer aria-hidden="true" name="materialSparkle" />,
    title: "Upgrade to Pro",
    description: "Unlock more credits and premium features.",
  },
};

export const SmallRadius: Story = {
  name: "Small radius",
  args: {
    icon: <IconRenderer aria-hidden="true" name="materialSparkle" />,
    title: "Upgrade to Pro",
    description: "Unlock more credits and premium features.",
    radius: "sm",
  },
};

export const WithoutDescription: Story = {
  name: "Without description",
  args: {
    icon: <IconRenderer aria-hidden="true" name="materialSparkle" />,
    title: "Upgrade to Pro",
  },
};

export const WithoutIcon: Story = {
  name: "Without icon",
  args: {
    title: "Upgrade to Pro",
    description: "Unlock more credits and premium features.",
  },
};

export const Clickable: Story = {
  args: {
    icon: <IconRenderer aria-hidden="true" name="materialSparkle" />,
    title: "Upgrade to Pro",
    description: "Unlock more credits and premium features.",
    onClick: () => {},
  },
};
