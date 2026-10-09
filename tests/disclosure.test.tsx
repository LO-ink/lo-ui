import "@testing-library/jest-dom/vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { Disclosure, TextField } from "@lo-ink/ui";

afterEach(cleanup);

it("preserves native attributes, caller refs and toggle notifications", () => {
  const ref = { current: null as HTMLDetailsElement | null };
  const toggle = vi.fn();
  const { rerender } = render(
    <Disclosure
      ref={ref}
      id="result"
      summary="Result"
      trailing="Confirmed"
      open
      onToggle={toggle}
    >
      <TextField label="Notes" />
    </Disclosure>,
  );
  expect(ref.current).toHaveAttribute("open");
  expect(ref.current).toHaveAttribute("id", "result");
  fireEvent(ref.current!, new Event("toggle"));
  expect(toggle).toHaveBeenCalledOnce();
  const field = screen.getByRole("textbox", { name: "Notes" });
  fireEvent.change(field, { target: { value: "Keep my notes" } });
  rerender(
    <Disclosure ref={ref} summary="Result" open={false}>
      <TextField label="Notes" />
    </Disclosure>,
  );
  expect(ref.current).not.toHaveAttribute("open");
  expect(field).toHaveValue("Keep my notes");
  expect(screen.queryByText("Confirmed")).toBeNull();
});

it("renders closed and initially open disclosures without a browser host", () => {
  const closed = renderToString(
    <Disclosure summary="Details">Saved result</Disclosure>,
  );
  const opened = renderToString(
    <Disclosure summary="Versions" open>
      SDK version
    </Disclosure>,
  );
  expect(closed).toContain("<details");
  expect(closed).toContain("<summary");
  expect(closed).not.toContain('open=""');
  expect(opened).toContain('open=""');
  expect(opened).toContain("SDK version");
});
