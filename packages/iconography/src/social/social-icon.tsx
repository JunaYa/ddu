import type { CSSProperties } from "react";
import { MonochromeSvgIcon } from "../monochrome-svg-icon.tsx";
import { type SocialIconName, socialCatalog } from "./catalog.ts";

export type { SocialIconName } from "./catalog.ts";
export { hasSocialIcon } from "./catalog.ts";

interface SocialIconProps {
  className?: string;
  name: SocialIconName;
  /** Pixel size (square). Defaults to 16. */
  size?: number;
  style?: CSSProperties;
  /** Accessible label. Omit for decorative icons. */
  title?: string;
}

/**
 * Renders a catalogued social brand mark (original brand colors).
 *
 * @example
 * <SocialIcon name="linkedin" size={16} />
 */
export function SocialIcon({ name, size = 16, className, title, style }: SocialIconProps) {
  return (
    <MonochromeSvgIcon
      className={className}
      prepared={socialCatalog[name]}
      size={size}
      style={style}
      title={title}
    />
  );
}
