import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./carousel.tsx";

const meta = {
  title: "UI/Carousel",
  component: Carousel,
  parameters: { layout: "centered" },
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm px-12">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Carousel>;

export default meta;
type Story = StoryObj<typeof Carousel>;

const slides = [1, 2, 3, 4, 5];

export const Default: Story = {
  render: () => (
    <Carousel>
      <CarouselContent>
        {slides.map((n) => (
          <CarouselItem key={n}>
            <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted font-semibold text-2xl">
              {n}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const ThirdWidth: Story = {
  name: "Basis 1/3",
  render: () => (
    <Carousel opts={{ align: "start" }}>
      <CarouselContent>
        {slides.map((n) => (
          <CarouselItem className="basis-1/3" key={n}>
            <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted font-semibold text-lg">
              {n}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const HalfWidth: Story = {
  name: "Basis 1/2",
  render: () => (
    <Carousel opts={{ align: "start" }}>
      <CarouselContent>
        {slides.map((n) => (
          <CarouselItem className="basis-1/2" key={n}>
            <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted font-semibold text-lg">
              {n}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const Loop: Story = {
  render: () => (
    <Carousel opts={{ loop: true }}>
      <CarouselContent>
        {slides.map((n) => (
          <CarouselItem key={n}>
            <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted font-semibold text-2xl">
              {n}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};

export const Vertical: Story = {
  decorators: [
    (Story) => (
      <div className="w-full max-w-sm py-12">
        <Story />
      </div>
    ),
  ],
  render: () => (
    <Carousel className="max-h-72" orientation="vertical">
      <CarouselContent className="-mt-4 h-72">
        {slides.map((n) => (
          <CarouselItem className="pt-4" key={n}>
            <div className="flex aspect-square items-center justify-center rounded-xl border bg-muted font-semibold text-2xl">
              {n}
            </div>
          </CarouselItem>
        ))}
      </CarouselContent>
      <CarouselPrevious />
      <CarouselNext />
    </Carousel>
  ),
};
