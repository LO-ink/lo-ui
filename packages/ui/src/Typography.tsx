import type { HTMLAttributes } from "react";
import { classes } from "./utils.js";

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  tone?: "primary" | "secondary" | "danger";
  size?: "caption" | "label" | "body";
}

export function Text({
  tone = "primary",
  size = "body",
  className,
  ...props
}: TextProps) {
  return (
    <p
      {...props}
      className={classes(
        "lo-ui-text",
        `lo-ui-text--${tone}`,
        `lo-ui-text--${size}`,
        className,
      )}
    />
  );
}

export function Heading({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return <h1 {...props} className={classes("lo-ui-heading", className)} />;
}
