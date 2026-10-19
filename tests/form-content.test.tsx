import "@testing-library/jest-dom/vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it } from "vitest";
import { Checkbox, Switch, TextArea, TextField } from "@lo-ink/ui";

afterEach(cleanup);

for (const [name, Control] of [
  ["TextField", TextField],
  ["TextArea", TextArea],
  ["Checkbox", Checkbox],
  ["Switch", Switch],
] as const) {
  const isField = Control === TextField || Control === TextArea;
  it.each([0, 0n, "0"])(
    `${name} preserves zero content (%s) in labels and descriptions`,
    (zero) => {
      const element = (
        <Control
          id="count"
          label={zero}
          description={zero}
          {...(isField ? { error: zero } : {})}
        />
      );
      const { container, rerender } = render(element);
      const input = screen.getByLabelText("0", { exact: true });
      expect(input).toHaveAccessibleName("0");
      expect(input).toHaveAccessibleDescription(isField ? "0 0" : "0");
      expect(
        container.querySelector('[id="count-description"]'),
      ).toHaveTextContent("0");
      if (isField) {
        expect(input).toHaveAttribute("aria-invalid", "true");
        expect(container.querySelector('[id="count-error"]')).toHaveTextContent(
          "0",
        );
      }
      expect(renderToStaticMarkup(element)).toContain('id="count-description"');
      rerender(
        <>
          <span id="external">Remaining</span>
          <Control
            id="count"
            label={zero}
            description={zero}
            aria-describedby="external"
          />
        </>,
      );
      expect(
        screen.getByLabelText("0", { exact: true }),
      ).toHaveAccessibleDescription("Remaining 0");
    },
  );

  it.each([false, null, undefined, ""])(
    `${name} keeps empty optional content absent (%s)`,
    (empty) => {
      const { container } = render(
        <Control
          label="Count"
          description={empty}
          {...(isField ? { error: empty, "aria-invalid": true as const } : {})}
        />,
      );
      const input = screen.getByLabelText("Count");
      expect(input).not.toHaveAttribute("aria-describedby");
      expect(container.querySelector('[id$="-description"]')).toBeNull();
      expect(container.querySelector('[id$="-error"]')).toBeNull();
      if (isField) expect(input).toHaveAttribute("aria-invalid", "true");
    },
  );

  it(`${name} preserves true boolean presence`, () => {
    const { container } = render(
      <Control
        id="count"
        label="Count"
        description={true}
        {...(isField ? { error: true } : {})}
      />,
    );
    const input = screen.getByLabelText("Count");
    expect(
      container.querySelector('[id="count-description"]'),
    ).toBeEmptyDOMElement();
    expect(input).toHaveAttribute(
      "aria-describedby",
      isField ? "count-description count-error" : "count-description",
    );
    if (isField) expect(input).toHaveAttribute("aria-invalid", "true");
  });
}
