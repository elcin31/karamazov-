import { test, expect } from "@playwright/test";
test("saved research and favourite quotes survive reload and can be removed", async ({
  page,
}) => {
  await page.goto("/philosophy/god");
  await page
    .getByRole("button", { name: "Сохранить статью", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "В читательском архиве", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.locator(".spoiler-switch").click();
  await page.goto("/quotes");
  await page
    .getByRole("button", { name: "Сохранить цитату в избранное", exact: true })
    .first()
    .click();
  await page.goto("/cabinet");
  await expect(page.locator(".archive-list li")).toHaveCount(1);
  await expect(page.locator(".archive-quote-list li")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".archive-list li")).toHaveCount(1);
  await expect(page.locator(".archive-quote-list li")).toHaveCount(1);
  await page
    .getByRole("button", { name: /Удалить сохранённую статью:/ })
    .click();
  await page
    .locator(".archive-quote-list")
    .getByRole("button", { name: "Убрать цитату из избранного", exact: true })
    .click();
  await expect(page.locator(".archive-list li")).toHaveCount(0);
  await expect(page.locator(".archive-quote-list li")).toHaveCount(0);
});
test("character neighbourhood gives a working mobile alternative to the full graph", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 844 });
  await page.goto("/map");
  await expect(page.locator(".react-flow__node")).toHaveCount(30);
  await page.locator(".spoiler-switch").click();
  await page
    .getByLabel("Выбрать героя", { exact: true })
    .selectOption("dmitri");
  await page
    .getByLabel("Только связи выбранного героя", { exact: true })
    .check();
  await expect(page.locator(".react-flow__node.selected-person")).toContainText(
    "Дмитрий",
  );
  const count = await page.locator(".react-flow__node").count();
  expect(count).toBeGreaterThan(1);
  expect(count).toBeLessThan(30);
  await page.getByRole("button", { name: "Родство", exact: true }).click();
  await expect(page.locator(".react-flow__edge").first()).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBeTruthy();
});
