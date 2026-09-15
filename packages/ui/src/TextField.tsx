import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { classes } from "./utils.js";

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  inputClassName?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
  function TextField(
    {
      label,
      description,
      error,
      id: providedId,
      className,
      inputClassName,
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    const describedBy = [ariaDescribedBy, descriptionId, errorId]
      .filter(Boolean)
      .join(" ");

    return (
      <div className={classes("lo-ui-field", className)}>
        <label className="lo-ui-field__label" htmlFor={id}>
          {label}
        </label>
        <input
          {...props}
          ref={ref}
          id={id}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={describedBy || undefined}
          className={classes("lo-ui-field__input", inputClassName)}
        />
        {description && (
          <div className="lo-ui-field__description" id={descriptionId}>
            {description}
          </div>
        )}
        {error && (
          <div className="lo-ui-field__error" id={errorId}>
            {error}
          </div>
        )}
      </div>
    );
  },
);
