"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import type { Node, Edge } from "@xyflow/react";
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Check,
  Download,
  Eye,
  EyeOff,
  LockKeyhole,
  Network,
  Plus,
  Search,
  StickyNote,
  Trash2,
} from "lucide-react";
import "./explore.css";
import { characters, relationships, events } from "@/data/museum";
import chapterData from "@/data/chapters.json";
import quoteData from "@/data/quotes.json";
import {
  useReader,
  hydrateReader,
  updateReader,
  toggleBookmark,
  addNote,
  removeNote,
} from "@/lib/reader-store";
import type { Chapter, Quote } from "@/lib/types";

const MapCanvas = dynamic(() => import("./map-canvas"), {
  ssr: false,
  loading: () => (
    <div className="map-loading" role="status">
      Загрузка карты связей…
    </div>
  ),
});

const chapters = chapterData as Chapter[];
const quotes = quoteData as Quote[];
const chapterById = new Map(chapters.map((chapter) => [chapter.id, chapter]));
const labels: Record<string, string> = {
  family: "Родство",
  conflict: "Конфликт",
  spiritual: "Духовная связь",
};
const colors: Record<string, string> = {
  family: "#ab9160",
  conflict: "#9b4c4b",
  spiritual: "#72958c",
};
const isVisible = (id: string, order: number, spoilerFree: boolean) =>
  !spoilerFree || (chapterById.get(id)?.order ?? Infinity) <= order;
const chapterLabel = (id: string) => {
  const chapter = chapterById.get(id);
  return chapter
    ? chapter.book === 0
      ? "От автора"
      : `${chapter.book === 13 ? "Эпилог" : `Книга ${chapter.book}`} · ${chapter.title}`
    : id;
};

function useLocalReader() {
  const reader = useReader();
  useEffect(() => {
    void hydrateReader();
  }, []);
  return reader;
}

function SpoilerControl() {
  const reader = useLocalReader();
  return (
    <div className="spoiler-control">
      <div>
        <span className="explore-kicker">ВАШ МАРШРУТ ЧТЕНИЯ</span>
        <p>
          {reader.spoilerFree
            ? "Будущие события скрыты до прочтения соответствующих глав."
            : "Открыты все события романа, включая развязку."}
        </p>
      </div>
      <button
        type="button"
        className={`explore-button ${reader.spoilerFree ? "is-active" : ""}`}
        onClick={() => updateReader({ spoilerFree: !reader.spoilerFree })}
        disabled={!reader.hydrated} aria-pressed={reader.spoilerFree}
      >
        {reader.spoilerFree ? <EyeOff size={16} /> : <Eye size={16} />}{" "}
        {reader.spoilerFree ? "Без спойлеров" : "Все события"}
      </button>
    </div>
  );
}

const positions: Record<string, { x: number; y: number }> = {
  fyodor: { x: 420, y: 35 },
  dmitri: { x: 80, y: 220 },
  ivan: { x: 420, y: 220 },
  alexei: { x: 760, y: 220 },
  smerdyakov: { x: 420, y: 430 },
  grushenka: { x: 50, y: 430 },
  katerina: { x: 80, y: 35 },
  zosima: { x: 760, y: 35 },
  ilyusha: { x: 940, y: 430 },
  snegiryov: { x: 760, y: 610 },
  rakitin: { x: 420, y: 610 },
  liza: { x: 1080, y: 220 },
};

export function CharacterMap() {
  const reader = useLocalReader();
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState("alexei");
  const visibleRelationships = useMemo(
    () =>
      relationships.filter(
        (r) =>
          (filter === "all" || r.type === filter) &&
          isVisible(r.chapterId, reader.maxOrder, reader.spoilerFree),
      ),
    [filter, reader.maxOrder, reader.spoilerFree],
  );
  const nodes = useMemo<Node[]>(
    () =>
      characters.map((character, index) => ({
        id: character.id,
        position: positions[character.id] ?? { x: index * 180, y: 100 },
        data: {
          label: (
            <div className="person-node">
              <span>{character.shortName}</span>
              <small>{character.epithet}</small>
            </div>
          ),
        },
        className: character.id === selected ? "selected-person" : "",
        style: { width: 185 },
        ariaLabel: character.name,
      })),
    [selected],
  );
  const edges = useMemo<Edge[]>(
    () =>
      visibleRelationships.map((relation, index) => ({
        id: `${relation.source}-${relation.target}-${index}`,
        source: relation.source,
        target: relation.target,
        label: relation.label,
        style: { stroke: colors[relation.type], strokeWidth: 1.4 },
        labelStyle: { fill: "#b9ad95", fontSize: 10 },
        labelBgStyle: { fill: "#1b1b18", fillOpacity: 0.94 },
        type: "default",
      })),
    [visibleRelationships],
  );
  const person =
    characters.find((character) => character.id === selected) ?? characters[0];
  return (
    <div className="explore-content">
      <SpoilerControl />
      <div className="explore-toolbar">
        <div className="filter-tabs" aria-label="Тип отношений">
          {["all", "family", "conflict", "spiritual"].map((type) => (
            <button
              type="button"
              key={type}
              className={filter === type ? "active" : ""}
              aria-pressed={filter === type}
              onClick={() => setFilter(type)}
            >
              {type === "all" ? "Все связи" : labels[type]}
            </button>
          ))}
        </div>
        <label className="map-select-label" htmlFor="map-hero">
          Выбрать героя
          <select
            id="map-hero"
            aria-label="Выбрать героя"
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
          >
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.shortName}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="map-visible-count">
        {visibleRelationships.length} связей · 12 героев
      </p>
      <div className="map-layout">
        <div
          className="relationship-map"
          role="region"
          aria-label="Интерактивная карта персонажей"
        >
          <MapCanvas
            nodes={nodes}
            edges={edges}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
        <aside className="map-person">
          <span className="explore-kicker">ВЫБРАННЫЙ ПЕРСОНАЖ</span>
          <div className="map-initial">{person.shortName.charAt(0)}</div>
          <h2>{person.name}</h2>
          <span className="person-epithet">{person.epithet}</span>
          <p>{person.intro}</p>
          <Link className="text-link" href={`/characters/${person.id}`}>
            Открыть портрет <ArrowUpRight size={17} />
          </Link>
          <div className="map-help">
            <Network size={18} />
            <span>
              Выберите героя на карте. Масштаб меняется кнопками +/− или двумя
              пальцами.
            </span>
          </div>
        </aside>
      </div>
      {reader.spoilerFree && visibleRelationships.length === 0 && (
        <p className="explore-empty">
          Первые связи откроются по мере чтения. Чтобы исследовать полную карту
          сейчас, переключитесь на «Все события».
        </p>
      )}
      <details className="accessible-connections">
        <summary>
          Текстовый список отношений · {visibleRelationships.length}
        </summary>
        <ul>
          {visibleRelationships.map((relation, index) => (
            <li key={index}>
              <strong>
                {characters.find((c) => c.id === relation.source)?.shortName} —{" "}
                {characters.find((c) => c.id === relation.target)?.shortName}
              </strong>
              <span>
                {relation.label} · {labels[relation.type]}
              </span>
              <Link href={`/read/${relation.chapterId}`}>
                К главе <ArrowUpRight size={13} />
              </Link>
            </li>
          ))}
        </ul>
      </details>
    </div>
  );
}

export function Timeline() {
  const reader = useLocalReader();
  const [selectedPeriod, setSelectedPeriod] = useState("all");
  const periods = Array.from(new Set(events.map((event) => event.period)));
  const selectedEvents = events.filter(
    (event) => selectedPeriod === "all" || event.period === selectedPeriod,
  );
  const visibleCount = events.filter((event) =>
    isVisible(event.chapterId, reader.maxOrder, reader.spoilerFree),
  ).length;
  return (
    <div className="explore-content">
      <SpoilerControl />
      <div className="timeline-intro">
        <p>
          Здесь события расположены по ходу повествования. Даты внутри действия
          намеренно не уточняются там, где роман не даёт точной календарной
          привязки.
        </p>
        <span>
          {visibleCount} из {events.length} событий открыто
        </span>
      </div>
      <div className="filter-tabs timeline-filters">
        <button
          type="button"
          className={selectedPeriod === "all" ? "active" : ""}
          aria-pressed={selectedPeriod === "all"}
          onClick={() => setSelectedPeriod("all")}
        >
          Весь роман
        </button>
        {periods.map((period) => (
          <button
            key={period}
            type="button"
            className={selectedPeriod === period ? "active" : ""}
            aria-pressed={selectedPeriod === period}
            onClick={() => setSelectedPeriod(period)}
          >
            {period}
          </button>
        ))}
      </div>
      <ol className="novel-timeline">
        {selectedEvents.map((event, index) => {
          const visible = isVisible(
            event.chapterId,
            reader.maxOrder,
            reader.spoilerFree,
          );
          return (
            <li key={event.id} className={visible ? "" : "event-locked"}>
              <div className="timeline-number">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="timeline-body">
                <span className="explore-kicker">{event.period}</span>
                <h2>
                  {visible ? (
                    event.title
                  ) : (
                    <>
                      <LockKeyhole size={19} /> Событие ещё не открыто
                    </>
                  )}
                </h2>
                {visible ? (
                  <>
                    <p>{event.text}</p>
                    <Link
                      className="text-link"
                      href={`/read/${event.chapterId}`}
                    >
                      {chapterLabel(event.chapterId)} <ArrowUpRight size={15} />
                    </Link>
                  </>
                ) : (
                  <p>Продолжите чтение, чтобы увидеть этот эпизод.</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function QuoteAtlas() {
  const reader = useLocalReader();
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState("all");
  const themes = Array.from(new Set(quotes.map((quote) => quote.theme)));
  const available = quotes.filter((quote) =>
    isVisible(quote.chapterId, reader.maxOrder, reader.spoilerFree),
  );
  const filtered = available.filter(
    (quote) =>
      (theme === "all" || quote.theme === theme) &&
      `${quote.text} ${quote.speaker} ${quote.context}`
        .toLocaleLowerCase("ru")
        .includes(query.trim().toLocaleLowerCase("ru")),
  );
  return (
    <div className="explore-content">
      <SpoilerControl />
      <div className="quote-search">
        <Search size={20} />
        <input
          aria-label="Поиск по цитатам"
          placeholder="Слово, мысль или имя героя…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <span>{filtered.length} фрагментов</span>
      </div>
      <div className="filter-tabs quote-filters">
        <button
          type="button"
          className={theme === "all" ? "active" : ""}
          aria-pressed={theme === "all"}
          onClick={() => setTheme("all")}
        >
          Все темы
        </button>
        {themes.map((item) => (
          <button
            key={item}
            type="button"
            className={theme === item ? "active" : ""}
            aria-pressed={theme === item}
            onClick={() => setTheme(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="quote-grid">
        {filtered.map((quote) => (
          <article className="atlas-quote" key={quote.id}>
            <span className="explore-kicker">{quote.theme}</span>
            <blockquote>«{quote.text}»</blockquote>
            <div className="quote-speaker">{quote.speaker}</div>
            <p>{quote.context}</p>
            <Link href={`/read/${quote.chapterId}`} className="text-link">
              {chapterLabel(quote.chapterId)} <ArrowUpRight size={15} />
            </Link>
            <button
              type="button"
              className="quote-save"
              onClick={() =>
                toggleBookmark(
                  quote.chapterId,
                  chapterById.get(quote.chapterId)?.title ?? quote.chapterId,
                )
              }
              aria-label={
                reader.bookmarks.some(
                  (bookmark) => bookmark.chapterId === quote.chapterId,
                )
                  ? "Удалить закладку главы"
                  : "Добавить закладку главы"
              }
            >
              {reader.bookmarks.some(
                (bookmark) => bookmark.chapterId === quote.chapterId,
              ) ? (
                <Check size={17} />
              ) : (
                <Bookmark size={17} />
              )}
            </button>
          </article>
        ))}
      </div>
      {filtered.length === 0 && (
        <div className="explore-empty">
          <BookOpen size={30} />
          <h2>
            {available.length === 0
              ? "Цитаты откроются во время чтения"
              : "Фрагменты не найдены"}
          </h2>
          <p>
            {available.length === 0
              ? "Начните роман или отключите защиту от спойлеров, чтобы открыть весь атлас."
              : "Попробуйте другое слово или выберите все темы."}
          </p>
          <Link href="/read" className="text-link">
            Перейти к чтению <ArrowUpRight size={15} />
          </Link>
        </div>
      )}
      <p className="source-note">
        Каждый фрагмент сверен с текстом романа. Короткие цитаты приведены без
        пересказа; ссылка ведёт к главе и её контексту.{" "}
        <Link href="/sources">Об источнике текста</Link>
      </p>
    </div>
  );
}

export function Cabinet() {
  const reader = useLocalReader();
  const [note, setNote] = useState("");
  const [chapterId, setChapterId] = useState(reader.chapterId);
  const [message, setMessage] = useState("");
  const current = chapterById.get(reader.chapterId) ?? chapters[0];
  const progress = Math.round((reader.maxOrder / (chapters.length - 1)) * 100);
  useEffect(() => {
    if (reader.hydrated) setChapterId(reader.chapterId);
  }, [reader.hydrated, reader.chapterId]);
  function exportNotebook() {
    const payload = {
      version: 1,
      exportedAt: new Date().toISOString(),
      progress: {
        chapterId: reader.chapterId,
        maxOrder: reader.maxOrder,
        paragraph: reader.paragraph,
      },
      bookmarks: reader.bookmarks,
      notes: reader.notes,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(payload, null, 2)], {
        type: "application/json",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "karamazov-notebook.json";
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage("Читательская тетрадь сохранена в JSON.");
  }
  function submitNote(event: React.FormEvent) {
    event.preventDefault();
    if (!note.trim()) return;
    addNote(chapterId, note);
    setNote("");
    setMessage("Заметка сохранена.");
  }
  return (
    <div className="explore-content">
      <div className="notebook-intro">
        <div>
          <span className="explore-kicker">ЛИЧНАЯ ЧИТАТЕЛЬСКАЯ ТЕТРАДЬ</span>
          <p>
            Ваши заметки, закладки и маршрут сохраняются в этом браузере через
            IndexedDB. Регистрация не нужна. Очистка данных браузера удалит
            тетрадь — сохраните копию, если она вам важна.
          </p>
        </div>
        <button
          type="button"
          className="explore-button"
          disabled={!reader.hydrated} onClick={exportNotebook}
        >
          <Download size={16} /> Скачать тетрадь
        </button>
      </div>
      {reader.storageError && (
        <p className="storage-warning" role="alert">
          Браузер запретил локальное хранилище. Изменения доступны в этой
          сессии; скачайте тетрадь, чтобы их сохранить.
        </p>
      )}
      <div className="reading-progress">
        <div className="progress-heading">
          <div>
            <span className="explore-kicker">ПРОДОЛЖИТЬ ЧТЕНИЕ</span>
            <h2>{current.title}</h2>
            <p>{current.bookTitle}</p>
          </div>
          <span className="progress-value">
            {progress}
            <small>%</small>
          </span>
        </div>
        <div className="progress-track">
          <div style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-footer">
          <span>
            Пройдено глав: {reader.maxOrder} из {chapters.length - 1}
          </span>
          <Link
            href={`/read/${reader.chapterId}`}
            className="explore-button filled"
          >
            Открыть книгу <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
      <SpoilerControl />
      <div className="notebook-columns">
        <section>
          <div className="notebook-heading">
            <Bookmark size={20} />
            <h2>Закладки</h2>
            <span>{reader.bookmarks.length}</span>
          </div>
          {reader.bookmarks.length === 0 ? (
            <p className="notebook-empty">
              Отмечайте главы кнопкой закладки в читалке. Здесь появится ваш
              личный маршрут.
            </p>
          ) : (
            <ul className="bookmark-list">
              {reader.bookmarks.map((bookmark) => (
                <li key={bookmark.chapterId}>
                  <Link href={`/read/${bookmark.chapterId}`}>
                    <span>
                      {chapterById.get(bookmark.chapterId)?.bookTitle}
                    </span>
                    <strong>{bookmark.title}</strong>
                  </Link>
                  <button
                    type="button"
                    className="icon-action"
                    onClick={() =>
                      toggleBookmark(bookmark.chapterId, bookmark.title)
                    }
                    aria-label={`Удалить закладку: ${bookmark.title}`}
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
        <section>
          <div className="notebook-heading">
            <StickyNote size={20} />
            <h2>Заметки на полях</h2>
            <span>{reader.notes.length}</span>
          </div>
          <form className="note-form" onSubmit={submitNote}>
            <label htmlFor="note-chapter">К какой главе?</label>
            <select
              id="note-chapter"
              value={chapterId}
              onChange={(event) => setChapterId(event.target.value)}
            >
              {chapters
                .filter(
                  (chapter) =>
                    !reader.spoilerFree ||
                    chapter.order <= reader.maxOrder ||
                    chapter.id === reader.chapterId,
                )
                .map((chapter) => (
                  <option value={chapter.id} key={chapter.id}>
                    {chapterLabel(chapter.id)}
                  </option>
                ))}
            </select>
            <label htmlFor="notebook-note">Ваша мысль</label>
            <textarea
              id="notebook-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="О чём заставила задуматься эта глава?"
              rows={4}
              maxLength={10000}
            />
            <button
              type="submit"
              className="explore-button filled"
              disabled={!reader.hydrated || !note.trim()}
            >
              <Plus size={16} /> Сохранить заметку
            </button>
          </form>
          <div className="saved-notes">
            {[...reader.notes].reverse().map((item) => (
              <article key={item.id}>
                <div>
                  <Link href={`/read/${item.chapterId}`}>
                    {chapterLabel(item.chapterId)}
                  </Link>
                  <button
                    type="button"
                    className="icon-action"
                    onClick={() => removeNote(item.id)}
                    aria-label="Удалить заметку"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
                <p>{item.text}</p>
                <time dateTime={new Date(item.createdAt).toISOString()}>
                  {new Date(item.createdAt).toLocaleDateString("ru-RU", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </time>
              </article>
            ))}
          </div>
        </section>
      </div>
      <p className="notebook-feedback" role="status">
        {message}
      </p>
    </div>
  );
}
