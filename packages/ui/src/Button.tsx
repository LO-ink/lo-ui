import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { classes } from "./utils.js";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "quiet";
  size?: "small" | "medium";
  loading?: boolean;
  loadingLabel?: string;
  fullWidth?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  function Button(
    {
      variant = "primary",
      size = "medium",
      loading = false,
      loadingLabel = "Loading",
      fullWidth = false,
      leading,
      trailing,
      className,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref,
  ) {
    return (
      <button
        {...props}
        ref={ref}
        type={type}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={classes(
          "lo-ui-button",
          `lo-ui-button--${variant}`,
          `lo-ui-button--${size}`,
          fullWidth && "lo-ui-button--full",
          className,
        )}
      >
        {loading ? (
          <>
            <span className="lo-ui-spinner" aria-hidden="true" />
            <span>{loadingLabel}</span>
          </>
        ) : (
          <>
            {leading && <span className="lo-ui-button__icon">{leading}</span>}
            <span>{children}</span>
            {trailing && <span className="lo-ui-button__icon">{trailing}</span>}
          </>
        )}
      </button>
    );
  },
);
