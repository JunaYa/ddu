import type { Meta, StoryObj } from "@storybook/react-vite";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./hover-card.tsx";

const meta = {
  title: "UI/HoverCard",
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="flex min-h-40 items-center justify-center bg-background p-8 text-foreground">
        <Story />
      </div>
    ),
  ],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger href="#">@nextjs</HoverCardTrigger>
      <HoverCardContent>
        <div className="flex flex-col gap-2">
          <div className="font-semibold">Next.js</div>
          <p className="text-muted-foreground text-sm">
            The React Framework — created and maintained by @vercel.
          </p>
          <div className="flex items-center gap-4 text-muted-foreground text-xs">
            <span>Joined December 2021</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const ImageContent: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger href="#">Preview image</HoverCardTrigger>
      <HoverCardContent className="w-80">
        <img
          alt="Landscape"
          className="mb-2 rounded-md"
          src="https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=400&auto=format"
        />
        <p className="text-muted-foreground text-xs">A scenic forest landscape.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const SideTop: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger href="#">Hover me (top)</HoverCardTrigger>
      <HoverCardContent side="top">
        <p className="text-sm">This card appears above the trigger.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};

export const WithDelay: Story = {
  render: () => (
    <HoverCard>
      <HoverCardTrigger closeDelay={500} delay={800} href="#">
        Slow hover
      </HoverCardTrigger>
      <HoverCardContent>
        <p className="text-sm">Opens after 800ms, closes after 500ms.</p>
      </HoverCardContent>
    </HoverCard>
  ),
};
