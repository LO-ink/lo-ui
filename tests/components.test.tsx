import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button, Cell, List, Switch, TextField } from "@lo/ui";

afterEach(cleanup);

describe("Button", () => {
  it("blocks duplicate actions and exposes pending state while loading", () => {
    const onClick = vi.fn();
    render(
      <Button loading loadingLabel="Saving" onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole("button", { name: "Saving" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("TextField", () => {
  it("connects label, help, and validation to the input", () => {
    render(
      <TextField
        label="List name"
        description="Other people can see it."
        error="Use at least 3 characters."
      />,
    );

    const input = screen.getByRole("textbox", { name: "List name" });
    expect(input).toHaveAttribute("aria-invalid", "true");
    const describedBy = input.getAttribute("aria-describedby")!.split(" ");
    expect(describedBy).toHaveLength(2);
    expect(describedBy.every((id) => document.getElementById(id))).toBe(true);
  });
});

describe("Switch", () => {
  it("separates the control name from its description", () => {
    render(
      <Switch
        label="Updates"
        description="Receive updates about this list"
        labelHidden
      />,
    );
    const control = screen.getByRole("switch", { name: "Updates" });
    expect(control).toHaveAccessibleDescription(
      "Receive updates about this list",
    );
  });
  it("uses native checkbox behavior with switch semantics", () => {
    const onChange = vi.fn();
    render(<Switch label="Updates" onChange={onChange} />);

    const control = screen.getByRole("switch", { name: "Updates" });
    fireEvent.click(control);
    expect(control).toBeChecked();
    expect(onChange).toHaveBeenCalledOnce();
  });
});

describe("List", () => {
  it("keeps row and trailing actions independently operable", () => {
    const open = vi.fn();
    const remove = vi.fn();
    const { container } = render(
      <List>
        <Cell
          title="Wishlist"
          onPress={open}
          trailing={<Button onClick={remove}>Remove</Button>}
        />
      </List>,
    );
    expect(container.querySelector("button button")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Remove" }));
    expect(remove).toHaveBeenCalledOnce();
    expect(open).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Wishlist" }));
    expect(open).toHaveBeenCalledOnce();
  });
  it("renders actionable rows as real buttons", () => {
    const onPress = vi.fn();
    render(
      <List label="Lists">
        <Cell title="Birthday" subtitle="8 ideas" onPress={onPress} />
      </List>,
    );

    fireEvent.click(screen.getByRole("button", { name: /Birthday/ }));
    expect(onPress).toHaveBeenCalledOnce();
  });
});
