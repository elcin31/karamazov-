import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("map filters relationships and selects a hero", async ({ page }) => {
  await page.goto("/map");
  await expect(
    page.getByRole("heading", { name: "Нити, связывающие героев" }),
  ).toBeVisible();
  await expect(page.locator(".react-flow__node").first()).toBeVisible();
  await expect(page.locator(".map-visible-count")).toContainText("0 связей");
  await page
    .locator(".spoiler-control")
    .getByRole("button", { name: "Без спойлеров", exact: true })
    .click();
  await expect(page.locator(".map-visible-count")).not.toContainText(
    "0 связей",
  );
  await page.getByRole("button", { name: "Родство", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Родство", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");
  await page.getByLabel("Выбрать героя", { exact: true }).selectOption("ivan");
  await expect(page.locator(".map-person h2")).toContainText("Иван");
  await expect(
    page.locator(".map-person").getByRole("link", { name: "Открыть портрет" }),
  ).toHaveAttribute("href", "/characters/ivan");
  await page.getByText(/Текстовый список отношений/).click();
  await expect(
    page.locator(".accessible-connections li").first(),
  ).toBeVisible();
});

test("timeline protects future events until spoilers are disabled", async ({
  page,
}) => {
  await page.goto("/timeline");
  await expect(page.locator(".event-locked")).not.toHaveCount(0);
  await expect(page.locator(".timeline-body").first()).toContainText(
    "Событие ещё не открыто",
  );
  await page
    .locator(".spoiler-control")
    .getByRole("button", { name: "Без спойлеров", exact: true })
    .click();
  await expect(page.locator(".event-locked")).toHaveCount(0);
  await expect(
    page.locator(".novel-timeline .text-link").first(),
  ).toBeVisible();
  await page.reload();
  await expect(page.locator(".event-locked")).toHaveCount(0);
});

test("quote atlas searches verified text and saves chapter bookmarks", async ({
  page,
}) => {
  await page.goto("/quotes");
  await expect(
    page.getByRole("heading", { name: "Цитаты откроются во время чтения" }),
  ).toBeVisible();
  await page
    .locator(".spoiler-control")
    .getByRole("button", { name: "Без спойлеров", exact: true })
    .click();
  await expect(page.locator(".atlas-quote").first()).toBeVisible();
  await page.getByLabel("Поиск по цитатам").fill("Главное, самому себе не лгите.");
  await expect(page.locator(".atlas-quote")).toHaveCount(1);
  await expect(page.locator(".atlas-quote blockquote")).toContainText(
    "самому себе не лгите",
  );
  await page
    .getByRole("button", { name: "Добавить закладку главы", exact: true })
    .click();
  await page.goto("/cabinet");
  await expect(page.locator(".bookmark-list li")).toHaveCount(1);
  await page.reload();
  await expect(page.locator(".bookmark-list li")).toHaveCount(1);
  await page.getByRole("button", { name: /Удалить закладку:/ }).click();
  await expect(page.locator(".bookmark-list li")).toHaveCount(0);
});

test("cabinet persists note, exports notebook, and deletes note", async ({
  page,
}) => {
  await page.goto("/cabinet");
  await page
    .getByLabel("Ваша мысль")
    .fill("Тестовая заметка о свободе и ответственности.");
  await page
    .getByRole("button", { name: "Сохранить заметку", exact: true })
    .click();
  await expect(page.locator(".saved-notes article p")).toHaveText(
    "Тестовая заметка о свободе и ответственности.",
  );
  await page.reload();
  await expect(page.locator(".saved-notes article p")).toHaveText(
    "Тестовая заметка о свободе и ответственности.",
  );
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Скачать тетрадь" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe("karamazov-notebook.json");
  const backup = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(backup.notes).toEqual([expect.objectContaining({text:"Тестовая заметка о свободе и ответственности."})]);
  await page
    .getByRole("button", { name: "Удалить заметку", exact: true })
    .click();
  await expect(page.locator(".saved-notes article")).toHaveCount(0);
  await page.reload();
  await expect(page.locator(".saved-notes article")).toHaveCount(0);
});

test("interactive pages fit a narrow mobile viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  for (const route of ["/map", "/timeline", "/quotes", "/cabinet"]) {
    await page.goto(route);
    await expect(page.locator(".page-title")).toBeVisible();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth,
    );
    expect(overflow, `${route} should not overflow horizontally`).toBe(false);
  }
});
