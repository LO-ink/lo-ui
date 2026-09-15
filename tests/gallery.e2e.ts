import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabTo(page: Page, target: Locator, attempts = 12) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => element === document.activeElement))
      return;
  }
  throw new Error("Control was not reachable in keyboard order");
}

async function expectVisibleKeyboardFocus(target: Locator) {
  const focus = await target.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      active: element === document.activeElement,
      style: style.outlineStyle,
      width: Number.parseFloat(style.outlineWidth),
    };
  });
  expect(focus.active).toBe(true);
  expect(focus.style).not.toBe("none");
  expect(focus.width).toBeGreaterThanOrEqual(2);
}

test("the gallery fits a 320px viewport without hiding content sideways", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", { level: 1, name: "LO UI" }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: "Controls" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Settings" })).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "List and app icons" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Nothing saved yet" }),
  ).toBeVisible();

  const viewport = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    clientHeight: document.documentElement.clientHeight,
    scrollWidth: document.documentElement.scrollWidth,
    scrollHeight: document.documentElement.scrollHeight,
  }));
  expect(viewport.clientWidth).toBe(320);
  expect(viewport.scrollWidth).toBe(viewport.clientWidth);
  expect(viewport.scrollHeight).toBeGreaterThan(viewport.clientHeight);

  const renderedControlsAndCells = [
    page.getByRole("button"),
    page.getByRole("textbox"),
    page.getByRole("switch"),
    page.getByRole("checkbox"),
    page.getByRole("listitem"),
  ];
  for (const group of renderedControlsAndCells) {
    for (const target of await group.all()) {
      const bounds = await target.boundingBox();
      expect(bounds).not.toBeNull();
      expect(bounds!.x).toBeGreaterThanOrEqual(0);
      expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
        viewport.clientWidth,
      );
    }
  }

  await page
    .getByRole("button", { name: "Add an idea" })
    .scrollIntoViewIfNeeded();
  expect(await page.evaluate(() => scrollY)).toBeGreaterThan(0);
});

test("the explicit dark theme updates the rendered surface and browser scheme", async ({
  page,
}) => {
  await page.goto("/");
  const gallery = page.getByRole("main");
  const toggle = page.getByRole("button", { name: "Dark theme" });
  const lightBackground = await gallery.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );

  await toggle.click();
  await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible();
  await expect
    .poll(() =>
      gallery.evaluate((element) => {
        const style = getComputedStyle(element);
        return {
          background: style.backgroundColor,
          color: style.color,
          scheme: style.colorScheme,
        };
      }),
    )
    .toEqual({
      background: "rgb(17, 19, 24)",
      color: "rgb(244, 245, 247)",
      scheme: "dark",
    });
  expect(lightBackground).not.toBe("rgb(17, 19, 24)");
});

test("primary controls are named, keyboard reachable, operable, and visibly focused", async ({
  page,
}) => {
  await page.goto("/");

  const theme = page.getByRole("button", { name: "Dark theme" });
  const save = page.getByRole("button", { name: "Save changes" });
  const field = page.getByRole("textbox", { name: "List name" });
  const notifications = page.getByRole("switch", { name: "Notifications" });
  const privateList = page.getByRole("checkbox", { name: "Private list" });
  const appearance = page.getByRole("button", { name: /Appearance/ });
  const wishList = page.getByRole("button", { name: /Wish list/ });
  const addIdea = page.getByRole("button", { name: "Add an idea" });

  await expect(page.getByRole("list", { name: "Preferences" })).toBeVisible();
  await expect(page.getByRole("list", { name: "My apps" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Saving" })).toHaveAttribute(
    "aria-busy",
    "true",
  );
  await expect(page.getByRole("button", { name: "Saving" })).toBeDisabled();

  await tabTo(page, theme);
  await expectVisibleKeyboardFocus(theme);
  await tabTo(page, save);
  await expectVisibleKeyboardFocus(save);
  await tabTo(page, field);
  await expectVisibleKeyboardFocus(field);
  await page.keyboard.type("x");
  await expect(field).toHaveAttribute("aria-invalid", "true");
  await expect(field).toHaveAccessibleDescription(
    /Visible to people who can open this list.*Use at least 3 characters/,
  );

  await tabTo(page, notifications);
  await expectVisibleKeyboardFocus(notifications);
  await expect(notifications).toBeChecked();
  await page.keyboard.press("Space");
  await expect(notifications).not.toBeChecked();

  await tabTo(page, privateList);
  await expectVisibleKeyboardFocus(privateList);
  await expect(privateList).not.toBeChecked();
  await page.keyboard.press("Space");
  await expect(privateList).toBeChecked();

  await tabTo(page, appearance);
  await expectVisibleKeyboardFocus(appearance);
  await tabTo(page, wishList);
  await expectVisibleKeyboardFocus(wishList);
  await tabTo(page, addIdea);
  await expectVisibleKeyboardFocus(addIdea);
});

test("reduced-motion preference removes effective gallery motion", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  expect(
    await page.evaluate(
      () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    ),
  ).toBe(true);

  const movingStyles = await page.evaluate(() => {
    const hasDuration = (value: string) =>
      value
        .split(",")
        .some((duration) => Number.parseFloat(duration.trim()) > 0);
    return [...document.querySelectorAll("*")]
      .map((element) => {
        const style = getComputedStyle(element);
        return {
          tag: element.tagName.toLowerCase(),
          text: element.textContent?.trim().slice(0, 40) ?? "",
          animation: style.animationDuration,
          transition: style.transitionDuration,
        };
      })
      .filter(
        ({ animation, transition }) =>
          hasDuration(animation) || hasDuration(transition),
      );
  });
  expect(movingStyles).toEqual([]);

  await page.getByRole("button", { name: "Dark theme" }).click();
  await expect(page.getByRole("button", { name: "Light theme" })).toBeVisible();
  expect(
    await page.evaluate(() =>
      document
        .getAnimations()
        .filter((animation) => animation.playState === "running")
        .map((animation) => animation.playState),
    ),
  ).toEqual([]);
});
