import {
  forwardRef,
  useId,
  type InputHTMLAttributes,
  type ReactNode,
} from "react";
import { classes, hasContent } from "./utils.js";

export interface TextFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "size"
> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
  inputClassName?: string;
  labelHidden?: boolean;
  variant?: "outlined" | "search";
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
      labelHidden = false,
      variant = "outlined",
      "aria-describedby": ariaDescribedBy,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const hasDescription = hasContent(description);
    const hasError = hasContent(error);
    const descriptionId = hasDescription ? `${id}-description` : undefined;
    const errorId = hasError ? `${id}-error` : undefined;
    const describedBy = [ariaDescribedBy, descriptionId, errorId]
      .filter(Boolean)
      .join(" ");

    return (
      <div
        className={classes(
          "lo-ui-field",
          `lo-ui-field--${variant}`,
          labelHidden && "lo-ui-field--label-hidden",
          className,
        )}
      >
        <label className="lo-ui-field__label" htmlFor={id}>
          {label}
        </label>
        <input
          {...props}
          ref={ref}
          id={id}
          aria-invalid={hasError ? true : props["aria-invalid"]}
          aria-describedby={describedBy || undefined}
          className={classes(
            "lo-ui-field__input",
            variant === "search" && "lo-ui-field__input--search",
            inputClassName,
          )}
        />
        {hasDescription && (
          <div className="lo-ui-field__description" id={descriptionId}>
            {description}
          </div>
        )}
        {hasError && (
          <div className="lo-ui-field__error" id={errorId}>
            {error}
          </div>
        )}
      </div>
    );
  },
);
