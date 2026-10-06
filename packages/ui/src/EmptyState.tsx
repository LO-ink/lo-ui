import type { HTMLAttributes, ReactNode } from "react";
import { classes } from "./utils.js";

export interface EmptyStateProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "title"
> {
  title: ReactNode;
  headingLevel?: 2 | 3 | 4 | 5 | 6;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
}

export function EmptyState({
  title,
  headingLevel = 2,
  description,
  icon,
  action,
  className,
  ...props
}: EmptyStateProps) {
  const Tag = `h${headingLevel}` as "h2" | "h3" | "h4" | "h5" | "h6";
  return (
    <div {...props} className={classes("lo-ui-empty-state", className)}>
      {icon && (
        <div className="lo-ui-empty-state__icon" aria-hidden="true">
          {icon}
        </div>
      )}
      <Tag className="lo-ui-empty-state__title">{title}</Tag>
      {description && (
        <p className="lo-ui-empty-state__description">{description}</p>
      )}
      {action && <div className="lo-ui-empty-state__action">{action}</div>}
    </div>
  );
}
