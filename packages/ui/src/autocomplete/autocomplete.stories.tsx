import type { Meta, StoryObj } from "@storybook/react-vite";
import { Search } from "lucide-react";
import {
  Autocomplete,
  AutocompleteEmpty,
  AutocompleteGroup,
  AutocompleteGroupLabel,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
  AutocompletePopup,
  AutocompleteValue,
} from "./autocomplete.tsx";

const meta = {
  title: "UI/Autocomplete",
  component: Autocomplete,
  parameters: { layout: "centered" },
} satisfies Meta<typeof Autocomplete>;

export default meta;
type Story = StoryObj<typeof Autocomplete>;

const fruits = [
  "Apple",
  "Banana",
  "Blueberry",
  "Cherry",
  "Grape",
  "Lemon",
  "Mango",
  "Orange",
  "Peach",
  "Pear",
  "Pineapple",
  "Strawberry",
];

function BasicExample({
  showTrigger = false,
  showClear = false,
  size,
}: {
  showTrigger?: boolean;
  showClear?: boolean;
  size?: "sm" | "default";
}) {
  return (
    <Autocomplete items={fruits}>
      <AutocompleteInput
        className="w-64"
        placeholder="Search fruits…"
        showClear={showClear}
        showTrigger={showTrigger}
        size={size}
      />
      <AutocompletePopup>
        <AutocompleteList>
          <AutocompleteEmpty>No results found.</AutocompleteEmpty>
          <AutocompleteItem value="Apple">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Banana">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Blueberry">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Cherry">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Grape">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Lemon">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Mango">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Orange">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Peach">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Pear">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Pineapple">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Strawberry">
            <AutocompleteValue />
          </AutocompleteItem>
        </AutocompleteList>
      </AutocompletePopup>
    </Autocomplete>
  );
}

export const Default: Story = {
  render: () => <BasicExample />,
};

export const WithTrigger: Story = {
  name: "With Trigger",
  render: () => <BasicExample showTrigger />,
};

export const WithClear: Story = {
  name: "With Clear",
  render: () => <BasicExample showClear />,
};

export const WithStartAddon: Story = {
  name: "With Start Addon",
  render: () => (
    <Autocomplete items={fruits}>
      <AutocompleteInput className="w-64" placeholder="Search…" showClear startAddon={<Search />} />
      <AutocompletePopup>
        <AutocompleteList>
          <AutocompleteEmpty>No results found.</AutocompleteEmpty>
          <AutocompleteItem value="Apple">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Banana">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Blueberry">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Cherry">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Grape">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Lemon">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Mango">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Orange">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Peach">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Pear">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Pineapple">
            <AutocompleteValue />
          </AutocompleteItem>
          <AutocompleteItem value="Strawberry">
            <AutocompleteValue />
          </AutocompleteItem>
        </AutocompleteList>
      </AutocompletePopup>
    </Autocomplete>
  ),
};

export const Small: Story = {
  name: "Small Size",
  render: () => <BasicExample showTrigger size="sm" />,
};

const groupedItems = [
  { items: ["Lemon", "Lime", "Orange", "Grapefruit"], label: "Citrus" },
  { items: ["Blueberry", "Strawberry", "Raspberry", "Blackberry"], label: "Berries" },
  { items: ["Mango", "Pineapple", "Papaya", "Coconut"], label: "Tropical" },
];

export const Grouped: Story = {
  render: () => (
    <Autocomplete items={groupedItems}>
      <AutocompleteInput className="w-64" placeholder="Search fruits…" showTrigger />
      <AutocompletePopup>
        <AutocompleteList>
          <AutocompleteEmpty>No results found.</AutocompleteEmpty>
          {groupedItems.map((group) => (
            <AutocompleteGroup key={group.label}>
              <AutocompleteGroupLabel>{group.label}</AutocompleteGroupLabel>
              {group.items.map((item) => (
                <AutocompleteItem key={item} value={item}>
                  <AutocompleteValue />
                </AutocompleteItem>
              ))}
            </AutocompleteGroup>
          ))}
        </AutocompleteList>
      </AutocompletePopup>
    </Autocomplete>
  ),
};
