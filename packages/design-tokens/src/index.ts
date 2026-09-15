export const spacing = {
  0: "0px",
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
} as const;

export const sizes = {
  controlSmall: "44px",
  control: "44px",
  cell: "60px",
  content: "640px",
} as const;

export const radii = {
  small: "10px",
  medium: "14px",
  large: "20px",
  full: "999px",
} as const;

export const motion = {
  fast: "120ms",
  normal: "180ms",
  easeOut: "cubic-bezier(0.33, 1, 0.68, 1)",
} as const;

export type SpacingToken = keyof typeof spacing;
