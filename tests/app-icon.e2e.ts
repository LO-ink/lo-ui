import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

test("app identity uses the native proportional corners at every size", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  // Load the actual built public component after the gallery build completes.
  const { AppIcon } = await import("@lo-ink/ui");
  const src = `data:image/svg+xml,${encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="96" height="64"><rect width="96" height="64" fill="#5969fc"/><path d="M0 32H96M48 0V64" stroke="white" stroke-width="8"/></svg>')}`;
  const markup = renderToStaticMarkup(
    createElement(
      "div",
      { className: "lo-ui-root", "data-testid": "app-icons" },
      ...(["small", "medium", "large"] as const).map((size) =>
        createElement(AppIcon, { key: size, size, src, alt: `${size} app` }),
      ),
    ),
  );
  await page.evaluate((html) => {
    document.body.innerHTML = html;
  }, markup);
  const fixture = page.getByTestId("app-icons");
  await expect(fixture.getByRole("img")).toHaveCount(3);
  await expect
    .poll(() =>
      fixture
        .getByRole("img")
        .evaluateAll((images) =>
          images.every(
            (image) =>
              (image as HTMLImageElement).complete &&
              (image as HTMLImageElement).naturalWidth > 0,
          ),
        ),
    )
    .toBe(true);
  const actual = await fixture.getByRole("img").evaluateAll((images) =>
    images.map((image) => {
      const box = image.parentElement!;
      const rect = box.getBoundingClientRect();
      const style = getComputedStyle(box);
      const radius = style.borderTopLeftRadius;
      return {
        width: rect.width,
        height: rect.height,
        radius:
          parseFloat(radius) * (radius.endsWith("%") ? rect.width / 100 : 1),
        overflow: style.overflow,
        fit: getComputedStyle(image).objectFit,
      };
    }),
  );
  await fixture.screenshot({ path: test.info().outputPath("app-icons.png") });
  expect(actual.map((value) => value.width)).toEqual([32, 44, 64]);
  for (const value of actual) {
    expect(value.height).toBe(value.width);
    // Native MiniAppIcon uses size * 0.2 for app identity, including 44/64px callers.
    expect(value.radius).toBeCloseTo(value.width * 0.2, 4);
    expect(value.overflow).toBe("hidden");
    expect(value.fit).toBe("cover");
  }
});
