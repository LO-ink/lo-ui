import {
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import { classes } from "./utils.js";

export interface TabOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  panelId?: string;
}
export interface TabsProps extends Omit<
  HTMLAttributes<HTMLDivElement>,
  "onChange"
> {
  options: readonly TabOption[];
  value: string;
  onValueChange: (value: string) => void;
}

/** Controlled horizontal tabs. Labels retain their width and scroll into view. */
export function Tabs({
  options,
  value,
  onValueChange,
  id: providedId,
  className,
  ...props
}: TabsProps) {
  const generatedId = useId();
  const id = providedId ?? generatedId;
  const row = useRef<HTMLDivElement>(null);
  const focusValue = options.some(
    (option) => option.value === value && !option.disabled,
  )
    ? value
    : options.find((option) => !option.disabled)?.value;
  // Recreated arrays and labels must not override a user's manual scrolling.
  const optionStructure = JSON.stringify(
    options.map((option) => [option.value, Boolean(option.disabled)]),
  );
  useEffect(() => {
    const selected = row.current?.querySelector<HTMLElement>(
      '[aria-selected="true"]',
    );
    if (!selected || !row.current) return;
    const viewport = row.current;
    const bounds = selected.getBoundingClientRect();
    const visible = viewport.getBoundingClientRect();
    if (bounds.left < visible.left)
      viewport.scrollLeft += bounds.left - visible.left;
    else if (bounds.right > visible.right)
      viewport.scrollLeft += bounds.right - visible.right;
  }, [value, optionStructure]);
  return (
    <div
      {...props}
      id={id}
      ref={row}
      role="tablist"
      aria-orientation="horizontal"
      className={classes("lo-ui-tabs", className)}
    >
      {options.map((option, index) => (
        <button
          key={option.value}
          id={`${id}-tab-${index}`}
          type="button"
          role="tab"
          aria-selected={option.value === value}
          aria-controls={option.panelId}
          tabIndex={option.value === focusValue ? 0 : -1}
          disabled={option.disabled}
          className="lo-ui-tab"
          onClick={() => onValueChange(option.value)}
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const enabled = options
              .map((item, i) => (item.disabled ? -1 : i))
              .filter((i) => i >= 0);
            if (!enabled.length) return;
            const current = enabled.indexOf(index);
            const forward =
              getComputedStyle(event.currentTarget).direction === "rtl"
                ? "ArrowLeft"
                : "ArrowRight";
            const next =
              event.key === "Home"
                ? enabled[0]
                : event.key === "End"
                  ? enabled[enabled.length - 1]
                  : enabled[
                      (current +
                        (event.key === forward ? 1 : -1) +
                        enabled.length) %
                        enabled.length
                    ];
            onValueChange(options[next].value);
            const buttons =
              row.current?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
            buttons?.[next]?.focus();
          }}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
