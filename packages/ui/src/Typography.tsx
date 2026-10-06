import { forwardRef, type HTMLAttributes } from "react";
import { classes } from "./utils.js";

export interface TextProps extends HTMLAttributes<HTMLElement> {
  as?: "p" | "span" | "strong" | "code" | "pre";
  tone?: "primary" | "secondary" | "danger" | "success";
  weight?: "regular" | "medium" | "bold";
  family?: "ui" | "display" | "mono";
  size?: "caption" | "label" | "body" | "title" | "display";
}

export function Text({
  as: Tag = "p",
  tone = "primary",
  weight,
  family,
  size = "body",
  className,
  ...props
}: TextProps) {
  return (
    <Tag
      {...props}
      className={classes(
        "lo-ui-text",
        `lo-ui-text--${tone}`,
        `lo-ui-text--${size}`,
        weight && `lo-ui-text--weight-${weight}`,
        family && `lo-ui-text--family-${family}`,
        className,
      )}
    />
  );
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
}

export const Heading = forwardRef<HTMLHeadingElement, HeadingProps>(
  function Heading({ level = 1, className, ...props }, ref) {
    const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4" | "h5" | "h6";
    return (
      <Tag
        {...props}
        ref={ref}
        className={classes("lo-ui-heading", className)}
      />
    );
  },
);
