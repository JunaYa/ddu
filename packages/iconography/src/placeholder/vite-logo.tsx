import type { ComponentProps } from "react";

/** Vite's starter-template logo, used as a neutral product placeholder. */
export function ViteLogo({ size = 32, ...props }: ComponentProps<"img"> & { size?: number }) {
  return (
    <img
      alt="Vite placeholder"
      width={size}
      height={size}
      src={new URL("./vite.svg", import.meta.url).href}
      {...props}
    />
  );
}
