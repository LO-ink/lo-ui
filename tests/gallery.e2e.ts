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
      background: "rgb(11, 14, 23)",
      color: "rgb(247, 251, 255)",
      scheme: "dark",
    });
  expect(lightBackground).not.toBe("rgb(11, 14, 23)");
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

for (const scheme of ["light", "dark"] as const) {
  test(`${scheme} control states keep readable text and identifiable boundaries`, async ({
    page,
  }) => {
    await page.goto("/");
    if (scheme === "dark")
      await page.getByRole("button", { name: "Dark theme" }).click();
    const contrast = async (target: Locator, role: "text" | "border") =>
      target.evaluate((element, role) => {
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 1;
        const context = canvas.getContext("2d")!;
        const rgb = (value: string) => {
          context.clearRect(0, 0, 1, 1);
          context.fillStyle = value;
          context.fillRect(0, 0, 1, 1);
          const pixel = [...context.getImageData(0, 0, 1, 1).data];
          return { channels: pixel.slice(0, 3), alpha: pixel[3] / 255 };
        };
        const blend = (front: ReturnType<typeof rgb>, back: number[]) =>
          front.channels.map(
            (channel, i) => channel * front.alpha + back[i] * (1 - front.alpha),
          );
        const ancestors: Element[] = [];
        for (
          let parent: Element | null = element;
          parent;
          parent = parent.parentElement
        )
          ancestors.unshift(parent);
        let background = [255, 255, 255];
        for (const parent of ancestors)
          background = blend(
            rgb(getComputedStyle(parent).backgroundColor),
            background,
          );
        const style = getComputedStyle(element);
        const foreground = blend(
          rgb(role === "text" ? style.color : style.borderTopColor),
          background,
        );
        const luminance = (channels: number[]) =>
          channels
            .map((channel) => {
              const value = channel / 255;
              return value <= 0.04045
                ? value / 12.92
                : ((value + 0.055) / 1.055) ** 2.4;
            })
            .reduce(
              (sum, value, i) => sum + value * [0.2126, 0.7152, 0.0722][i],
              0,
            );
        const a = luminance(foreground),
          b = luminance(background);
        return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
      }, role);
    for (const name of [
      "Save changes",
      "Cancel",
      "Remove",
      "Learn more",
      "Compact action",
    ]) {
      const button = page.getByRole("button", { name, exact: true });
      await page.mouse.move(0, 0);
      expect(
        await contrast(button, "text"),
        `${name} default`,
      ).toBeGreaterThanOrEqual(4.5);
      await button.hover();
      await page.waitForTimeout(180);
      expect(
        await contrast(button, "text"),
        `${name} hover`,
      ).toBeGreaterThanOrEqual(4.5);
    }
    expect(
      await contrast(
        page.getByRole("textbox", { name: "List name" }),
        "border",
      ),
    ).toBeGreaterThanOrEqual(3);
    expect(
      await contrast(
        page.getByRole("checkbox", { name: "Private list" }),
        "border",
      ),
    ).toBeGreaterThanOrEqual(3);
    const disabled = page.getByRole("checkbox", {
      name: "Unavailable checkbox",
    });
    await expect(disabled).toBeDisabled();
    expect(
      await disabled.evaluate((element) => getComputedStyle(element).opacity),
    ).toBe("0.5");
    expect(
      await disabled.evaluate((element) => getComputedStyle(element).cursor),
    ).toBe("default");
    const minimal = page
      .getByRole("heading", { name: "No additional items" })
      .locator("..");
    const bounds = await minimal.boundingBox();
    expect(bounds!.height).toBeLessThan(160);
    expect(
      await minimal.evaluate(
        (element) => getComputedStyle(element).borderTopStyle,
      ),
    ).toBe("solid");
    const save = page.getByRole("button", { name: "Save changes" });
    expect(
      await save.evaluate((element) => getComputedStyle(element).minHeight),
    ).toBe("50px");
    expect(
      await save.evaluate((element) => getComputedStyle(element).borderRadius),
    ).toBe("999px");
  });
}

test("packaged LO fonts and multiline/modal semantics work in a narrow viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const failedFonts: string[] = [];
  page.on("response", (response) => {
    if (response.url().includes(".woff2") && !response.ok())
      failedFonts.push(response.url());
  });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  const faces = await page.evaluate(() =>
    [...document.fonts]
      .filter((face) => face.status === "loaded")
      .map((face) => ({ family: face.family, weight: face.weight })),
  );
  expect(faces).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ family: "LO Pro UI", weight: "400" }),
      expect.objectContaining({ family: "LO Pro UI", weight: "500" }),
      expect.objectContaining({ family: "LO Pro UI", weight: "700" }),
    ]),
  );
  expect(failedFonts).toEqual([]);
  await page
    .getByRole("textbox", { name: "Notes" })
    .fill("First line\nSecond line");
  await expect(page.getByRole("textbox", { name: "Notes" })).toHaveValue(
    "First line\nSecond line",
  );
  const pending = page.getByRole("progressbar", { name: "Pending progress" });
  expect(
    await pending.evaluate((e) => (e as HTMLProgressElement).position),
  ).toBe(-1);
  expect(
    await pending.evaluate((e) => getComputedStyle(e).backgroundImage),
  ).toContain("linear-gradient");
  await page.emulateMedia({ reducedMotion: "reduce" });
  expect(await pending.evaluate((e) => getComputedStyle(e).animationName)).toBe(
    "none",
  );
  const trigger = page.getByRole("button", { name: "Open dialog" });
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Example dialog" });
  await expect(dialog).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Close dialog" }),
  ).toBeFocused();
  const bounds = await dialog.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320);
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(trigger).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
});

test("tabs keep whole horizontal labels and compact input geometry at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  const row = page.getByRole("tablist", { name: "Gallery sections" });
  const long = page.getByRole("tab", {
    name: "Permissions and device sensors",
  });
  await row.scrollIntoViewIfNeeded();
  expect(await row.evaluate((e) => e.scrollWidth > e.clientWidth)).toBe(true);
  expect(
    await long.evaluate((e) => ({
      height: e.getBoundingClientRect().height,
      wrap: getComputedStyle(e).whiteSpace,
    })),
  ).toEqual({ height: 44, wrap: "nowrap" });
  await page.getByRole("tab", { name: "All", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(long).toBeFocused();
  await expect(long).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  await expect(
    page.getByRole("tab", { name: "Storage", exact: true }),
  ).toBeFocused();
  const field = page.getByRole("textbox", { name: "List name" });
  expect(
    await field.evaluate((e) => ({
      height: e.getBoundingClientRect().height,
      radius: getComputedStyle(e).borderRadius,
    })),
  ).toEqual({ height: 44, radius: "10px" });
  const search = page.getByRole("textbox", { name: "Search gallery" });
  await search.fill("test");
  expect(
    await search.evaluate((e) => ({
      height: e.getBoundingClientRect().height,
      radius: getComputedStyle(e).borderRadius,
      fontSize: getComputedStyle(e).fontSize,
    })),
  ).toEqual({ height: 38, radius: "6px", fontSize: "16px" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
});

test("RTL tabs reveal the selected label and use visual arrow direction", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  const row = page.getByRole("tablist", { name: "Gallery sections" });
  await row.evaluate((element) => element.setAttribute("dir", "rtl"));
  await page.getByRole("tab", { name: "All", exact: true }).focus();
  await page.keyboard.press("ArrowLeft");
  const long = page.getByRole("tab", {
    name: "Permissions and device sensors",
  });
  await expect(long).toBeFocused();
  await expect(long).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("End");
  const storage = page.getByRole("tab", { name: "Storage", exact: true });
  await expect(storage).toBeFocused();
  const bounds = await storage.boundingBox(),
    visible = await row.boundingBox();
  expect(bounds!.x).toBeGreaterThanOrEqual(visible!.x - 1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(
    visible!.x + visible!.width + 1,
  );
});
