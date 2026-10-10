import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Calendar } from "./calendar.tsx";

const meta = {
  title: "UI/Calendar",
  component: Calendar,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof Calendar>;

export const Default: Story = {
  render: () => {
    function Example() {
      const [date, setDate] = useState<Date | undefined>(new Date());
      return <Calendar mode="single" onSelect={setDate} selected={date} />;
    }
    return <Example />;
  },
};

export const RangeSelect: Story = {
  name: "Range Select",
  render: () => {
    function Example() {
      const [range, setRange] = useState<DateRange | undefined>({
        from: new Date(),
        to: new Date(Date.now() + 7 * 86_400_000),
      });
      return <Calendar mode="range" onSelect={setRange} selected={range} />;
    }
    return <Example />;
  },
};

export const MultipleSelect: Story = {
  name: "Multiple Select",
  render: () => {
    function Example() {
      const [dates, setDates] = useState<Date[]>([new Date()]);
      return <Calendar mode="multiple" onSelect={setDates} required selected={dates} />;
    }
    return <Example />;
  },
};

export const WithDropdowns: Story = {
  name: "With Dropdowns",
  render: () => (
    <Calendar
      captionLayout="dropdown"
      defaultMonth={new Date()}
      endMonth={new Date(2030, 11)}
      startMonth={new Date(2020, 0)}
    />
  ),
};

export const TwoMonths: Story = {
  name: "Two Months",
  render: () => {
    function Example() {
      const [range, setRange] = useState<DateRange | undefined>();
      return <Calendar mode="range" numberOfMonths={2} onSelect={setRange} selected={range} />;
    }
    return <Example />;
  },
};

export const DisabledDates: Story = {
  name: "Disabled Dates",
  render: () => <Calendar disabled={{ before: new Date() }} />,
};
