export type CompositeLayout = "vertical" | "horizontal";

export interface Placement {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Composite {
  width: number;
  height: number;
  placements: Placement[];
}

/** Composites larger than this on either side are scaled down to fit. */
export const MAX_COMPOSITE_SIDE = 8000;

/**
 * Where each image goes when combining screenshots. Vertical stacks them
 * top-to-bottom, left-aligned (width = widest); horizontal places them
 * left-to-right, top-aligned (height = tallest). Gaps are filled white.
 */
export function layoutComposite(
  sizes: ReadonlyArray<{ width: number; height: number }>,
  layout: CompositeLayout,
): Composite {
  const vertical = layout === "vertical";
  const fullWidth = vertical
    ? Math.max(...sizes.map((s) => s.width))
    : sizes.reduce((sum, s) => sum + s.width, 0);
  const fullHeight = vertical
    ? sizes.reduce((sum, s) => sum + s.height, 0)
    : Math.max(...sizes.map((s) => s.height));
  const scale = Math.min(1, MAX_COMPOSITE_SIDE / Math.max(fullWidth, fullHeight));

  let offset = 0;
  const placements = sizes.map((size) => {
    const width = size.width * scale;
    const height = size.height * scale;
    const placement = vertical
      ? { x: 0, y: offset, width, height }
      : { x: offset, y: 0, width, height };
    offset += vertical ? height : width;
    return placement;
  });

  return {
    width: Math.max(1, Math.round(fullWidth * scale)),
    height: Math.max(1, Math.round(fullHeight * scale)),
    placements,
  };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener("load", () => resolve(image), { once: true });
    image.addEventListener("error", () => reject(new Error("image decode failed")), { once: true });
    image.src = src;
  });
}

/** Draw the images (data URLs) into one PNG; resolves to its base64 payload. */
export async function composeImages(sources: string[], layout: CompositeLayout): Promise<string> {
  const images = await Promise.all(sources.map(loadImage));
  const composite = layoutComposite(
    images.map((image) => ({ width: image.naturalWidth, height: image.naturalHeight })),
    layout,
  );
  const canvas = document.createElement("canvas");
  canvas.width = composite.width;
  canvas.height = composite.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas 2D context unavailable");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, composite.width, composite.height);
  composite.placements.forEach((p, i) =>
    context.drawImage(images[i]!, p.x, p.y, p.width, p.height),
  );
  const base64 = canvas.toDataURL("image/png").split(",")[1];
  // An unusable canvas exports "data:,"; never save that as an empty image.
  if (!base64) throw new Error("the combined image could not be encoded");
  return base64;
}
