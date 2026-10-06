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

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export function Heading({ level = 1, className, ...props }: HeadingProps) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
  return <Tag {...props} className={classes("lo-ui-heading", className)} />;
}
