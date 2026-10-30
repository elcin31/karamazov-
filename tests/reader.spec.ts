import { expect, test, type Page } from "@playwright/test";

type StoredReader = {
  chapterId: string;
  paragraph: number;
  maxOrder: number;
  fontSize: number;
  lineHeight: number;
  readingTheme: string;
  bookmarks: { chapterId: string }[];
  notes: { chapterId: string; text: string }[];
};
async function storedReader(page: Page): Promise<StoredReader> {
  return page.evaluate(
    () =>
      new Promise<StoredReader>((resolve, reject) => {
        const request = indexedDB.open("karamazov-reader", 1);
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result;
          const get = db
            .transaction("state")
            .objectStore("state")
            .get("reader");
          get.onsuccess = () => {
            resolve(get.result);
            db.close();
          };
          get.onerror = () => reject(get.error);
        };
      }),
  );
}

test("reader saves preferences, bookmark and a note, then continues at the next chapter", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/read/1-1");
  await expect(page.locator(".reader-prose")).toContainText(
    "Алексей Федорович Карамазов был третьим сыном",
  );
  await page
    .getByRole("button", { name: "Настройки чтения", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Увеличить шрифт", exact: true })
    .click();
  await expect(page.locator(".reader-adjust output")).toHaveText("22 px");
  await page.getByLabel("Межстрочный интервал").selectOption("2.2");
  await page.getByRole("button", { name: "Ночь", exact: true }).click();
  await expect(page.locator(".reader-page")).toHaveClass(/reader-night/);
  await page
    .getByRole("button", { name: "Добавить закладку", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Удалить закладку", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Добавить заметку", exact: true })
    .click();
  await page
    .getByLabel("Ваша мысль о прочитанном")
    .fill("Семейная предыстория объясняет разобщённость братьев.");
  await page
    .getByRole("button", { name: "Сохранить заметку", exact: true })
    .click();
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "Сохранено на этом устройстве" }),
  ).toBeVisible();
  await expect
    .poll(async () => {
      const s = await storedReader(page);
      return s.notes.length;
    })
    .toBe(1);
  await page.reload();
  await expect(page.locator(".reader-prose")).toBeVisible();
  await expect(page.locator(".reader-page")).toHaveClass(/reader-night/);
  await expect(
    page.getByRole("button", { name: "Удалить закладку", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Настройки чтения", exact: true })
    .click();
  await expect(page.locator(".reader-adjust output")).toHaveText("22 px");
  await expect(page.getByLabel("Межстрочный интервал")).toHaveValue("2.2");
  await page.locator(".reader-chapter-nav a").last().click();
  await expect(page).toHaveURL(/\/read\/1-2$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Первого сына спровадил",
  );
  await expect(page.locator(".reader-prose")).toBeVisible();
  await expect
    .poll(async () => (await storedReader(page)).chapterId)
    .toBe("1-2");
  await expect
    .poll(async () => (await storedReader(page)).maxOrder)
    .toBeGreaterThanOrEqual(1);
  await page.goto("/cabinet");
  await expect(page.locator(".saved-notes")).toContainText(
    "Семейная предыстория объясняет разобщённость братьев.",
  );
  await expect(page.locator(".bookmark-list")).toContainText(
    "Федор Павлович Карамазов",
  );
  expect(errors).toEqual([]);
});

test("full-text search hides unread fragments and opens verified text when spoilers are allowed", async ({
  page,
}) => {
  await page.goto("/read?search=1");
  await expect(
    page.getByRole("heading", { name: "Найти в романе", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("textbox", { name: "Поиск по полному тексту", exact: true })
    .fill("инквизитор");
  await expect(
    page.getByRole("status").filter({ hasText: "Найдено глав: 0" }),
  ).toBeVisible();
  await expect(page.locator(".reader-search-results>a")).toHaveCount(0);
  await page.locator(".reader-search-caption button").click();
  await expect(page.locator(".reader-search-results>a").first()).toBeVisible();
  const inquisitor = page.getByRole("link", {
    name: /^Книга 5 · Великий инквизитор/,
  });
  await inquisitor.click();
  await expect(page).toHaveURL(/\/read\/5-5\?find=/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Великий инквизитор",
  );
  await expect(page.locator(".reader-prose mark").first()).toContainText(
    /инквизитор/i,
  );
});

test("paragraph position is restored and reading on a phone has no horizontal overflow", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/read/5-5");
  await expect(page.locator(".reader-prose p")).toHaveCount(62);
  await page.locator("#p-20").scrollIntoViewIfNeeded();
  await expect
    .poll(async () => (await storedReader(page)).paragraph)
    .toBeGreaterThan(5);
  const before = await storedReader(page);
  expect(before.maxOrder).toBeLessThan(96);
  await page.reload();
  await expect(page.locator(".reader-prose p")).toHaveCount(62);
  await expect
    .poll(async () =>
      page.locator(`#p-${before.paragraph}`).evaluate((el) => {
        const rect = el.getBoundingClientRect();
        return rect.top < innerHeight && rect.bottom > 0;
      }),
    )
    .toBe(true);
  await expect(page.locator(".reader-bottom-status")).toContainText(
    "романа прочитано",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Оглавление", exact: true }).click();
  await expect(page.locator("#reader-contents")).toBeVisible();
  await expect(page.locator("#reader-contents")).not.toContainText(
    "Похороны Илюшечки",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#reader-contents")).toHaveCount(0);
});
