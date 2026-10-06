import {
  forwardRef,
  useId,
  type ReactNode,
  type TextareaHTMLAttributes,
} from "react";
import { classes } from "./utils.js";

export interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: ReactNode;
  description?: ReactNode;
  error?: ReactNode;
}
export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    {
      label,
      description,
      error,
      id: providedId,
      className,
      "aria-describedby": describedBy,
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const descriptionId = description ? `${id}-description` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    return (
      <div className={classes("lo-ui-field", className)}>
        <label className="lo-ui-field__label" htmlFor={id}>
          {label}
        </label>
        <textarea
          {...props}
          ref={ref}
          id={id}
          aria-invalid={error ? true : props["aria-invalid"]}
          aria-describedby={
            [describedBy, descriptionId, errorId].filter(Boolean).join(" ") ||
            undefined
          }
          className="lo-ui-field__input lo-ui-textarea"
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
