import { forwardRef, useId, type HTMLAttributes, type ReactNode } from "react";
import { classes } from "./utils.js";

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  label?: ReactNode;
}

export function List({
  label,
  children,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  ...props
}: ListProps) {
  const generatedId = useId();
  const labelId = label ? `${generatedId}-label` : undefined;
  const effectiveLabelledBy =
    ariaLabelledBy ?? (ariaLabel === undefined ? labelId : undefined);
  return (
    <section className="lo-ui-list-section">
      {label && (
        <h2 className="lo-ui-list-label" id={labelId}>
          {label}
        </h2>
      )}
      <ul
        {...props}
        aria-label={ariaLabel}
        aria-labelledby={effectiveLabelledBy}
        className={classes("lo-ui-list", className)}
      >
        {children}
      </ul>
    </section>
  );
}

export interface CellProps extends Omit<
  HTMLAttributes<HTMLLIElement>,
  "title"
> {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  /** Noninteractive metadata included in the row action and its accessible name. */
  trailing?: ReactNode;
  /** An independently operable control rendered beside the row action. */
  trailingAction?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export const Cell = forwardRef<HTMLLIElement, CellProps>(function Cell(
  {
    title,
    subtitle,
    leading,
    trailing,
    trailingAction,
    onPress,
    disabled = false,
    className,
    ...props
  },
  ref,
) {
  const content = (
    <>
      {leading && <span className="lo-ui-cell__leading">{leading}</span>}
      <span className="lo-ui-cell__body">
        <span className="lo-ui-cell__title">{title}</span>
        {subtitle && <span className="lo-ui-cell__subtitle">{subtitle}</span>}
      </span>
      {trailing && <span className="lo-ui-cell__trailing">{trailing}</span>}
      {onPress && !trailing && !trailingAction && (
        <svg
          className="lo-ui-cell__chevron"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="m7.5 4 6 6-6 6" />
        </svg>
      )}
    </>
  );

  return (
    <li {...props} ref={ref} className={classes("lo-ui-cell", className)}>
      {onPress || trailingAction ? (
        <div className="lo-ui-cell__actions">
          {onPress ? (
            <button
              className="lo-ui-cell__control"
              type="button"
              onClick={onPress}
              disabled={disabled}
            >
              {content}
            </button>
          ) : (
            <div className="lo-ui-cell__content">{content}</div>
          )}
          {trailingAction && (
            <span className="lo-ui-cell__trailing-action">
              {trailingAction}
            </span>
          )}
        </div>
      ) : (
        <div className="lo-ui-cell__content">{content}</div>
      )}
    </li>
  );
});
