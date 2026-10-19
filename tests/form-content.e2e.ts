import { expect, test } from "@playwright/test";

for (const theme of ["light", "dark"]) {
  test(`${theme} zero form content remains named, described and styled`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.goto("/");
    if (theme === "dark")
      await page.getByRole("button", { name: "Dark theme" }).click();
    for (const index of [0, 1]) {
      const form = page.getByTestId(`zero-form-${index}`);
      await expect(
        form.getByRole("textbox", { name: "0", exact: true }),
      ).toHaveCount(2);
      for (const field of await form
        .getByRole("textbox", { name: "0", exact: true })
        .all()) {
        await expect(field).toHaveAccessibleDescription("0 0");
        await expect(field).toHaveAttribute("aria-invalid", "true");
        await field.focus();
        await expect(field).toBeFocused();
      }
      for (const role of ["checkbox", "switch"] as const) {
        const control = form.getByRole(role, { name: "0", exact: true });
        await expect(control).toHaveAccessibleDescription("0");
        await control.focus();
        await control.press("Space");
        await expect(control).toBeChecked();
      }
      for (const slot of [
        ".lo-ui-field__description",
        ".lo-ui-field__error",
        ".lo-ui-selection__description",
      ]) {
        await expect(form.locator(slot)).toHaveCount(2);
        for (const text of await form.locator(slot).all()) {
          await expect(text).toHaveText("0");
          await expect(text).toBeVisible();
        }
      }
    }
  });
}
