import { test, expect } from "@playwright/test";
const routes = [
  "/",
  "/characters",
  "/characters/ivan",
  "/philosophy",
  "/philosophy/evil",
  "/context",
  "/gallery",
  "/sources",
  "/map",
  "/timeline",
  "/quotes",
  "/cabinet",
  "/read/5-5",
];
test("museum routes render, links resolve and mobile layout stays within viewport", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  for (const route of routes) {
    const response = await page.goto(route);
    expect(response?.status(), route).toBe(200);
    await expect(page.locator("h1")).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
      route + " mobile overflow",
    ).toBeTruthy();
    await page.setViewportSize({ width: 1440, height: 1000 });
  }
  expect(errors).toEqual([]);
});
test("mobile menu navigates and future plot titles stay hidden in a profile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page.getByRole("button", { name: "Открыть меню" }).click();
  await page
    .getByRole("navigation", { name: "Мобильная навигация" })
    .getByRole("link", { name: "Персонажи", exact: true })
    .click();
  await expect(page).toHaveURL(/\/characters$/);
  await page.goto("/characters/ilyusha");
  await expect(
    page.getByText("Похороны Илюшечки", { exact: false }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Этот материал обсуждает события", { exact: false }).first(),
  ).toBeVisible();
});
