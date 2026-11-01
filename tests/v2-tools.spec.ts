import { readFile } from "node:fs/promises";
import { test, expect } from "@playwright/test";

test("collection filters and keyboard lightbox work with rights visible", async ({
  page,
}) => {
  await page.goto("/gallery");
  await expect(page.locator(".collection-work").first()).toBeVisible();
  await page.getByLabel("Тип изображения").selectOption("generated");
  await expect(page.locator(".collection-work").first()).toBeVisible();
  const opener = page.locator(".collection-open").first();
  await opener.click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.locator(".lightbox-caption a").first()).toBeVisible();
  await dialog
    .getByRole("button", { name: "Увеличить изображение", exact: true })
    .click();
  await expect(dialog.locator(".lightbox-art")).toHaveClass(/is-zoomed/);
  const first = await dialog.locator("h2").textContent();
  await page.keyboard.press("ArrowRight");
  await expect(dialog.locator("h2")).not.toHaveText(first ?? "");
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test("court keeps jury information separate and saves a considered verdict", async ({
  page,
}) => {
  await page.goto("/court");
  await expect(page.locator(".court-locked")).toBeVisible();
  await page
    .getByRole("button", { name: "Открыть дело со спойлерами" })
    .click();
  await expect(
    page.locator(".court-evidence-list .court-evidence"),
  ).toHaveCount(10);
  await page.locator(".court-evidence-list .evidence-select").first().click();
  await expect(page.locator(".comparison-list section")).toHaveCount(1);
  await page.getByRole("button", { name: /Что знает читатель/ }).click();
  await expect(
    page.locator(".court-evidence-list .court-evidence"),
  ).toHaveCount(12);
  await expect(
    page.getByText("Только знание читателя", { exact: true }),
  ).toHaveCount(2);
  await page
    .getByLabel("На каких доводах она основана?")
    .fill("Угроза не устанавливает, кто совершил действие.");
  await page.getByLabel("Обвинение не доказано", { exact: true }).check();
  await page
    .getByRole("button", { name: "Сохранить позицию", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("Позиция сохранена");
  await page.reload();
  await expect(
    page.getByLabel("Обвинение не доказано", { exact: true }),
  ).toBeChecked();
  await expect(page.getByLabel("На каких доводах она основана?")).toHaveValue(
    "Угроза не устанавливает, кто совершил действие.",
  );
  await expect(page.locator(".comparison-list section")).toHaveCount(1);
});

test("site search groups catalogue and original-text matches", async ({
  page,
}) => {
  await page.goto("/search");
  await page.getByRole("button", { name: "Без спойлеров: включено" }).click();
  await page
    .getByRole("searchbox", { name: "Поиск по всему музею" })
    .fill("Иван");
  await expect(page.locator(".search-group").first()).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Оригинальный текст", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".search-group h3").first()).toContainText(/Иван/i);
  await page.getByLabel("Искать также в полном тексте").uncheck();
  await expect(
    page.getByRole("heading", { name: "Оригинальный текст", exact: true }),
  ).toHaveCount(0);
});

test("v1 notebook backup merges without deleting existing records", async ({
  page,
}) => {
  await page.goto("/cabinet");
  await expect(
    page.getByRole("heading", { name: "Архив читателя", exact: true }),
  ).toBeVisible();
  const backup = {
    version: 1,
    progress: { chapterId: "1-1", maxOrder: 1, paragraph: 0 },
    bookmarks: [
      { chapterId: "1-1", title: "Федор Павлович Карамазов", createdAt: 1 },
    ],
    notes: [
      {
        id: "imported-note",
        chapterId: "1-1",
        text: "Проверка восстановления старой тетради.",
        createdAt: 1,
      },
    ],
  };
  await page.getByLabel("Файл резервной копии").setInputFiles({
    name: "old-notebook.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator(".archive-feedback")).toContainText(
    "Архив объединён",
  );
  const conflicting = {
    ...backup,
    notes: [
      {
        ...backup.notes[0],
        text: "Вторая запись с совпавшим идентификатором.",
      },
    ],
  };
  await page
    .getByLabel("Файл резервной копии")
    .setInputFiles({
      name: "conflicting-notebook.json",
      mimeType: "application/json",
      buffer: Buffer.from(JSON.stringify(conflicting)),
    });
  await expect(page.locator(".archive-feedback")).toContainText(
    "Архив объединён",
  );
  await page.reload();
  await expect(
    page.getByText("Проверка восстановления старой тетради.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Вторая запись с совпавшим идентификатором.", {
      exact: true,
    }),
  ).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Скачать резервную копию", exact: true })
      .click(),
  ]);
  expect(download.suggestedFilename()).toContain("v2");
  const exported = JSON.parse(await readFile((await download.path())!, "utf8"));
  expect(exported.version).toBe(2);
  expect(exported.reader.notes).toHaveLength(2);
});

test("editorial search loads the deep index only when needed and finds a body-only phrase", async ({
  page,
}) => {
  const editorialRequests: string[] = [];
  page.on("request", (request) => {
    if (new URL(request.url()).pathname === "/api/search-index")
      editorialRequests.push(request.url());
  });
  await page.goto("/search");
  await expect(
    page.getByRole("searchbox", { name: "Поиск по всему музею" }),
  ).toBeVisible();
  expect(editorialRequests).toHaveLength(0);
  await page.getByLabel("Искать также в полном тексте").uncheck();
  await page.getByRole("button", { name: "Без спойлеров: включено" }).click();
  await page
    .getByRole("searchbox", { name: "Поиск по всему музею" })
    .fill("без собственного разрешения");
  await expect(
    page.getByRole("heading", { name: "Статьи", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".search-group h3")).toContainText([
    "Фёдор Павлович: исследовательское досье",
  ]);
  await expect(page.locator(".search-group p mark").first()).toHaveText(
    "без собственного разрешения",
  );
  expect(editorialRequests).toHaveLength(1);
  await page.getByRole("button", { name: "Все материалы открыты" }).click();
  await expect(page.locator(".search-group h3")).toHaveCount(0);
});
