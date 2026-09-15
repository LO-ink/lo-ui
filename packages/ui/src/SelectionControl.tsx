import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { classes } from "./utils.js";

export type SelectionControlProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type"
> & {
  label: ReactNode;
  description?: ReactNode;
  labelHidden?: boolean;
};

function SelectionControl({
  control,
  label,
  description,
  labelHidden = false,
  id,
}: {
  control: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  labelHidden?: boolean;
  id: string;
}) {
  return (
    <label
      className={classes(
        "lo-ui-selection",
        labelHidden && "lo-ui-selection--control-only",
      )}
      htmlFor={id}
    >
      <span className="lo-ui-selection__copy">
        <span className="lo-ui-selection__label" id={`${id}-label`}>
          {label}
        </span>
        {description && (
          <span
            className="lo-ui-selection__description"
            id={`${id}-description`}
          >
            {description}
          </span>
        )}
      </span>
      {control}
    </label>
  );
}

export const Switch = forwardRef<HTMLInputElement, SelectionControlProps>(
  function Switch(
    { label, description, labelHidden, id: providedId, className, ...props },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    return (
      <SelectionControl
        id={id}
        label={label}
        description={description}
        labelHidden={labelHidden}
        control={
          <input
            {...props}
            ref={ref}
            id={id}
            type="checkbox"
            role="switch"
            aria-labelledby={
              props["aria-labelledby"] ??
              (props["aria-label"] ? undefined : `${id}-label`)
            }
            aria-describedby={
              [props["aria-describedby"], description && `${id}-description`]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={classes("lo-ui-switch", className)}
          />
        }
      />
    );
  },
);

export const Checkbox = forwardRef<HTMLInputElement, SelectionControlProps>(
  function Checkbox(
    { label, description, labelHidden, id: providedId, className, ...props },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    return (
      <SelectionControl
        id={id}
        label={label}
        description={description}
        labelHidden={labelHidden}
        control={
          <input
            {...props}
            ref={ref}
            id={id}
            type="checkbox"
            aria-labelledby={
              props["aria-labelledby"] ??
              (props["aria-label"] ? undefined : `${id}-label`)
            }
            aria-describedby={
              [props["aria-describedby"], description && `${id}-description`]
                .filter(Boolean)
                .join(" ") || undefined
            }
            className={classes("lo-ui-checkbox", className)}
          />
        }
      />
    );
  },
);
