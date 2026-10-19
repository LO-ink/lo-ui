import type { ReactNode } from "react";

export function classes(
  ...values: Array<string | false | null | undefined>
): string {
  return values.filter(Boolean).join(" ");
}

export function hasContent(value: ReactNode): boolean {
  return Boolean(value) || value === 0 || value === 0n;
}
