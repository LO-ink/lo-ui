import type { CSSProperties, HTMLAttributes } from "react";
import type { SpacingToken } from "@lo-ink/design-tokens";
import { classes } from "./utils.js";

export interface SurfaceProps extends HTMLAttributes<HTMLElement> {
  padding?: SpacingToken;
}
export function Surface({ padding, className, style, ...props }: SurfaceProps) {
  return (
    <section
      {...props}
      className={classes("lo-ui-surface", className)}
      style={
        {
          "--lo-surface-padding":
            padding === undefined ? "10px" : `var(--lo-space-${padding})`,
          ...style,
        } as CSSProperties
      }
    />
  );
}
