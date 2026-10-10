import type { Meta, StoryObj } from "@storybook/react-vite";
import { Skeleton } from "./skeleton.tsx";

const meta = {
  title: "UI/Skeleton",
  component: Skeleton,
  parameters: { layout: "padded" },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "rainbow"],
    },
  },
} satisfies Meta<typeof Skeleton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { variant: "default", className: "h-6 w-48 rounded-md" },
};

export const Rainbow: Story = {
  args: { variant: "rainbow", className: "h-6 w-48 rounded-md" },
};

export const Comparison: Story = {
  name: "Side by side",
  render: () => (
    <div className="flex flex-col gap-8">
      {(["default", "rainbow"] as const).map((variant) => (
        <div className="flex flex-col gap-3" key={variant}>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {variant}
          </p>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-4 w-3/4 rounded" variant={variant} />
            <Skeleton className="h-4 w-full rounded" variant={variant} />
            <Skeleton className="h-4 w-1/2 rounded" variant={variant} />
          </div>
        </div>
      ))}
    </div>
  ),
};

export const CommonShapes: Story = {
  name: "Common shapes",
  render: () => (
    <div className="flex flex-col gap-10">
      {(["default", "rainbow"] as const).map((variant) => (
        <div className="flex flex-col gap-4" key={variant}>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {variant}
          </p>

          {/* Card with avatar + text */}
          <div className="flex items-start gap-3">
            <Skeleton className="size-10 shrink-0 rounded-full" variant={variant} />
            <div className="flex flex-1 flex-col gap-2 pt-0.5">
              <Skeleton className="h-4 w-1/3 rounded" variant={variant} />
              <Skeleton className="h-3.5 w-full rounded" variant={variant} />
              <Skeleton className="h-3.5 w-4/5 rounded" variant={variant} />
            </div>
          </div>

          {/* Image placeholder */}
          <Skeleton className="aspect-video w-full rounded-xl" variant={variant} />

          {/* Card grid */}
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div className="flex flex-col gap-2" key={i}>
                <Skeleton className="aspect-square w-full rounded-lg" variant={variant} />
                <Skeleton className="h-3.5 w-3/4 rounded" variant={variant} />
                <Skeleton className="h-3 w-1/2 rounded" variant={variant} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};

export const AiImageGenerating: Story = {
  name: "AI image generating (rainbow)",
  render: () => (
    <div className="flex flex-col gap-6">
      {/* Single large image placeholder */}
      <div className="flex flex-col gap-2">
        <Skeleton className="aspect-square w-64 rounded-2xl" variant="rainbow" />
        <p className="text-center text-muted-foreground text-xs">Generating image…</p>
      </div>

      {/* Grid — mixed generating + done */}
      <div className="grid grid-cols-4 gap-2">
        <Skeleton className="aspect-square rounded-xl" variant="rainbow" />
        <Skeleton className="aspect-square rounded-xl" variant="rainbow" />
        <div className="aspect-square rounded-xl bg-muted" />
        <div className="aspect-square rounded-xl bg-muted" />
      </div>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6">
      {(["default", "rainbow"] as const).map((variant) => (
        <div className="flex flex-col gap-3" key={variant}>
          <p className="font-medium text-muted-foreground text-xs uppercase tracking-wider">
            {variant}
          </p>
          <div className="flex items-end gap-3">
            {[
              { label: "xs", cls: "h-3 w-16 rounded" },
              { label: "sm", cls: "h-4 w-24 rounded" },
              { label: "md", cls: "h-6 w-32 rounded-md" },
              { label: "lg", cls: "h-8 w-40 rounded-lg" },
              { label: "avatar", cls: "size-10 rounded-full" },
              { label: "card", cls: "h-24 w-36 rounded-xl" },
            ].map(({ label, cls }) => (
              <div className="flex flex-col items-center gap-1.5" key={label}>
                <Skeleton className={cls} variant={variant} />
                <span className="text-[10px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  ),
};
