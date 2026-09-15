import type { HTMLAttributes, ReactNode } from "react";
import { classes } from "./utils.js";

export interface EmptyStateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div {...props} className={classes("lo-ui-empty-state", className)}>
      {icon && (
        <div className="lo-ui-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <h2 className="lo-ui-empty-state__title">{title}</h2>
      {description && (
        <p className="lo-ui-empty-state__description">{description}</p>
      )}
      {action && <div className="lo-ui-empty-state__action">{action}</div>}
    </div>
  );
}
