"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Search, X } from "lucide-react";
import chapters from "@/data/chapters.json";
import { hydrateReader, updateReader, useReader } from "@/lib/reader-store";
import "./search.css";
export type SearchIndexItem = {
  id: string;
  type: string;
  title: string;
  excerpt: string;
  url: string;
  chapterId?: string;
  revealAt?: string;
  keywords?: string[];
};
type TextChapter = {
  id: string;
  title: string;
  book: number;
  order: number;
  text: string;
};
const orderById = new Map(chapters.map((c) => [c.id, c.order]));
const labels: Record<string, string> = {
  character: "Персонажи",
  characters: "Персонажи",
  study: "Исследования",
  studies: "Исследования",
  article: "Статьи",
  event: "События",
  events: "События",
  image: "Изображения",
  images: "Изображения",
  book: "Книги романа",
  books: "Книги романа",
  chapter: "Путеводитель по главам",
  chapters: "Путеводитель по главам",
  route: "Литературные маршруты",
  routes: "Литературные маршруты",
  text: "Оригинальный текст",
};
const norm = (s: string) => s.toLocaleLowerCase("ru").replace(/ё/g, "е");
let editorialRequest: Promise<SearchIndexItem[]> | undefined;
function loadEditorialIndex() {
  if (!editorialRequest) {
    editorialRequest = fetch("/api/search-index")
      .then(async (response) => {
        if (!response.ok)
          throw Error("Расширенный индекс временно недоступен.");
        const data: unknown = await response.json();
        if (!Array.isArray(data))
          throw Error("Получен некорректный поисковый индекс.");
        return data as SearchIndexItem[];
      })
      .catch((error) => {
        editorialRequest = undefined;
        throw error;
      });
  }
  return editorialRequest;
}
let corpusRequest: Promise<TextChapter[]> | undefined;
function loadCorpus() {
  if (!corpusRequest)
    corpusRequest = fetch("/text/search.json")
      .then((r) => {
        if (!r.ok) throw Error("Не удалось загрузить поисковый корпус.");
        return r.json();
      })
      .catch((e) => {
        corpusRequest = undefined;
        throw e;
      });
  return corpusRequest;
}
function Highlight({ text, query }: { text: string; query: string }) {
  const at = norm(text).indexOf(norm(query));
  if (at < 0 || query.length < 2) return <>{text}</>;
  return (
    <>
      {text.slice(0, at)}
      <mark>{text.slice(at, at + query.length)}</mark>
      {text.slice(at + query.length)}
    </>
  );
}
export function SiteSearch({ items }: { items: SearchIndexItem[] }) {
  const reader = useReader();
  const [query, setQuery] = useState("");
  const [catalogItems, setCatalogItems] = useState(items);
  const [catalogLoaded, setCatalogLoaded] = useState(false);
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogError, setCatalogError] = useState("");
  const [filter, setFilter] = useState("all");
  const [includeText, setIncludeText] = useState(true);
  const [textResults, setTextResults] = useState<SearchIndexItem[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    void hydrateReader();
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setQuery(q);
  }, []);
  const term = query.trim();
  const normalized = norm(term);
  const searchStarted = term.length >= 2;
  useEffect(() => {
    if (!searchStarted || catalogLoaded) return;
    let active = true;
    setCatalogBusy(true);
    setCatalogError("");
    const timer = setTimeout(() => {
      loadEditorialIndex()
        .then((index) => {
          if (!active) return;
          setCatalogItems(index);
          setCatalogLoaded(true);
          setCatalogBusy(false);
        })
        .catch((error: unknown) => {
          if (!active) return;
          setCatalogBusy(false);
          setCatalogError(
            error instanceof Error
              ? error.message
              : "Не удалось загрузить полный индекс статей.",
          );
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchStarted, catalogLoaded]);
  const available = useMemo(
    () =>
      catalogItems.filter((item) => {
        const boundary = item.revealAt ?? item.chapterId;
        return (
          !reader.spoilerFree ||
          !boundary ||
          (orderById.get(boundary) ?? Infinity) <= reader.maxOrder
        );
      }),
    [catalogItems, reader.spoilerFree, reader.maxOrder],
  );
  const indexResults = useMemo(
    () =>
      term.length < 2
        ? []
        : available
            .filter((item) =>
              norm(
                [item.title, item.excerpt, ...(item.keywords ?? [])].join(" "),
              ).includes(normalized),
            )
            .map((item) => {
              if (norm(`${item.title} ${item.excerpt}`).includes(normalized))
                return item;
              const context = item.keywords?.find((keyword) =>
                norm(keyword).includes(normalized),
              );
              if (!context) return item;
              const at = norm(context).indexOf(normalized);
              const start = Math.max(0, at - 85);
              const end = Math.min(context.length, at + term.length + 170);
              return {
                ...item,
                excerpt: `${start > 0 ? "…" : ""}${context.slice(start, end)}${end < context.length ? "…" : ""}`,
              };
            })
            .sort((a, b) => {
              const rank = (item: SearchIndexItem) =>
                (norm(item.title).includes(normalized) ? 100 : 0) +
                (item.type === "character" ? 10 : 0) +
                (norm(item.excerpt).includes(normalized) ? 1 : 0);
              return rank(b) - rank(a);
            }),
    [available, term, normalized],
  );
  useEffect(() => {
    if (term.length < 2 || !includeText) {
      setTextResults([]);
      setBusy(false);
      return;
    }
    let active = true;
    setBusy(true);
    setTextResults([]);
    setError("");
    const timer = setTimeout(() => {
      loadCorpus()
        .then((corpus) => {
          if (!active) return;
          const results = corpus
            .filter(
              (c) =>
                (!reader.spoilerFree || c.order <= reader.maxOrder) &&
                norm(c.text).includes(normalized),
            )
            .map((c) => {
              const at = norm(c.text).indexOf(normalized);
              const start = Math.max(0, at - 90);
              return {
                id: `text-${c.id}`,
                type: "text",
                title: `${c.book === 0 ? "От автора" : c.book === 13 ? "Эпилог" : `Книга ${c.book}`} · ${c.title}`,
                excerpt: `${start > 0 ? "…" : ""}${c.text.slice(start, at + 200)}…`,
                url: `/read/${c.id}?find=${encodeURIComponent(term)}`,
                chapterId: c.id,
              };
            });
          setTextResults(results);
          setBusy(false);
        })
        .catch((e) => {
          if (active) {
            setError(
              e instanceof Error
                ? e.message
                : "Не удалось выполнить поиск по тексту.",
            );
            setBusy(false);
          }
        });
    }, 250);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term, normalized, includeText, reader.spoilerFree, reader.maxOrder]);
  const safeTextResults = textResults.filter(
    (item) =>
      !reader.spoilerFree ||
      (orderById.get(item.chapterId ?? "") ?? Infinity) <= reader.maxOrder,
  );
  const all = [...indexResults, ...safeTextResults];
  const typeOrder = [
    "character",
    "book",
    "chapter",
    "study",
    "article",
    "event",
    "image",
    "route",
    "text",
  ];
  const groups = Array.from(new Set(all.map((i) => i.type))).sort(
    (a, b) => typeOrder.indexOf(a) - typeOrder.indexOf(b),
  );
  const visible = filter === "all" ? all : all.filter((i) => i.type === filter);
  const displayGroups = groups.filter((type) =>
    visible.some((item) => item.type === type),
  );
  return (
    <div className="site-search">
      <form
        className="unified-search-form"
        onSubmit={(e) => e.preventDefault()}
        role="search"
      >
        <label htmlFor="museum-query">
          <Search size={25} />
          <span className="sr-only">Поиск по всему музею</span>
          <input
            id="museum-query"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            type="search"
            placeholder="Имя, мысль, эпизод или слово из романа"
            autoComplete="off"
          />
        </label>
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
            aria-label="Очистить поисковый запрос"
          >
            <X size={20} />
          </button>
        )}
      </form>
      <div className="search-options">
        <label>
          <input
            type="checkbox"
            checked={includeText}
            onChange={(e) => setIncludeText(e.target.checked)}
          />
          Искать также в полном тексте
        </label>
        <button
          type="button"
          disabled={!reader.hydrated}
          aria-pressed={reader.spoilerFree}
          onClick={() => updateReader({ spoilerFree: !reader.spoilerFree })}
        >
          {reader.spoilerFree
            ? "Без спойлеров: включено"
            : "Все материалы открыты"}
        </button>
      </div>
      <p className="search-note">
        Поиск объединяет роман и музейный каталог. «Е» и «ё» считаются одной
        буквой.{" "}
        {reader.spoilerFree
          ? "Будущие события, выдержки и подробные исследования скрыты до чтения."
          : "В результатах могут встречаться сведения о развязке."}
      </p>
      {term.length < 2 ? (
        <div className="search-start">
          <span className="eyebrow">ТОЧКИ ВХОДА</span>
          <h2>Что вы хотите понять?</h2>
          <p>
            Начните с двух букв. Можно искать имя героя, сюжетный предмет,
            философский вопрос или точную фразу.
          </p>
          <div>
            {["Иван", "свобода", "деньги", "суд", "дети"].map((q) => (
              <button type="button" onClick={() => setQuery(q)} key={q}>
                {q} ↗
              </button>
            ))}
          </div>
        </div>
      ) : (
        <>
          <nav className="search-type-tabs" aria-label="Тип результатов">
            <button
              type="button"
              className={filter === "all" ? "active" : ""}
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              Все материалы <span>{all.length}</span>
            </button>
            {groups.map((type) => (
              <button
                type="button"
                className={filter === type ? "active" : ""}
                aria-pressed={filter === type}
                onClick={() => setFilter(type)}
                key={type}
              >
                {labels[type] ?? type}{" "}
                <span>{all.filter((i) => i.type === type).length}</span>
              </button>
            ))}
          </nav>
          <div className="search-status" role="status">
            {catalogBusy
              ? "Ищем в материалах музея…"
              : busy
                ? "Проверяем полный текст…"
                : `Найдено материалов: ${all.length}`}
            {catalogError && (
              <p role="alert">
                {catalogError} Поиск по названиям и описаниям остаётся доступен.
                Очистите запрос и повторите поиск, чтобы загрузить индекс снова.
              </p>
            )}
            {error && (
              <p role="alert">
                {error} Поиск по музейному каталогу остаётся доступен.
              </p>
            )}
          </div>
          {displayGroups.map((type) => (
            <section className="search-group" key={type}>
              <header>
                <h2>{labels[type] ?? type}</h2>
                <span>{visible.filter((i) => i.type === type).length}</span>
              </header>
              <ol>
                {visible
                  .filter((i) => i.type === type)
                  .slice(0, 40)
                  .map((item) => (
                    <li key={item.id}>
                      <Link href={item.url}>
                        <div>
                          <h3>
                            <Highlight text={item.title} query={term} />
                          </h3>
                          <p>
                            <Highlight text={item.excerpt} query={term} />
                          </p>
                        </div>
                        <ArrowUpRight size={20} />
                      </Link>
                    </li>
                  ))}
              </ol>
              {visible.filter((i) => i.type === type).length > 40 && (
                <p className="search-note">
                  Показаны первые 40 результатов. Уточните запрос, чтобы сузить
                  выбор.
                </p>
              )}
            </section>
          ))}
          {!busy && !catalogBusy && !visible.length && (
            <div className="search-empty">
              <h2>Совпадений пока нет</h2>
              <p>
                Попробуйте более короткий запрос или другое слово. Защита от
                спойлеров может скрывать ещё не прочитанные эпизоды.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
