import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  XAxis,
  YAxis,
} from "recharts";
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "./chart.tsx";

const meta = {
  title: "UI/Chart",
  component: ChartContainer,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ChartContainer>;

export default meta;
type Story = StoryObj<typeof ChartContainer>;

const barData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
];

const barConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

export const BarChartStory: Story = {
  name: "Bar Chart",
  render: () => (
    <ChartContainer className="max-h-64 w-full" config={barConfig}>
      <BarChart data={barData}>
        <CartesianGrid vertical={false} />
        <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
        <Bar dataKey="mobile" fill="var(--color-mobile)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};

const lineData = [
  { month: "Jan", desktop: 186, mobile: 80 },
  { month: "Feb", desktop: 305, mobile: 200 },
  { month: "Mar", desktop: 237, mobile: 120 },
  { month: "Apr", desktop: 73, mobile: 190 },
  { month: "May", desktop: 209, mobile: 130 },
  { month: "Jun", desktop: 214, mobile: 140 },
];

const lineConfig = {
  desktop: { label: "Desktop", color: "var(--chart-1)" },
  mobile: { label: "Mobile", color: "var(--chart-2)" },
} satisfies ChartConfig;

export const LineChartStory: Story = {
  name: "Line Chart",
  render: () => (
    <ChartContainer className="max-h-64 w-full" config={lineConfig}>
      <LineChart data={lineData}>
        <CartesianGrid vertical={false} />
        <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Line
          dataKey="desktop"
          dot={false}
          stroke="var(--color-desktop)"
          strokeWidth={2}
          type="monotone"
        />
        <Line
          dataKey="mobile"
          dot={false}
          stroke="var(--color-mobile)"
          strokeWidth={2}
          type="monotone"
        />
      </LineChart>
    </ChartContainer>
  ),
};

const pieData = [
  { name: "chrome", value: 275, fill: "var(--color-chrome)" },
  { name: "safari", value: 200, fill: "var(--color-safari)" },
  { name: "firefox", value: 187, fill: "var(--color-firefox)" },
  { name: "edge", value: 173, fill: "var(--color-edge)" },
  { name: "other", value: 90, fill: "var(--color-other)" },
];

const pieConfig = {
  chrome: { label: "Chrome", color: "var(--chart-1)" },
  safari: { label: "Safari", color: "var(--chart-2)" },
  firefox: { label: "Firefox", color: "var(--chart-3)" },
  edge: { label: "Edge", color: "var(--chart-4)" },
  other: { label: "Other", color: "var(--chart-5)" },
} satisfies ChartConfig;

export const PieChartStory: Story = {
  name: "Pie Chart",
  render: () => (
    <ChartContainer className="mx-auto aspect-square max-h-64" config={pieConfig}>
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent hideLabel />} />
        <Pie data={pieData} dataKey="value" innerRadius={60} nameKey="name" />
      </PieChart>
    </ChartContainer>
  ),
};

export const WithYAxis: Story = {
  name: "With Y Axis",
  render: () => (
    <ChartContainer className="max-h-64 w-full" config={barConfig}>
      <BarChart data={barData}>
        <CartesianGrid vertical={false} />
        <XAxis axisLine={false} dataKey="month" tickLine={false} tickMargin={8} />
        <YAxis axisLine={false} tickLine={false} tickMargin={8} />
        <ChartTooltip content={<ChartTooltipContent indicator="line" />} />
        <Bar dataKey="desktop" fill="var(--color-desktop)" radius={4} />
      </BarChart>
    </ChartContainer>
  ),
};
