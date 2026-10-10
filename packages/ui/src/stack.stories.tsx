import type { Meta, StoryObj } from "@storybook/react-vite";
import { Stack } from "./stack.tsx";

interface DemoCard {
  id: string;
  title: string;
  description: string;
}

const cards: DemoCard[] = [
  {
    id: "one",
    title: "Captured idea",
    description: "Swipe to move through a compact review pile.",
  },
  {
    id: "two",
    title: "Generated artifact",
    description: "Behind cards peek in without scaling the text.",
  },
  {
    id: "three",
    title: "Saved note",
    description: "The primitive can cycle forever or finish as a finite stack.",
  },
];

const imageCards = [
  "https://images.unsplash.com/photo-1480074568708-e7b720bb3f09?q=80&w=500&auto=format",
  "https://images.unsplash.com/photo-1449844908441-8829872d2607?q=80&w=500&auto=format",
  "https://images.unsplash.com/photo-1452626212852-811d58933cae?q=80&w=500&auto=format",
  "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?q=80&w=500&auto=format",
];

function StackDemo({ mode = "cycle" }: { mode?: "cycle" | "finite" }) {
  return (
    <Stack
      cardClassName="border border-border bg-card p-4 shadow-sm"
      getKey={(card) => card.id}
      items={cards}
      mode={mode}
      renderCard={(card) => (
        <div className="flex h-full flex-col justify-end gap-2">
          <h3 className="font-medium text-lg leading-none">{card.title}</h3>
          <p className="line-clamp-2 text-muted-foreground text-sm">{card.description}</p>
        </div>
      )}
    />
  );
}

const meta = {
  title: "UI/Stack",
  component: StackDemo,
  decorators: [
    (Story) => (
      <div className="h-56 w-80">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "centered" },
} satisfies Meta<typeof StackDemo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Cycle: Story = {
  args: { mode: "cycle" },
};

export const Finite: Story = {
  args: { mode: "finite" },
};

export const Cards: Story = {
  render: () => (
    <Stack
      autoplay={false}
      autoplayDelay={3000}
      cardClassName="shadow-sm"
      cards={imageCards.map((src, index) => (
        <img
          alt={`card-${index + 1}`}
          className="h-full w-full object-cover"
          draggable={false}
          key={src}
          src={src}
        />
      ))}
      pauseOnHover={false}
      randomRotation
      sendToBackOnClick
      sensitivity={100}
    />
  ),
};
