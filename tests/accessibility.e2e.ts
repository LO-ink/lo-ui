import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page, type TestInfo } from "@playwright/test";

async function scan(page: Page, testInfo: TestInfo, state: string) {
  const result = await new AxeBuilder({ page }).analyze();
  await testInfo.attach(`axe-${state}`, {
    body: JSON.stringify(result, null, 2),
    contentType: "application/json",
  });
  expect(result.violations).toEqual([]);
}

for (const theme of ["light", "dark"] as const) {
  for (const width of [1280, 320]) {
    test(`${theme} gallery accessibility at ${width}px, including interactive states`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      if (theme === "dark")
        await page.getByRole("button", { name: "Dark theme" }).click();
      await page.evaluate(() => document.fonts.ready);

      // All 18 exported primitives are represented; Dialog is scanned after showModal.
      for (const component of [
        "app-icon",
        "button",
        "empty-state",
        "inline",
        "stack",
        "cell",
        "list",
        "checkbox",
        "switch",
        "field",
        "heading",
        "text",
        "textarea",
        "surface",
        "dialog",
        "disclosure",
        "progress",
        "tabs",
      ]) {
        expect(
          await page.locator(`.lo-ui-${component}`).count(),
          component,
        ).toBeGreaterThan(0);
      }
      await scan(page, testInfo, "initial");

      await page.getByRole("textbox", { name: "List name" }).fill("a");
      await expect(
        page.getByRole("textbox", { name: "List name" }),
      ).toHaveAttribute("aria-invalid", "true");
      await page
        .getByRole("checkbox", { name: "Private list", exact: true })
        .check();
      await page
        .getByRole("switch", { name: "Notifications", exact: true })
        .uncheck();
      await page.getByRole("tab", { name: "Storage", exact: true }).click();
      await page.locator("summary").click();
      await expect(
        page.getByRole("textbox", { name: "Result notes" }),
      ).toBeVisible();
      await scan(page, testInfo, "validation-selection-disclosure");
      await page.screenshot({
        path: testInfo.outputPath(`gallery-${theme}-${width}.png`),
        fullPage: true,
      });

      await page
        .getByRole("button", { name: "Open dialog", exact: true })
        .click();
      await expect(
        page.getByRole("dialog", { name: "Example dialog" }),
      ).toBeVisible();
      await scan(page, testInfo, "modal");
      await page.screenshot({
        path: testInfo.outputPath(`modal-${theme}-${width}.png`),
      });
      await page
        .getByRole("button", { name: "Close dialog", exact: true })
        .click();
      await expect(page.getByRole("dialog")).not.toBeVisible();
    });
  }
}
