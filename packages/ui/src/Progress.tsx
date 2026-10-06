import type { ProgressHTMLAttributes } from "react";
import { classes } from "./utils.js";

export function Progress({
  className,
  ...props
}: ProgressHTMLAttributes<HTMLProgressElement>) {
  return (
    <progress {...props} className={classes("lo-ui-progress", className)} />
  );
}
