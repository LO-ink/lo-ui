import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { classes } from "./utils.js";

export interface ListProps extends HTMLAttributes<HTMLUListElement> {
  label?: ReactNode;
}

export function List({ label, children, className, ...props }: ListProps) {
  return (
    <section className="lo-ui-list-section">
      {label && <h2 className="lo-ui-list-label">{label}</h2>}
      <ul {...props} className={classes("lo-ui-list", className)}>
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
  trailing?: ReactNode;
  onPress?: () => void;
  disabled?: boolean;
}

export const Cell = forwardRef<HTMLLIElement, CellProps>(function Cell(
  {
    title,
    subtitle,
    leading,
    trailing,
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
      {onPress && !trailing && (
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
      {onPress ? (
        <div className="lo-ui-cell__actions">
          <button
            className="lo-ui-cell__control"
            type="button"
            onClick={onPress}
            disabled={disabled}
          >
            {content}
          </button>
          {trailing && <span className="lo-ui-cell__trailing">{trailing}</span>}
        </div>
      ) : (
        <div className="lo-ui-cell__content">
          {content}
          {trailing && <span className="lo-ui-cell__trailing">{trailing}</span>}
        </div>
      )}
    </li>
  );
});
