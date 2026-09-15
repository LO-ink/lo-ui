import type { HTMLAttributes, ImgHTMLAttributes, ReactNode } from "react";
import { classes } from "./utils.js";

export interface AppIconProps extends HTMLAttributes<HTMLSpanElement> {
  src?: string;
  alt?: string;
  size?: "small" | "medium" | "large";
  children?: ReactNode;
  imageProps?: Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "alt">;
}

export function AppIcon({
  src,
  alt = "",
  size = "medium",
  children,
  imageProps,
  className,
  ...props
}: AppIconProps) {
  return (
    <span
      {...props}
      className={classes(
        "lo-ui-app-icon",
        `lo-ui-app-icon--${size}`,
        className,
      )}
    >
      {src ? <img {...imageProps} src={src} alt={alt} /> : children}
    </span>
  );
}
