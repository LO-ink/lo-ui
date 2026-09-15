import type { CSSProperties, HTMLAttributes } from "react";
import { classes } from "./utils.js";

type Gap = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10;
type LayoutProps = HTMLAttributes<HTMLDivElement> & { gap?: Gap };

function layoutStyle(gap: Gap, style?: CSSProperties): CSSProperties {
  return {
    "--lo-layout-gap": `var(--lo-space-${gap})`,
    ...style,
  } as CSSProperties;
}

export function Stack({ gap = 4, className, style, ...props }: LayoutProps) {
  return (
    <div
      {...props}
      className={classes("lo-ui-stack", className)}
      style={layoutStyle(gap, style)}
    />
  );
}

export function Inline({ gap = 2, className, style, ...props }: LayoutProps) {
  return (
    <div
      {...props}
      className={classes("lo-ui-inline", className)}
      style={layoutStyle(gap, style)}
    />
  );
}
