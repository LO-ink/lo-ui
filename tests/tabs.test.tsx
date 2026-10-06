import "@testing-library/jest-dom/vitest";
import { useState } from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { Tabs, TextField, Surface } from "@lo-ink/ui";

afterEach(cleanup);
function Example() {
  const [value, setValue] = useState("a");
  return (
    <Tabs
      aria-label="Sections"
      value={value}
      onValueChange={setValue}
      options={[
        { value: "a", label: "One", panelId: "panel" },
        { value: "blocked", label: "Blocked", disabled: true },
        { value: "b", label: "Long complete label" },
        { value: "c", label: "Three" },
      ]}
    />
  );
}
it("tabs expose one keyboard stop, retain panel relationships and skip disabled options", () => {
  render(<Example />);
  const one = screen.getByRole("tab", { name: "One" });
  const two = screen.getByRole("tab", { name: "Long complete label" });
  const three = screen.getByRole("tab", { name: "Three" });
  expect(screen.getByRole("tablist", { name: "Sections" })).toHaveAttribute(
    "aria-orientation",
    "horizontal",
  );
  expect(one).toHaveAttribute("aria-controls", "panel");
  expect(one).toHaveAttribute("tabindex", "0");
  expect(two).toHaveAttribute("tabindex", "-1");
  one.focus();
  fireEvent.keyDown(one, { key: "ArrowRight" });
  expect(two).toHaveFocus();
  expect(two).toHaveAttribute("aria-selected", "true");
  fireEvent.keyDown(two, { key: "End" });
  expect(three).toHaveFocus();
  fireEvent.keyDown(three, { key: "ArrowRight" });
  expect(one).toHaveFocus();
  fireEvent.keyDown(one, { key: "ArrowLeft" });
  expect(three).toHaveFocus();
  fireEvent.keyDown(three, { key: "Home" });
  expect(one).toHaveFocus();
  fireEvent.keyDown(one, { key: "Escape" });
  expect(one).toHaveFocus();
  fireEvent.click(two);
  expect(two).toHaveAttribute("aria-selected", "true");
});
it("selection scrolls only the horizontal tab viewport in both directions", () => {
  const { rerender } = render(
    <Tabs
      value="a"
      onValueChange={() => {}}
      options={[
        { value: "a", label: "One" },
        { value: "b", label: "Two" },
      ]}
    />,
  );
  const row = screen.getByRole("tablist");
  const [one, two] = screen.getAllByRole("tab");
  Object.defineProperties(row, {
    clientWidth: { value: 100 },
    scrollLeft: { value: 50, writable: true },
  });
  row.getBoundingClientRect = () => ({ left: 0, right: 100 }) as DOMRect;
  one.getBoundingClientRect = () =>
    ({ left: -row.scrollLeft, right: 80 - row.scrollLeft }) as DOMRect;
  two.getBoundingClientRect = () =>
    ({ left: 80 - row.scrollLeft, right: 200 - row.scrollLeft }) as DOMRect;
  const options = [
    { value: "a", label: "One" },
    { value: "b", label: "Two" },
  ];
  rerender(<Tabs value="b" onValueChange={() => {}} options={options} />);
  expect(row.scrollLeft).toBe(100);
  rerender(<Tabs value="a" onValueChange={() => {}} options={options} />);
  expect(row.scrollLeft).toBe(0);
});
it("search fields keep labels and validation, surfaces retain explicit spacing", () => {
  const { rerender } = render(
    <Surface>
      <TextField label="Search" variant="search" error="Invalid" />
    </Surface>,
  );
  expect(
    screen.getByRole("textbox", { name: "Search" }),
  ).toHaveAccessibleDescription("Invalid");
  expect(screen.getByRole("textbox", { name: "Search" })).toHaveClass(
    "lo-ui-field__input--search",
  );
  expect(
    document
      .querySelector("section")!
      .style.getPropertyValue("--lo-surface-padding"),
  ).toBe("10px");
  rerender(
    <Surface padding={4}>
      <TextField label="Title" />
    </Surface>,
  );
  expect(
    document
      .querySelector("section")!
      .style.getPropertyValue("--lo-surface-padding"),
  ).toBe("var(--lo-space-4)");
  expect(screen.getByRole("textbox", { name: "Title" })).not.toHaveClass(
    "lo-ui-field__input--search",
  );
});

it("a disabled or removed selected value leaves an enabled tab keyboard reachable", () => {
  const props = { value: "a", onValueChange: () => {} };
  const { rerender } = render(
    <Tabs
      {...props}
      options={[
        { value: "a", label: "One" },
        { value: "b", label: "Two" },
      ]}
    />,
  );
  rerender(
    <Tabs
      {...props}
      options={[
        { value: "a", label: "One", disabled: true },
        { value: "b", label: "Two" },
      ]}
    />,
  );
  expect(screen.getByRole("tab", { name: "One" })).toBeDisabled();
  expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute(
    "tabindex",
    "0",
  );
  expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute(
    "aria-selected",
    "false",
  );
  rerender(<Tabs {...props} options={[{ value: "b", label: "Two" }]} />);
  expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute(
    "tabindex",
    "0",
  );
});
