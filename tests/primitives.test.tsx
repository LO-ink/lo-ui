import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import {
  AppIcon,
  EmptyState,
  Button,
  Checkbox,
  Stack,
  Inline,
  Heading,
  Text,
  TextField,
  List,
  Cell,
} from "@lo-ink/ui";
import { spacing, sizes, radii, motion } from "@lo-ink/design-tokens";

afterEach(cleanup);

it("empty states expose an actionable recovery and keep decorative icons out of accessible names", () => {
  const recover = vi.fn();
  render(
    <EmptyState
      title="No saved lists"
      description="Create your first list."
      icon={<span>★</span>}
      action={<Button onClick={recover}>Create list</Button>}
    />,
  );
  expect(
    screen.getByRole("heading", { name: "No saved lists", level: 2 }),
  ).toBeVisible();
  expect(screen.getByText("Create your first list.")).toBeVisible();
  expect(screen.getByText("★").parentElement).toHaveAttribute(
    "aria-hidden",
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "Create list" }));
  expect(recover).toHaveBeenCalledOnce();
});

it("minimal empty states omit optional content", () => {
  const { container } = render(<EmptyState title="Nothing here" />);
  expect(container.querySelector("p")).toBeNull();
  expect(container.querySelector("button")).toBeNull();
});

it("app icons preserve image descriptions and support a text avatar", () => {
  const { rerender } = render(
    <AppIcon src="/avatar.png" alt="Garden" imageProps={{ loading: "lazy" }} />,
  );
  expect(screen.getByRole("img", { name: "Garden" })).toHaveAttribute(
    "loading",
    "lazy",
  );
  rerender(
    <AppIcon aria-label="Garden" size="small">
      G
    </AppIcon>,
  );
  expect(screen.queryByRole("img")).toBeNull();
  expect(screen.getByLabelText("Garden")).toHaveTextContent("G");
});

it("layout primitives preserve caller spacing and typography semantics", () => {
  render(
    <Stack data-testid="stack" gap={6} style={{ marginTop: spacing[2] }}>
      <Heading>Preferences</Heading>
      <Inline data-testid="inline">
        <Text tone="secondary" size="caption">
          Shared with your team
        </Text>
      </Inline>
    </Stack>,
  );
  expect(
    screen.getByRole("heading", { name: "Preferences", level: 1 }),
  ).toBeVisible();
  expect(screen.getByTestId("stack")).toHaveStyle({ marginTop: spacing[2] });
  expect(
    screen.getByTestId("stack").style.getPropertyValue("--lo-layout-gap"),
  ).toBe("var(--lo-space-6)");
  expect(
    screen.getByTestId("inline").style.getPropertyValue("--lo-layout-gap"),
  ).toBe("var(--lo-space-2)");
  expect(screen.getByText("Shared with your team").tagName).toBe("P");
  expect(Number.parseInt(sizes.control)).toBeGreaterThanOrEqual(44);
  expect(radii.full).toMatch(/px$/);
  expect(motion.normal).toMatch(/ms$/);
});

it("disabled checkboxes prevent changes while keeping their accessible description", () => {
  const onChange = vi.fn();
  render(
    <Checkbox
      label="Share updates"
      description="Visible to the group"
      disabled
      onChange={onChange}
    />,
  );
  const control = screen.getByRole("checkbox", { name: "Share updates" });
  expect(control).toBeDisabled();
  expect(control).toHaveAccessibleDescription("Visible to the group");
  (control as HTMLInputElement).click();
  expect(onChange).not.toHaveBeenCalled();
});

it("minimal controls remain named and a read-only row has no button", () => {
  render(
    <>
      <Button>Continue</Button>
      <TextField label="Title" />
      <Checkbox label="Enabled" />
      <List>
        <Cell title="Version" trailing="1.0" />
      </List>
      <Stack>
        <Text>Body</Text>
      </Stack>
    </>,
  );
  expect(screen.getByRole("textbox", { name: "Title" })).not.toHaveAttribute(
    "aria-describedby",
  );
  expect(screen.queryByRole("button", { name: "Version 1.0" })).toBeNull();
  const control = screen.getByRole("checkbox", { name: "Enabled" });
  fireEvent.click(control);
  expect(control).toBeChecked();
});

it("headings preserve section levels and caller attributes", () => {
  const { rerender } = render(
    <Heading level={3} id="section-title">
      Section
    </Heading>,
  );
  expect(
    screen.getByRole("heading", { level: 3, name: "Section" }),
  ).toHaveAttribute("id", "section-title");
  rerender(<Heading>Page</Heading>);
  expect(screen.getByRole("heading", { level: 1, name: "Page" })).toBeVisible();
});

it("embedded list and empty-state titles preserve the containing section hierarchy", () => {
  render(
    <>
      <List label="Choices" headingLevel={4}>
        <Cell title="One" />
      </List>
      <EmptyState title="No choices" headingLevel={4} />
    </>,
  );
  expect(
    screen.getByRole("heading", { name: "Choices", level: 4 }),
  ).toBeVisible();
  expect(
    screen.getByRole("heading", { name: "No choices", level: 4 }),
  ).toBeVisible();
  expect(screen.getByRole("list", { name: "Choices" })).toBeVisible();
});
