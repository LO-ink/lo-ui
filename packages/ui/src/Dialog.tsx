import { forwardRef, type DialogHTMLAttributes } from "react";
import { classes } from "./utils.js";

/** Native modal semantics; the caller controls showModal(), close() and cancellation. */
export const Dialog = forwardRef<
  HTMLDialogElement,
  DialogHTMLAttributes<HTMLDialogElement>
>(function Dialog({ className, ...props }, ref) {
  return (
    <dialog
      {...props}
      ref={ref}
      className={classes("lo-ui-dialog", className)}
    />
  );
});
