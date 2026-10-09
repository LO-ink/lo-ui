import { forwardRef, type DetailsHTMLAttributes, type ReactNode } from "react";
import { classes } from "./utils.js";

export interface DisclosureProps extends DetailsHTMLAttributes<HTMLDetailsElement> {
  /** The disclosure label. Keep interactive controls in the body. */
  summary: ReactNode;
  /** Noninteractive metadata included in the disclosure's accessible name. */
  trailing?: ReactNode;
}

export const Disclosure = forwardRef<HTMLDetailsElement, DisclosureProps>(
  function Disclosure(
    { summary, trailing, children, className, ...props },
    ref,
  ) {
    return (
      <details
        {...props}
        ref={ref}
        className={classes("lo-ui-disclosure", className)}
      >
        <summary className="lo-ui-disclosure__summary">
          <span className="lo-ui-disclosure__label">{summary}</span>
          {trailing != null && (
            <span className="lo-ui-disclosure__trailing">{trailing}</span>
          )}
          <svg
            className="lo-ui-disclosure__chevron"
            viewBox="0 0 20 20"
            aria-hidden="true"
            focusable="false"
          >
            <path d="m7.5 4 6 6-6 6" />
          </svg>
        </summary>
        <div className="lo-ui-disclosure__body">{children}</div>
      </details>
    );
  },
);
