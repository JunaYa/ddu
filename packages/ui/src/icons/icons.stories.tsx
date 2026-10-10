import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconBadge, type IconName, IconRenderer } from "./icons.tsx";

const meta = {
  title: "UI/Icons",
  component: IconRenderer,
  parameters: { layout: "padded" },
} satisfies Meta<typeof IconRenderer>;

export default meta;
type Story = StoryObj<typeof IconRenderer>;

const productIcons: IconName[] = [
  "note",
  "collection",
  "artifact",
  "conversation",
  "newChat",
  "newNote",
  "saveNote",
  "pin",
  "pinOff",
  "suggestion",
];

const artifactIcons: IconName[] = [
  "artifactFile",
  "artifactImage",
  "artifactVideo",
  "artifactAudio",
  "artifactCode",
  "artifactSpreadsheet",
  "artifactPresentation",
];

const commonIcons: IconName[] = [
  "home",
  "search",
  "settings",
  "plus",
  "edit",
  "trash",
  "copy",
  "download",
  "upload",
  "share",
  "filter",
  "check",
  "close",
  "arrowLeft",
  "arrowRight",
  "chevronDown",
  "chevronRight",
  "sparkles",
  "bot",
  "bell",
  "user",
  "bookmark",
  "tag",
];

const actionIcons: IconName[] = ["drag", "resize", "expand", "remove", "stats", "inbox"];

const sourceIcons: IconName[] = ["notion", "obsidian", "googleDrive", "twitter"];

function IconGrid({ icons }: { icons: IconName[] }) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-3">
      {icons.map((name) => (
        <div className="flex flex-col items-center gap-2 rounded-lg border p-3" key={name}>
          <IconRenderer className="size-5" name={name} />
          <span className="w-full truncate text-center text-[10px] text-muted-foreground">
            {name}
          </span>
        </div>
      ))}
    </div>
  );
}

export const ProductIcons: Story = {
  name: "Product Icons",
  render: () => <IconGrid icons={productIcons} />,
};

export const ArtifactIcons: Story = {
  name: "Artifact Icons",
  render: () => <IconGrid icons={artifactIcons} />,
};

export const CommonIcons: Story = {
  name: "Common Icons",
  render: () => <IconGrid icons={commonIcons} />,
};

export const ActionIcons: Story = {
  name: "Action Icons",
  render: () => <IconGrid icons={actionIcons} />,
};

export const SourceIcons: Story = {
  name: "Source Icons",
  render: () => <IconGrid icons={sourceIcons} />,
};

export const IconBadges: Story = {
  name: "Icon Badges",
  render: () => (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="font-medium text-sm">Sizes</p>
        <div className="flex items-center gap-3">
          <IconBadge icon="note" size="sm" />
          <IconBadge icon="note" size="md" />
          <IconBadge icon="note" size="lg" />
        </div>
      </div>
      <div className="space-y-2">
        <p className="font-medium text-sm">Variants</p>
        <div className="flex items-center gap-3">
          <IconBadge icon="collection" variant="default" />
          <IconBadge icon="collection" variant="muted" />
          <IconBadge icon="collection" variant="primary" />
          <IconBadge icon="collection" variant="destructive" />
        </div>
      </div>
    </div>
  ),
};
