import { expect, test, type Locator, type Page } from "@playwright/test";

for (const theme of ["light", "dark"] as const) {
  test(`${theme} cells align text and navigation with inherited direction`, async ({
    page,
  }, testInfo) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto("/");
    if (theme === "dark")
      await page.getByRole("button", { name: "Dark theme" }).click();
    await page.evaluate(() => document.fonts.ready);
    const main = page.getByRole("main");
    const apps = page.getByRole("list", { name: "My apps" });
    const garden = apps.locator(".lo-ui-cell").last();
    const notifications = page
      .getByRole("list", { name: "Preferences" })
      .locator(".lo-ui-cell")
      .first();
    const arrowDirection = () =>
      garden.locator(".lo-ui-cell__chevron path").evaluate((element) => {
        const matrix = (element as SVGGraphicsElement).getScreenCTM()!;
        const tip = new DOMPoint(13.5, 10).matrixTransform(matrix);
        const tail = new DOMPoint(7.5, 10).matrixTransform(matrix);
        return tip.x - tail.x;
      });
    for (const direction of ["ltr", "rtl"] as const) {
      await main.evaluate((element, dir) => (element.dir = dir), direction);
      for (const cell of [garden, notifications]) {
        const title = cell.locator(".lo-ui-cell__title");
        await title.evaluate((element, dir) => {
          element.textContent =
            dir === "rtl" ? "إعدادات الحساب" : "Account settings";
        }, direction);
        const geometry = await title.evaluate((element, dir) => {
          const range = document.createRange();
          range.selectNodeContents(element);
          const text = range.getBoundingClientRect();
          const box = element.getBoundingClientRect();
          return {
            gap: dir === "rtl" ? box.right - text.right : text.left - box.left,
            remainingWidth: box.width - text.width,
          };
        }, direction);
        expect(geometry.remainingWidth).toBeGreaterThan(2);
        expect(Math.abs(geometry.gap)).toBeLessThanOrEqual(1);
      }
      expect(
        (await arrowDirection()) * (direction === "rtl" ? -1 : 1),
      ).toBeGreaterThan(0);
      await apps.screenshot({
        path: testInfo.outputPath(`cells-${theme}-${direction}.png`),
      });
    }
    await garden.evaluate((element) => (element.dir = "ltr"));
    expect(await arrowDirection()).toBeGreaterThan(0);
    const localTitle = garden.locator(".lo-ui-cell__title");
    await localTitle.evaluate((element) => (element.textContent = "Account"));
    const localGap = await localTitle.evaluate((element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      return (
        range.getBoundingClientRect().left -
        element.getBoundingClientRect().left
      );
    });
    expect(Math.abs(localGap)).toBeLessThanOrEqual(1);
    const appearance = page.getByRole("button", { name: /Appearance/ });
    await appearance.focus();
    await page.keyboard.press("Enter");
    await expect(
      page.getByRole("button", {
        name: theme === "light" ? "Light theme" : "Dark theme",
      }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth),
    ).toBe(320);
  });
}

async function tabTo(page: Page, target: Locator, attempts = 12) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    await page.keyboard.press(
      process.platform === "darwin" &&
        page.context().browser()?.browserType().name() === "webkit"
        ? "Alt+Tab"
        : "Tab",
    );
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

test("disclosures retain native keyboard behavior and body state on narrow screens", async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  const summary = page
    .locator("summary")
    .filter({ hasText: "Detailed results and saved SDK versions" });
  const details = summary.locator("..");
  await details.evaluate((element) => {
    element.querySelector(".lo-ui-disclosure__trailing")!.textContent =
      "NotYetCheckedByTheNativeApplication";
    element.querySelector(".lo-ui-disclosure__body p")!.textContent =
      "VeryLongSavedResultWithoutAnySpacesToVerifyNarrowScreenWrapping";
  });
  const notes = page.getByRole("textbox", {
    name: "Result notes",
    includeHidden: true,
  });
  await expect(notes).toBeHidden();
  await summary.focus();
  await expectVisibleKeyboardFocus(summary);
  await page.keyboard.press("Enter");
  await expect(details).toHaveAttribute("open", "");
  await expect(notes).toBeVisible();
  await notes.fill("Preserved across collapse");
  await summary.focus();
  await page.keyboard.press("Space");
  await expect(details).not.toHaveAttribute("open");
  await expect(notes).toBeHidden();
  await page.keyboard.press("Space");
  await expect(notes).toHaveValue("Preserved across collapse");
  const geometry = await summary.evaluate((element) => ({
    width: element.clientWidth,
    contentWidth: element.scrollWidth,
    height: element.getBoundingClientRect().height,
  }));
  expect(geometry.contentWidth).toBe(geometry.width);
  expect(geometry.height).toBeGreaterThanOrEqual(44);
  await details.screenshot({
    path: testInfo.outputPath("disclosure-light.png"),
  });
  const light = await summary.evaluate(
    (element) => getComputedStyle(element).color,
  );
  await page.getByRole("button", { name: "Dark theme" }).click();
  await expect
    .poll(() => summary.evaluate((element) => getComputedStyle(element).color))
    .not.toBe(light);
  await details.screenshot({
    path: testInfo.outputPath("disclosure-dark.png"),
  });
  const chevron = details.locator(".lo-ui-disclosure__chevron");
  await page.getByRole("main").evaluate((element) => {
    element.dir = "rtl";
  });
  await summary.focus();
  await page.keyboard.press("Space");
  await expect(details).not.toHaveAttribute("open");
  expect(
    await chevron.evaluate(
      (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
    ),
  ).toBe(-1);
  await page.keyboard.press("Space");
  await expect(details).toHaveAttribute("open", "");
  expect(
    await chevron.evaluate(
      (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).b,
    ),
  ).toBe(1);
  await page.getByRole("main").evaluate((element) => {
    element.dir = "ltr";
  });
  await page.keyboard.press("Space");
  expect(
    await chevron.evaluate((element) => getComputedStyle(element).transform),
  ).toBe("none");
});

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
  const notifications = page.getByRole("switch", {
    name: "Notifications",
    exact: true,
  });
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
  await trigger.focus();
  await page.keyboard.press("Enter");
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

for (const theme of ["light", "dark"] as const) {
  test(`${theme} forced colors preserve switch, tab and progress states`, async ({
    page,
  }) => {
    await page.emulateMedia({
      forcedColors: "active",
      reducedMotion: "reduce",
    });
    await page.goto("/");
    if (theme === "dark")
      await page.getByRole("button", { name: "Dark theme" }).click();
    const toggle = page.getByRole("switch", {
      name: "Notifications",
      exact: true,
    });
    await toggle.uncheck();
    await toggle.evaluate((element) => element.blur());
    const off = await toggle.screenshot();
    const visible = await toggle.evaluate((element) => {
      const track = getComputedStyle(element);
      const thumb = getComputedStyle(element, "::after");
      return {
        borderWidth: Number.parseFloat(track.borderTopWidth),
        border: track.borderTopColor,
        background: track.backgroundColor,
        thumb: thumb.backgroundColor,
      };
    });
    expect(visible.borderWidth).toBeGreaterThan(0);
    expect(visible.border).not.toBe(visible.background);
    expect(visible.thumb).not.toBe(visible.background);
    await toggle.check();
    await toggle.evaluate((element) => element.blur());
    expect(off.equals(await toggle.screenshot())).toBe(false);

    const selected = page.getByRole("tab", { name: "All", exact: true });
    const marker = await selected.evaluate((element) => ({
      text: getComputedStyle(element).color,
      fill: getComputedStyle(element, "::before").backgroundColor,
      canvas: getComputedStyle(document.querySelector("main")!).backgroundColor,
    }));
    expect(marker.fill).not.toBe(marker.canvas);
    expect(marker.text).not.toBe(marker.fill);
    await selected.focus();
    await page.keyboard.press("ArrowRight");
    await expectVisibleKeyboardFocus(
      page.getByRole("tab", { name: "Permissions and device sensors" }),
    );

    const progress = page.getByRole("progressbar", {
      name: "Example progress",
    });
    expect(
      await progress.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).borderTopWidth),
      ),
    ).toBeGreaterThan(0);
    const partial = await progress.screenshot();
    await progress.evaluate((element) => {
      (element as HTMLProgressElement).value = 80;
    });
    expect(partial.equals(await progress.screenshot())).toBe(false);
    const pending = page.getByRole("progressbar", { name: "Pending progress" });
    expect(
      await pending.evaluate(
        (element) => getComputedStyle(element).backgroundImage,
      ),
    ).toContain("linear-gradient");
    expect(
      await pending.evaluate(
        (element) => getComputedStyle(element).animationName,
      ),
    ).toBe("none");
  });
}

test("unbroken button labels wrap within 320px with and without an icon", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto("/");
  await page.evaluate(() => document.fonts.ready);
  for (const prefix of ["OpenWorkspace_", "InspectWorkspace_"]) {
    const button = page.getByRole("button", { name: new RegExp(`^${prefix}`) });
    const geometry = await button.evaluate((element) => ({
      width: element.clientWidth,
      scroll: element.scrollWidth,
      label:
        element.querySelector(".lo-ui-button__label")?.getBoundingClientRect()
          .height ?? 0,
      icon: element
        .querySelector(".lo-ui-button__icon")
        ?.getBoundingClientRect().width,
    }));
    expect(geometry.scroll).toBeLessThanOrEqual(geometry.width);
    expect(geometry.label).toBeGreaterThan(40);
    if (prefix === "InspectWorkspace_") expect(geometry.icon).toBe(20);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(
    320,
  );
});

test("switch thumbs stay inside their tracks in inherited LTR and RTL directions", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const toggle = page.getByRole("switch", { name: "RTL notifications" });
  for (const direction of ["ltr", "rtl"]) {
    await toggle.evaluate(
      (element, dir) => element.closest("[dir]")!.setAttribute("dir", dir),
      direction,
    );
    const positions: number[] = [];
    for (const checked of [false, true]) {
      await toggle.setChecked(checked);
      const thumb = await toggle.evaluate((element) => {
        const track = getComputedStyle(element),
          shape = getComputedStyle(element, "::after");
        const width = element.getBoundingClientRect().width;
        const size = Number.parseFloat(shape.width);
        const translation =
          shape.transform === "none" ? 0 : new DOMMatrix(shape.transform).m41;
        const start =
          track.direction === "rtl"
            ? width -
              Number.parseFloat(track.borderRightWidth) -
              Number.parseFloat(track.paddingRight) -
              size
            : Number.parseFloat(track.borderLeftWidth) +
              Number.parseFloat(track.paddingLeft);
        return {
          left: start + translation,
          right: start + translation + size,
          width,
        };
      });
      expect(thumb.left).toBeGreaterThanOrEqual(0);
      expect(thumb.right).toBeLessThanOrEqual(thumb.width);
      positions.push(thumb.left);
    }
    expect(
      direction === "rtl"
        ? positions[0] - positions[1]
        : positions[1] - positions[0],
    ).toBeGreaterThan(0);
  }
});

test("native indeterminate checkboxes show a distinct mixed state for either checked bit", async ({
  page,
  browserName,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("/");
  const checkbox = page.getByRole("checkbox", {
    name: "Partially selected group",
  });
  const modes =
    browserName === "chromium"
      ? (["none", "active"] as const)
      : (["none"] as const);
  for (const forcedColors of modes) {
    await page.emulateMedia({ forcedColors });
    const states: Buffer[] = [];
    for (const [checked, indeterminate] of [
      [false, false],
      [true, false],
      [false, true],
      [true, true],
    ]) {
      await checkbox.evaluate(
        (element, state) => {
          const input = element as HTMLInputElement;
          input.checked = state[0];
          input.indeterminate = state[1];
        },
        [checked, indeterminate],
      );
      if (indeterminate)
        await expect(checkbox).toBeChecked({ indeterminate: true });
      states.push(await checkbox.screenshot());
    }
    expect(states[2].equals(states[0])).toBe(false);
    expect(states[2].equals(states[1])).toBe(false);
    expect(states[3].equals(states[2])).toBe(true);
  }
});
