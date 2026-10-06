import type { CSSProperties, HTMLAttributes } from "react";
import type { SpacingToken } from "@lo-ink/design-tokens";
import { classes } from "./utils.js";

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  padding?: SpacingToken;
}
export function Surface({
  padding = 4,
  className,
  style,
  ...props
}: SurfaceProps) {
  return (
    <section
      {...props}
      className={classes("lo-ui-surface", className)}
      style={
        {
          "--lo-surface-padding": `var(--lo-space-${padding})`,
          ...style,
        } as CSSProperties
      }
    />
  );
}
