"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  BookmarkPlus,
  BookmarkCheck,
  Heart,
  Download,
  Upload,
  Trash2,
  Clock3,
  LibraryBig,
} from "lucide-react";
import chapters from "@/data/chapters.json";
import quotes from "@/data/quotes.json";
import {
  useReader,
  hydrateReader,
  toggleSavedArticle,
  toggleFavoriteQuote,
  exportReaderBackup,
  importReaderBackup,
} from "@/lib/reader-store";
import "./archive-tools.css";
function useArchive() {
  const reader = useReader();
  useEffect(() => {
    void hydrateReader();
  }, []);
  return reader;
}
export function SaveArticle({
  id,
  title,
  url,
}: {
  id: string;
  title: string;
  url: string;
}) {
  const reader = useArchive();
  const saved = reader.savedArticles.some((a) => a.id === id);
  return (
    <button
      type="button"
      className={`archive-save ${saved ? "is-saved" : ""}`}
      aria-pressed={saved}
      disabled={!reader.hydrated}
      onClick={() => toggleSavedArticle({ id, title, url })}
    >
      {saved ? <BookmarkCheck size={17} /> : <BookmarkPlus size={17} />}
      {saved ? "В читательском архиве" : "Сохранить статью"}
    </button>
  );
}
export function FavoriteQuote({ id }: { id: string }) {
  const reader = useArchive();
  const saved = reader.favoriteQuoteIds.includes(id);
  return (
    <button
      type="button"
      className={`archive-favorite ${saved ? "is-saved" : ""}`}
      aria-pressed={saved}
      disabled={!reader.hydrated}
      onClick={() => toggleFavoriteQuote(id)}
      aria-label={
        saved ? "Убрать цитату из избранного" : "Сохранить цитату в избранное"
      }
    >
      <Heart size={17} fill={saved ? "currentColor" : "none"} />
      <span>{saved ? "В избранном" : "В избранное"}</span>
    </button>
  );
}
export function ArchiveTools() {
  const reader = useArchive();
  const input = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const bookGroups = [
    ...new Set(chapters.filter((c) => c.book > 0).map((c) => c.book)),
  ].map((book) => {
    const entries = chapters.filter((c) => c.book === book);
    return {
      book,
      title: entries[0].bookTitle,
      total: entries.length,
      read: entries.filter((c) => c.order <= reader.maxOrder).length,
    };
  });
  function download() {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(exportReaderBackup(), null, 2)], {
        type: "application/json",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "karamazov-archive-v2.json";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage("Резервная копия архива сохранена в JSON.");
  }
  async function restore(file?: File) {
    if (!file) return;
    setBusy(true);
    setMessage("");
    try {
      if (file.size > 10 * 1024 * 1024)
        throw Error("Файл больше 10 МБ. Выберите резервную копию архива.");
      const result = await importReaderBackup(JSON.parse(await file.text()));
      setMessage(
        `Архив объединён с текущим: ${result.notes} заметок, ${result.bookmarks} закладок, ${result.articles} статей и ${result.quotes} цитат в файле. Существующие записи сохранены.`,
      );
    } catch (e) {
      setMessage(
        e instanceof Error ? e.message : "Не удалось прочитать файл архива.",
      );
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }
  return (
    <section
      className="reader-archive"
      aria-label="Расширенный читательский архив"
    >
      <header className="archive-section-heading">
        <div>
          <span className="eyebrow">ВАША ЛИЧНАЯ КОЛЛЕКЦИЯ</span>
          <h2>Архив читателя</h2>
        </div>
        <div className="archive-backup-actions">
          <button type="button" onClick={download} disabled={!reader.hydrated}>
            <Download size={17} />
            Скачать резервную копию
          </button>
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={!reader.hydrated || busy}
          >
            <Upload size={17} />
            {busy ? "Проверяем файл…" : "Восстановить из файла"}
          </button>
          <input
            ref={input}
            type="file"
            accept="application/json,.json"
            aria-label="Файл резервной копии"
            className="archive-file-input"
            onChange={(e) => void restore(e.target.files?.[0])}
          />
        </div>
      </header>
      <p className="archive-backup-note">
        Импорт поддерживает тетради версий 1 и 2 и объединяет записи. Текущие
        настройки чтения сохраняются. Прогресс продолжается с наиболее поздней
        прочитанной главы; для судебной тетради выбирается более свежая запись.
        Данные остаются в этом браузере.
      </p>
      <p role="status" className="archive-feedback">
        {message}
      </p>
      <div className="archive-columns">
        <section>
          <h3>
            <LibraryBig size={19} />
            Сохранённые исследования <span>{reader.savedArticles.length}</span>
          </h3>
          {reader.savedArticles.length ? (
            <ul className="archive-list">
              {[...reader.savedArticles].reverse().map((a) => (
                <li key={a.id}>
                  <Link href={a.url}>{a.title}</Link>
                  <button
                    type="button"
                    onClick={() => toggleSavedArticle(a)}
                    aria-label={`Удалить сохранённую статью: ${a.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="archive-empty">
              Кнопка «Сохранить статью» на исследовательских страницах добавит
              их сюда.
            </p>
          )}
        </section>
        <section>
          <h3>
            <Heart size={19} />
            Избранные цитаты <span>{reader.favoriteQuoteIds.length}</span>
          </h3>
          {reader.favoriteQuoteIds.length ? (
            <ul className="archive-quote-list">
              {reader.favoriteQuoteIds.map((id) => {
                const q = quotes.find((q) => q.id === id);
                if (!q) return null;
                const c = chapters.find((c) => c.id === q.chapterId);
                const visible =
                  !reader.spoilerFree ||
                  (c?.order ?? Infinity) <= reader.maxOrder;
                return (
                  <li key={id}>
                    {visible ? (
                      <>
                        <blockquote>«{q.text}»</blockquote>
                        <Link href={`/read/${q.chapterId}`}>
                          {q.speaker} · {c?.book}.{c?.chapter}
                        </Link>
                      </>
                    ) : (
                      <p>Цитата из ещё не прочитанной главы скрыта.</p>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleFavoriteQuote(id)}
                      aria-label="Убрать цитату из избранного"
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="archive-empty">
              Собирайте собственную антологию романа кнопкой с сердцем в атласе
              цитат.
            </p>
          )}
        </section>
      </div>
      <section className="archive-progress">
        <h3>Книга за книгой</h3>
        <div className="archive-book-progress">
          {bookGroups.map((g) => (
            <div key={g.book}>
              <span>{g.book === 13 ? "Эпилог" : `Книга ${g.book}`}</span>
              <progress
                value={g.read}
                max={g.total}
                aria-label={`${g.book === 13 ? "Эпилог" : `Книга ${g.book}`}: прочитано ${g.read} из ${g.total} глав`}
              />
              <small>
                {g.read} / {g.total}
              </small>
            </div>
          ))}
        </div>
      </section>
      <section className="archive-history">
        <h3>
          <Clock3 size={19} />
          История чтения
        </h3>
        {reader.history.length ? (
          <ol>
            {reader.history.slice(0, 20).map((visit) => {
              const c = chapters.find((c) => c.id === visit.chapterId);
              return c ? (
                <li key={visit.chapterId}>
                  <Link href={`/read/${c.id}`}>
                    {c.book === 0
                      ? "От автора"
                      : `${c.book === 13 ? "Эпилог" : `Книга ${c.book}`} · ${c.title}`}
                  </Link>
                  <time dateTime={new Date(visit.visitedAt).toISOString()}>
                    {new Date(visit.visitedAt).toLocaleDateString("ru-RU")}
                  </time>
                </li>
              ) : null;
            })}
          </ol>
        ) : (
          <p className="archive-empty">
            Посещённые главы появятся здесь после открытия читалки.
          </p>
        )}
      </section>
    </section>
  );
}
