import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Button, Cell, List, Switch, TextField } from "@lo-ink/ui";

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
  it.each([0, 0n])(
    "preserves zero (%s) as labelled, styled content and suppresses the chevron",
    (zero) => {
      const onPress = vi.fn();
      const { container } = render(
        <List label={zero}>
          <Cell
            title="Unread"
            leading={zero}
            subtitle={zero}
            trailing={zero}
            onPress={onPress}
          />
        </List>,
      );
      expect(screen.getByRole("heading", { name: "0" })).toBeInTheDocument();
      expect(screen.getByRole("list", { name: "0" })).toBeInTheDocument();
      for (const slot of ["leading", "subtitle", "trailing"]) {
        expect(
          container.querySelector(`.lo-ui-cell__${slot}`),
        ).toHaveTextContent("0");
      }
      expect(container.querySelector(".lo-ui-cell__chevron")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "0 Unread 0 0" }));
      expect(onPress).toHaveBeenCalledOnce();
    },
  );
  it.each([false, null, undefined, ""])(
    "keeps empty optional content absent (%s)",
    (empty) => {
      const { container } = render(
        <List label={empty}>
          <Cell
            title="Unread"
            leading={empty}
            subtitle={empty}
            trailing={empty}
            trailingAction={empty}
            onPress={() => undefined}
          />
        </List>,
      );
      expect(screen.queryByRole("heading")).toBeNull();
      expect(screen.getByRole("list")).not.toHaveAttribute("aria-labelledby");
      for (const slot of [
        "leading",
        "subtitle",
        "trailing",
        "trailing-action",
      ]) {
        expect(container.querySelector(`.lo-ui-cell__${slot}`)).toBeNull();
      }
      expect(
        container.querySelector(".lo-ui-cell__chevron"),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Unread" }),
      ).toBeInTheDocument();
    },
  );
  it.each([0, 0n])(
    "keeps a zero trailing action (%s) in its separate slot",
    (zero) => {
      const { container } = render(
        <List>
          <Cell title="Unread" trailingAction={zero} />
        </List>,
      );
      expect(
        container.querySelector(".lo-ui-cell__trailing-action"),
      ).toHaveTextContent("0");
      expect(
        container.querySelector(".lo-ui-cell__actions"),
      ).toBeInTheDocument();
    },
  );
  it("keeps row and trailing actions independently operable", () => {
    const open = vi.fn();
    const remove = vi.fn();
    const { container } = render(
      <List>
        <Cell
          title="Wishlist"
          onPress={open}
          trailingAction={<Button onClick={remove}>Remove</Button>}
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
  it("includes trailing metadata in the row action and its accessible name", () => {
    const onPress = vi.fn();
    render(
      <List label="Appearance settings">
        <Cell title="Appearance" trailing="Dark" onPress={onPress} />
      </List>,
    );

    expect(
      screen.getByRole("list", { name: "Appearance settings" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Appearance Dark" }));
    expect(onPress).toHaveBeenCalledOnce();
  });
  it("preserves an explicit accessible list name", () => {
    render(<List label="Visual heading" aria-label="Saved lists" />);
    expect(
      screen.getByRole("list", { name: "Saved lists" }),
    ).toBeInTheDocument();
  });
});
