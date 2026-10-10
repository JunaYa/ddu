import type { Meta, StoryObj } from "@storybook/react-vite";
import { AppIcon, BrandGlyph } from "./brand/index.ts";
import { IconBadge, type IconName, IconRenderer, iconNames } from "./icons/index.ts";
import { LineArtIcon, type LineArtIconName, lineArtAssets } from "./line-art/index.ts";
import { LineGraphic, type LineGraphicName, lineGraphicAssets } from "./line-graphics/index.ts";
import { SocialIcon, type SocialIconName, socialRegistry } from "./social/index.ts";
import { ToolIcon, type ToolIconName } from "./tools/index.ts";

const meta = {
  title: "Iconography/Catalog",
  parameters: {
    layout: "padded",
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const lineArtNames = Object.keys(lineArtAssets) as LineArtIconName[];
const lineGraphicNames = Object.keys(lineGraphicAssets) as LineGraphicName[];
const socialNames = Object.keys(socialRegistry) as SocialIconName[];
const toolNames: ToolIconName[] = ["vite", "notion", "obsidian", "notebooklm"];

function Tile({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <div className="flex min-h-24 flex-col items-center justify-center gap-3 rounded-lg border bg-background p-3">
      <div className="flex min-h-10 items-center justify-center">{children}</div>
      <span className="w-full truncate text-center text-muted-foreground text-xs">{label}</span>
    </div>
  );
}

function Grid({ children, min = 112 }: { children: React.ReactNode; min?: number }) {
  return (
    <div
      className="grid gap-3"
      style={{ gridTemplateColumns: `repeat(auto-fill, minmax(${min}px, 1fr))` }}
    >
      {children}
    </div>
  );
}

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="space-y-3">
      <h2 className="font-medium text-sm">{title}</h2>
      {children}
    </section>
  );
}

export const PlaceholderBrand: Story = {
  name: "Placeholder Brand",
  render: () => (
    <Grid min={160}>
      <Tile label="AppIcon">
        <AppIcon size={80} />
      </Tile>
      <Tile label="BrandGlyph">
        <BrandGlyph animate={false} size={96} />
      </Tile>
    </Grid>
  ),
};

export const LineArt: Story = {
  name: "Line Art",
  render: () => (
    <Grid min={132}>
      {lineArtNames.map((name) => (
        <Tile key={name} label={name}>
          <LineArtIcon className="text-foreground" name={name} size={72} />
        </Tile>
      ))}
    </Grid>
  ),
};

export const LineGraphics: Story = {
  name: "Line Graphics",
  render: () => (
    <Grid min={180}>
      {lineGraphicNames.map((name) => (
        <Tile key={name} label={name}>
          <LineGraphic className="text-foreground" name={name} width={132} />
        </Tile>
      ))}
    </Grid>
  ),
};

export const SocialIcons: Story = {
  name: "Social Icons",
  render: () => (
    <Grid min={104}>
      {socialNames.map((name) => (
        <Tile key={name} label={name}>
          <SocialIcon name={name} size={28} />
        </Tile>
      ))}
    </Grid>
  ),
};

export const ToolIcons: Story = {
  name: "Tool Icons",
  render: () => (
    <Grid min={120}>
      {toolNames.map((name) => (
        <Tile key={name} label={name}>
          <ToolIcon decorative name={name} size={32} />
        </Tile>
      ))}
    </Grid>
  ),
};

export const ProductIcons: Story = {
  name: "Product Icons",
  render: () => (
    <div className="space-y-8">
      <Section title={`${iconNames.length} icon aliases`}>
        <Grid min={112}>
          {iconNames.map((name) => (
            <Tile key={name} label={name}>
              <IconRenderer className="size-5" name={name as IconName} />
            </Tile>
          ))}
        </Grid>
      </Section>
      <Section title="Badge variants">
        <div className="flex flex-wrap items-center gap-3">
          <IconBadge icon="note" size="sm" />
          <IconBadge icon="note" size="md" />
          <IconBadge icon="note" size="lg" />
          <IconBadge icon="collection" variant="default" />
          <IconBadge icon="collection" variant="muted" />
          <IconBadge icon="collection" variant="primary" />
          <IconBadge icon="collection" variant="destructive" />
        </div>
      </Section>
    </div>
  ),
};
