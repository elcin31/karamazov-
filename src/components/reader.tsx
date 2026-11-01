"use client";

import Link from "next/link";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  ChevronDown,
  List,
  Minus,
  Moon,
  Plus,
  Search,
  StickyNote,
  Sun,
  X,
} from "lucide-react";
import chaptersData from "@/data/chapters.json";
import type { Chapter } from "@/lib/types";
import {
  addNote,
  hydrateReader,
  toggleBookmark,
  updateReader,
  useReader,
} from "@/lib/reader-store";
import "./reader.css";

const chapters: Chapter[] = chaptersData;
const books = [...new Set(chapters.map((c) => c.book))];
type SearchChapter = {
  id: string;
  title: string;
  book: number;
  order: number;
  text: string;
};
let searchCache: SearchChapter[] | null = null;
let searchRequest: Promise<SearchChapter[]> | undefined;
function loadSearch() {
  if (searchCache) return Promise.resolve(searchCache);
  if (!searchRequest)
    searchRequest = fetch("/text/search.json")
      .then((r) => {
        if (!r.ok) throw Error("search");
        return r.json();
      })
      .then((data: SearchChapter[]) => {
        searchCache = data;
        return data;
      })
      .catch((e) => {
        searchRequest = undefined;
        throw e;
      });
  return searchRequest;
}
function bookLabel(c: Chapter) {
  return c.book === 0
    ? "От автора"
    : c.book === 13
      ? "Эпилог"
      : `Книга ${c.book}. ${c.bookTitle}`;
}
function Highlight({ text, query }: { text: string; query: string }) {
  if (query.trim().length < 2) return <>{text}</>;
  const needle = query.toLocaleLowerCase("ru");
  const at = text.toLocaleLowerCase("ru").indexOf(needle);
  if (at < 0) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}

function ReaderLocation({
  onFind,
  onSearch,
}: {
  onFind: (query: string) => void;
  onSearch: (open: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const find = searchParams.get("find") || "";
  const search = searchParams.get("search");
  useEffect(() => {
    onFind(find);
    if (search === "1") onSearch(true);
  }, [find, search, onFind, onSearch]);
  return null;
}

export function Reader({ chapterId }: { chapterId?: string }) {
  const reader = useReader();
  const current =
    chapters.find(
      (c) =>
        c.id ===
        (chapterId || (reader.hydrated ? reader.chapterId : "preface")),
    ) || chapters[0];
  const [paragraphs, setParagraphs] = useState<string[]>([]);
  const [loadedId, setLoadedId] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contentsOpen, setContentsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [noteOpen, setNoteOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteSaved, setNoteSaved] = useState(false);
  const [query, setQuery] = useState("");
  const [findText, setFindText] = useState("");
  const [results, setResults] = useState<SearchChapter[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const articleRef = useRef<HTMLElement>(null);
  const readerRef = useRef(reader);
  readerRef.current = reader;
  const restored = useRef("");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );
  const previous = chapters[current.order - 1];
  const next = chapters[current.order + 1];
  const isBookmarked = reader.bookmarks.some((b) => b.chapterId === current.id);

  useEffect(() => {
    void hydrateReader();
  }, []);
  useEffect(() => {
    if (!reader.hydrated) return;
    const controller = new AbortController();
    setLoading(true);
    setError(false);
    setParagraphs([]);
    setLoadedId("");
    restored.current = "";
    fetch(`/text/chapters/${current.id}.json`, { signal: controller.signal })
      .then((r) => {
        if (!r.ok) throw Error("text");
        return r.json();
      })
      .then((data) => {
        if (!Array.isArray(data.paragraphs) || data.paragraphs.length === 0)
          throw Error("empty");
        setParagraphs(data.paragraphs);
        setLoadedId(current.id);
        setLoading(false);
      })
      .catch((e) => {
        if (e.name !== "AbortError") {
          setError(true);
          setLoading(false);
        }
      });
    return () => controller.abort();
  }, [current.id, reader.hydrated]);

  useEffect(() => {
    if (
      !reader.hydrated ||
      loading ||
      loadedId !== current.id ||
      !paragraphs.length ||
      restored.current === current.id
    )
      return;
    restored.current = current.id;
    const savedParagraph =
      reader.chapterId === current.id ? reader.paragraph : 0;
    const match = findText
      ? paragraphs.findIndex((p) =>
          p.toLocaleLowerCase("ru").includes(findText.toLocaleLowerCase("ru")),
        )
      : -1;
    const target = match >= 0 ? match : savedParagraph;
    updateReader({ chapterId: current.id, paragraph: target });
    if (target > 0 || match >= 0)
      requestAnimationFrame(() =>
        document
          .getElementById(`p-${target}`)
          ?.scrollIntoView({ block: "center" }),
      );
  }, [
    loading,
    loadedId,
    paragraphs,
    current.id,
    reader.hydrated,
    reader.chapterId,
    reader.paragraph,
    findText,
  ]);

  useEffect(() => {
    if (!findText || loading || loadedId !== current.id) return;
    const match = paragraphs.findIndex((p) =>
      p.toLocaleLowerCase("ru").includes(findText.toLocaleLowerCase("ru")),
    );
    if (match >= 0)
      requestAnimationFrame(() =>
        document
          .getElementById(`p-${match}`)
          ?.scrollIntoView({ block: "center" }),
      );
  }, [findText, loading, loadedId, current.id, paragraphs]);

  useEffect(() => {
    if (
      loading ||
      loadedId !== current.id ||
      !paragraphs.length ||
      !articleRef.current
    )
      return;
    let latestParagraph =
      reader.chapterId === current.id ? reader.paragraph : 0;
    const persist = () => {
      const lastRead =
        latestParagraph >= paragraphs.length - 1
          ? current.order
          : Math.max(0, current.order - 1);
      updateReader({
        chapterId: current.id,
        paragraph: latestParagraph,
        maxOrder: Math.max(readerRef.current.maxOrder, lastRead),
      });
    };
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (!visible.length) return;
        latestParagraph = Number(
          (visible[0].target as HTMLElement).dataset.paragraph || 0,
        );
        clearTimeout(saveTimer.current);
        saveTimer.current = setTimeout(persist, 350);
      },
      { rootMargin: "-15% 0px -45% 0px", threshold: 0 },
    );
    articleRef.current
      .querySelectorAll("[data-paragraph]")
      .forEach((el) => observer.observe(el));
    const onPageHide = () => persist();
    window.addEventListener("pagehide", onPageHide);
    return () => {
      observer.disconnect();
      clearTimeout(saveTimer.current);
      window.removeEventListener("pagehide", onPageHide);
    };
    // A new observer is needed only when the text changes, not on every stored paragraph.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, loadedId, paragraphs, current.id]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setResults([]);
      setSearchLoading(false);
      return;
    }
    let active = true;
    setSearchLoading(true);
    setSearchError(false);
    const timeout = setTimeout(() => {
      loadSearch()
        .then((data) => {
          if (!active) return;
          const normalized = term.toLocaleLowerCase("ru");
          setResults(
            data.filter(
              (c) =>
                (!reader.spoilerFree || c.order <= reader.maxOrder) &&
                c.text.toLocaleLowerCase("ru").includes(normalized),
            ),
          );
          setSearchLoading(false);
        })
        .catch(() => {
          if (active) {
            setSearchError(true);
            setSearchLoading(false);
          }
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [query, reader.spoilerFree, reader.maxOrder]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setContentsOpen(false);
        setSearchOpen(false);
        setSettingsOpen(false);
        setNoteOpen(false);
      }
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);

  function saveNote(e: React.FormEvent) {
    e.preventDefault();
    if (!note.trim()) return;
    addNote(current.id, note);
    setNote("");
    setNoteSaved(true);
  }
  function excerpt(text: string) {
    const at = text
      .toLocaleLowerCase("ru")
      .indexOf(query.trim().toLocaleLowerCase("ru"));
    return `${at > 80 ? "…" : ""}${text.slice(Math.max(0, at - 80), at + 180)}…`;
  }
  const progress = Math.round((reader.maxOrder / (chapters.length - 1)) * 100);
  const safeChapterTitle = (chapter: Chapter) =>
    reader.spoilerFree &&
    chapter.order > reader.maxOrder &&
    chapter.id !== current.id
      ? `Глава ${chapter.chapter}`
      : chapter.title;

  return (
    <div className={`reader-page reader-${reader.readingTheme}`}>
      <Suspense fallback={null}>
        <ReaderLocation onFind={setFindText} onSearch={setSearchOpen} />
      </Suspense>
      <div className="reader-toolbar">
        <button
          className="reader-tool"
          onClick={() => setContentsOpen(!contentsOpen)}
          aria-expanded={contentsOpen}
          aria-controls="reader-contents"
        >
          <List size={19} />
          <span>Оглавление</span>
        </button>
        <span className="reader-toolbar-book">
          {current.book === 0
            ? "Ф. М. Достоевский"
            : current.book === 13
              ? "Эпилог"
              : `Книга ${current.book} из 12`}
        </span>
        <div className="reader-tool-group">
          <button
            className="reader-tool"
            onClick={() => setSearchOpen(!searchOpen)}
            aria-expanded={searchOpen}
            aria-label="Поиск по роману"
          >
            <Search size={18} />
          </button>
          <button
            className="reader-tool reader-type-tool"
            onClick={() => setSettingsOpen(!settingsOpen)}
            aria-expanded={settingsOpen}
            aria-label="Настройки чтения"
          >
            Аа
          </button>
          <button
            className={`reader-tool ${isBookmarked ? "is-active" : ""}`}
            onClick={() => toggleBookmark(current.id, current.title)}
            aria-pressed={isBookmarked}
            aria-label={isBookmarked ? "Удалить закладку" : "Добавить закладку"}
          >
            <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
          </button>
          <button
            className="reader-tool"
            onClick={() => {
              setNoteOpen(!noteOpen);
              setNoteSaved(false);
            }}
            aria-expanded={noteOpen}
            aria-label="Добавить заметку"
          >
            <StickyNote size={18} />
          </button>
        </div>
      </div>
      <div className="reader-progress-track" aria-hidden="true">
        <span style={{ width: `${progress}%` }} />
      </div>
      {reader.storageError && (
        <p className="reader-storage-warning" role="status">
          Браузер ограничил локальное хранилище. Прогресс доступен в этой
          вкладке, но может не сохраниться после закрытия.
        </p>
      )}

      {settingsOpen && (
        <section className="reader-settings" aria-label="Настройки чтения">
          <div>
            <span className="reader-control-label">Размер текста</span>
            <div className="reader-adjust">
              <button
                aria-label="Уменьшить шрифт"
                disabled={reader.fontSize <= 16}
                onClick={() =>
                  updateReader({ fontSize: Math.max(16, reader.fontSize - 1) })
                }
              >
                <Minus size={16} />
              </button>
              <output>{reader.fontSize} px</output>
              <button
                aria-label="Увеличить шрифт"
                disabled={reader.fontSize >= 32}
                onClick={() =>
                  updateReader({ fontSize: Math.min(32, reader.fontSize + 1) })
                }
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <label>
            <span className="reader-control-label">Межстрочный интервал</span>
            <select
              value={reader.lineHeight}
              onChange={(e) =>
                updateReader({ lineHeight: Number(e.target.value) })
              }
            >
              <option value={1.5}>Компактный · 1,5</option>
              <option value={1.85}>Книжный · 1,85</option>
              <option value={2.2}>Свободный · 2,2</option>
            </select>
          </label>
          <div>
            <span className="reader-control-label">Бумага и свет</span>
            <div className="reader-theme-choices">
              <button
                onClick={() => updateReader({ readingTheme: "paper" })}
                aria-pressed={reader.readingTheme === "paper"}
              >
                <Sun size={16} /> День
              </button>
              <button
                onClick={() => updateReader({ readingTheme: "night" })}
                aria-pressed={reader.readingTheme === "night"}
              >
                <Moon size={16} /> Ночь
              </button>
            </div>
          </div>
        </section>
      )}

      {searchOpen && (
        <section className="reader-search" aria-label="Поиск по полному тексту">
          <div className="reader-panel-heading">
            <h2>Найти в романе</h2>
            <button
              className="reader-tool"
              onClick={() => setSearchOpen(false)}
              aria-label="Закрыть поиск"
            >
              <X size={19} />
            </button>
          </div>
          <label className="reader-search-field">
            <Search size={18} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Слово или точная фраза…"
              aria-label="Поиск по полному тексту"
            />
          </label>
          <div className="reader-search-caption">
            <span>Весь русский текст · 97 разделов</span>
            <button
              onClick={() => updateReader({ spoilerFree: !reader.spoilerFree })}
              aria-pressed={reader.spoilerFree}
            >
              {reader.spoilerFree
                ? "Без спойлеров: прочитанные главы"
                : "Все главы, включая будущие"}
            </button>
          </div>
          {query.trim().length < 2 ? (
            <p className="reader-muted">
              Введите не менее двух букв. При первом поиске загружается полный
              текст.
            </p>
          ) : searchLoading ? (
            <p role="status" className="reader-muted">
              Ищем в тексте…
            </p>
          ) : searchError ? (
            <p role="alert">
              Не удалось загрузить поисковый индекс. Измените запрос, чтобы
              повторить.
            </p>
          ) : (
            <>
              <p className="reader-muted" role="status">
                Найдено глав: {results.length}
                {results.length > 40 ? " · показаны первые 40" : ""}
                {reader.spoilerFree ? " · поиск ограничен прочитанным" : ""}
              </p>
              <div className="reader-search-results">
                {results.slice(0, 40).map((result) => (
                  <Link
                    key={result.id}
                    href={`/read/${result.id}?find=${encodeURIComponent(query.trim())}`}
                    onClick={() => setSearchOpen(false)}
                  >
                    <span>
                      {result.book === 13
                        ? "Эпилог"
                        : result.book === 0
                          ? "От автора"
                          : `Книга ${result.book}`}{" "}
                      · {result.title}
                    </span>
                    <p>
                      <Highlight
                        text={excerpt(result.text)}
                        query={query.trim()}
                      />
                    </p>
                    <ArrowRight size={17} />
                  </Link>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <div className="reader-body">
        {contentsOpen && (
          <aside
            className="reader-contents"
            id="reader-contents"
            aria-label="Оглавление романа"
          >
            <div className="reader-panel-heading">
              <h2>Содержание</h2>
              <button
                className="reader-tool"
                onClick={() => setContentsOpen(false)}
                aria-label="Закрыть оглавление"
              >
                <X size={18} />
              </button>
            </div>
            <p className="reader-muted">
              Четыре части · двенадцать книг · эпилог
            </p>
            {books.map((book) => {
              const group = chapters.filter((c) => c.book === book);
              return (
                <details key={book} open={book === current.book}>
                  <summary>
                    {book === 0
                      ? "От автора"
                      : book === 13
                        ? "Эпилог"
                        : `Книга ${book}`}
                    <span>
                      {book > 0 &&
                      book < 13 &&
                      (!reader.spoilerFree ||
                        group[0].order <= reader.maxOrder ||
                        book === current.book)
                        ? group[0].bookTitle
                        : ""}
                    </span>
                    <ChevronDown size={15} />
                  </summary>
                  <nav
                    aria-label={
                      book === 0
                        ? "От автора"
                        : book === 13
                          ? "Эпилог"
                          : `Книга ${book}`
                    }
                  >
                    {group.map((chapter) => (
                      <Link
                        key={chapter.id}
                        href={`/read/${chapter.id}`}
                        aria-current={
                          chapter.id === current.id ? "page" : undefined
                        }
                        onClick={() => {
                          setContentsOpen(false);
                          window.scrollTo({ top: 0 });
                        }}
                      >
                        <span>
                          {chapter.chapter > 0 &&
                          (!reader.spoilerFree ||
                            chapter.order <= reader.maxOrder ||
                            chapter.id === current.id)
                            ? `${chapter.chapter}. `
                            : ""}
                          {safeChapterTitle(chapter)}
                        </span>
                        {reader.bookmarks.some(
                          (b) => b.chapterId === chapter.id,
                        ) && <Bookmark size={12} />}
                      </Link>
                    ))}
                  </nav>
                </details>
              );
            })}
            <Link className="reader-cabinet-link" href="/cabinet">
              Мои закладки и заметки <ArrowRight size={15} />
            </Link>
          </aside>
        )}
        <div className="reader-main">
          <header className="reader-chapter-header">
            <Link href="/" className="reader-back">
              <ArrowLeft size={14} /> В музей
            </Link>
            <p className="reader-eyebrow">
              {current.part > 0 ? `Часть ${current.part} / ` : ""}
              {bookLabel(current)}
            </p>
            <h1>
              {current.chapter > 0 && (
                <span>
                  {current.chapter < 10
                    ? `0${current.chapter}`
                    : current.chapter}
                </span>
              )}
              {current.title}
            </h1>
            {current.book > 0 && (
              <Link
                className="reader-guide-link"
                href={`/chapters/${current.id}`}
              >
                Путеводитель по этой главе ↗
              </Link>
            )}
            <div className="reader-chapter-meta">
              <span>Фёдор Михайлович Достоевский</span>
              <span>
                {current.order + 1} / {chapters.length}
              </span>
            </div>
          </header>
          {!reader.hydrated || loading ? (
            <div className="reader-text-status" role="status">
              Открываем книгу…
            </div>
          ) : error ? (
            <div className="reader-text-status" role="alert">
              <h2>Не удалось открыть главу</h2>
              <p>
                Текст временно недоступен. Проверьте соединение и повторите
                загрузку.
              </p>
              <button onClick={() => window.location.reload()}>
                Повторить
              </button>
            </div>
          ) : (
            <article
              className="reader-prose"
              ref={articleRef}
              style={{
                fontSize: `${reader.fontSize}px`,
                lineHeight: reader.lineHeight,
              }}
              aria-label="Текст главы"
            >
              {paragraphs.map((p, i) => (
                <p
                  id={`p-${i}`}
                  key={`${current.id}-${i}`}
                  data-paragraph={i}
                  className={p.includes("\n") ? "has-line-breaks" : undefined}
                >
                  <Highlight text={p} query={findText} />
                </p>
              ))}
            </article>
          )}
          {!loading && !error && (
            <>
              <div className="reader-end-mark" aria-hidden="true">
                ✦
              </div>
              <nav
                className="reader-chapter-nav"
                aria-label="Переход между главами"
              >
                {previous ? (
                  <Link
                    href={`/read/${previous.id}`}
                    onClick={() => window.scrollTo({ top: 0 })}
                  >
                    <ArrowLeft size={20} />
                    <span>
                      <small>Предыдущая глава</small>
                      {safeChapterTitle(previous)}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
                {next ? (
                  <Link
                    href={`/read/${next.id}`}
                    onClick={() => {
                      updateReader({
                        maxOrder: Math.max(reader.maxOrder, current.order),
                      });
                      window.scrollTo({ top: 0 });
                    }}
                  >
                    <span>
                      <small>Следующая глава</small>
                      {safeChapterTitle(next)}
                    </span>
                    <ArrowRight size={20} />
                  </Link>
                ) : (
                  <Link
                    href="/cabinet"
                    onClick={() => updateReader({ maxOrder: current.order })}
                  >
                    <span>
                      <small>Роман прочитан</small>К моим заметкам
                    </span>
                    <ArrowRight size={20} />
                  </Link>
                )}
              </nav>
              <div className="reader-source">
                <span>
                  Полный текст без сокращений. Собрание сочинений в 15 томах,
                  «Наука», 1991, т. 9–10.
                </span>
                <a href={current.sourceUrl} target="_blank" rel="noreferrer">
                  Сверить с источником ↗
                </a>
                <Link href="/sources">Об издании и правах</Link>
              </div>
            </>
          )}
        </div>
        {noteOpen && (
          <aside className="reader-note" aria-label="Заметка к главе">
            <div className="reader-panel-heading">
              <h2>На полях</h2>
              <button
                className="reader-tool"
                onClick={() => setNoteOpen(false)}
                aria-label="Закрыть заметки"
              >
                <X size={18} />
              </button>
            </div>
            <p className="reader-muted">{current.title}</p>
            <form onSubmit={saveNote}>
              <label htmlFor="reader-note-input">
                Ваша мысль о прочитанном
              </label>
              <textarea
                id="reader-note-input"
                value={note}
                onChange={(e) => {
                  setNote(e.target.value);
                  setNoteSaved(false);
                }}
                placeholder="Что хочется запомнить или обдумать?"
                maxLength={12000}
              />
              <button
                type="submit"
                className="reader-save-note"
                disabled={!note.trim()}
              >
                Сохранить заметку <ArrowRight size={16} />
              </button>
            </form>
            {noteSaved && (
              <p className="reader-note-saved" role="status">
                <Check size={16} /> Сохранено на этом устройстве
              </p>
            )}
            <p className="reader-muted">
              Заметки хранятся в браузере, без регистрации. Их можно
              экспортировать в кабинете читателя.
            </p>
            <Link href="/cabinet">Открыть все заметки →</Link>
          </aside>
        )}
      </div>
      <div className="reader-bottom-status">
        <span>{progress}% романа прочитано</span>
        <Link href="/cabinet">
          Кабинет читателя <ArrowRight size={13} />
        </Link>
      </div>
    </div>
  );
}
