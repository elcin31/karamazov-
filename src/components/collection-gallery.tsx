"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Expand,
  Search,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import imageData from "@/data/images.json";
import chapters from "@/data/chapters.json";
import { characters } from "@/data/museum";
import { hydrateReader, useReader, updateReader } from "@/lib/reader-store";
import "./collection-gallery.css";
export type CollectionImage = {
  id: string;
  src: string;
  title: string;
  author: string;
  date: string;
  sourceUrl: string;
  license: string;
  licenseUrl: string;
  description: string;
  section: string;
  kind: string;
  era?: "historical" | "contemporary" | "generated";
  width: number;
  height: number;
  characterIds?: string[];
  chapterIds?: string[];
  tags?: string[];
};
const images = imageData as CollectionImage[];
const chapterMap = new Map(chapters.map((c) => [c.id, c]));
const eraOf = (im: CollectionImage) =>
  im.era ??
  (im.kind === "generated"
    ? "generated"
    : im.id === "snegirev-scene"
      ? "contemporary"
      : "historical");
const normalize = (s: string) => s.toLocaleLowerCase("ru").replace(/ё/g, "е");
export default function CollectionGallery() {
  const reader = useReader();
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState("all");
  const [author, setAuthor] = useState("all");
  const [hero, setHero] = useState("all");
  const [book, setBook] = useState("all");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  useEffect(() => {
    void hydrateReader();
  }, []);
  const authors = useMemo(
    () =>
      [...new Set(images.map((im) => im.author))].sort((a, b) =>
        a.localeCompare(b, "ru"),
      ),
    [],
  );
  const available = useMemo(
    () =>
      images.filter((im) => {
        if (!reader.spoilerFree || !im.chapterIds?.length) return true;
        return (
          Math.min(
            ...im.chapterIds.map((id) => chapterMap.get(id)?.order ?? Infinity),
          ) <= reader.maxOrder
        );
      }),
    [reader.spoilerFree, reader.maxOrder],
  );
  const filtered = useMemo(
    () =>
      available.filter(
        (im) =>
          (kind === "all" || eraOf(im) === kind) &&
          (author === "all" || im.author === author) &&
          (hero === "all" || im.characterIds?.includes(hero)) &&
          (book === "all" ||
            im.chapterIds?.some(
              (id) => String(chapterMap.get(id)?.book) === book,
            )) &&
          normalize(
            [im.title, im.author, im.description, ...(im.tags ?? [])].join(" "),
          ).includes(normalize(query.trim())),
      ),
    [available, kind, author, hero, book, query],
  );
  const active = filtered.find((im) => im.id === activeId);
  const activeIndex = filtered.findIndex((im) => im.id === activeId);
  const move = (direction: number) => {
    if (!filtered.length) return;
    setActiveId(
      filtered[(activeIndex + direction + filtered.length) % filtered.length]
        .id,
    );
    setZoom(false);
  };
  useEffect(() => {
    if (!activeId) return;
    const last = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActiveId(null);
        setZoom(false);
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        move(1);
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(-1);
      }
      if (e.key === "Tab") {
        const focusable = Array.from(
          dialogRef.current?.querySelectorAll<HTMLElement>("button,a[href]") ??
            [],
        );
        const first = focusable[0],
          lastEl = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          lastEl?.focus();
        } else if (!e.shiftKey && document.activeElement === lastEl) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      window.removeEventListener("keydown", key);
      (triggerRef.current ?? last)?.focus();
    };
    // The dialog follows the filtered sequence; rebuilding the keyboard listener keeps arrow navigation current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, filtered]);
  function reset() {
    setQuery("");
    setKind("all");
    setAuthor("all");
    setHero("all");
    setBook("all");
  }
  return (
    <div className="collection-gallery">
      <div className="gallery-introduction">
        <p>
          Рассматривайте произведения без кадрирования. Открытая карточка
          сохраняет подпись, происхождение и условия использования рядом с
          изображением.
        </p>
        <button
          type="button"
          className="gallery-spoilers"
          disabled={!reader.hydrated}
          aria-pressed={reader.spoilerFree}
          onClick={() => updateReader({ spoilerFree: !reader.spoilerFree })}
        >
          {reader.spoilerFree
            ? "Будущие эпизоды скрыты"
            : "Показаны все эпизоды"}
        </button>
      </div>
      <div className="collection-controls">
        <label className="collection-query">
          <Search size={18} />
          <span className="sr-only">Поиск в коллекции</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Название, автор или сюжет"
          />
        </label>
        <label>
          Тип материала
          <select
            aria-label="Тип изображения"
            value={kind}
            onChange={(e) => setKind(e.target.value)}
          >
            <option value="all">Все материалы</option>
            <option value="historical">Исторические материалы</option>
            <option value="contemporary">
              Современные произведения и фотографии
            </option>
            <option value="generated">Современные реконструкции</option>
          </select>
        </label>
        <label>
          Автор
          <select
            aria-label="Автор изображения"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
          >
            <option value="all">Все авторы</option>
            {authors.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <label>
          Персонаж
          <select
            aria-label="Персонаж изображения"
            value={hero}
            onChange={(e) => setHero(e.target.value)}
          >
            <option value="all">Все персонажи</option>
            {characters.map((c) => (
              <option value={c.id} key={c.id}>
                {c.shortName}
              </option>
            ))}
          </select>
        </label>
        <label>
          Книга
          <select
            aria-label="Книга изображения"
            value={book}
            onChange={(e) => setBook(e.target.value)}
          >
            <option value="all">Все книги</option>
            {Array.from({ length: 13 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n === 13 ? "Эпилог" : `Книга ${n}`}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="collection-results">
        <span aria-live="polite">
          {filtered.length} из {images.length} материалов
          {available.length < images.length
            ? ` · ${images.length - available.length} скрыто до чтения`
            : ""}
        </span>
        <button type="button" onClick={reset}>
          Сбросить фильтры
        </button>
      </div>
      {filtered.length ? (
        <div className="collection-grid">
          {filtered.map((im, i) => (
            <figure
              key={im.id}
              className={
                i % 7 === 0
                  ? "collection-work collection-work-wide"
                  : "collection-work"
              }
            >
              <button
                type="button"
                onClick={(e) => {
                  triggerRef.current = e.currentTarget;
                  setActiveId(im.id);
                  setZoom(false);
                }}
                aria-label={`Рассмотреть: ${im.title}`}
                className="collection-open"
              >
                <Image
                  src={im.src}
                  alt={im.title}
                  width={im.width}
                  height={im.height}
                  sizes="(max-width:600px) 90vw, (max-width:1000px) 45vw, 32vw"
                />
                <span>
                  <Expand size={16} /> Рассмотреть
                </span>
              </button>
              <figcaption>
                <span className="collection-kind">
                  {im.kind === "generated"
                    ? "Художественная реконструкция"
                    : eraOf(im) === "contemporary"
                      ? "Современный материал / произведение"
                      : "Исторический материал / произведение"}
                </span>
                <h2>{im.title}</h2>
                <p>
                  {im.author} · {im.date}
                </p>
                <a href={im.licenseUrl} target="_blank" rel="noreferrer">
                  {im.license} ↗
                </a>
              </figcaption>
            </figure>
          ))}
        </div>
      ) : (
        <div className="collection-empty">
          <h2>В этой подборке пока нет материалов</h2>
          <p>
            Выберите другого автора, героя или книгу. В режиме без спойлеров
            часть эпизодов скрыта до чтения.
          </p>
          <button type="button" onClick={reset}>
            Показать доступную коллекцию
          </button>
        </div>
      )}
      {active && (
        <div
          className="collection-lightbox"
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="collection-active-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setActiveId(null);
              setZoom(false);
            }
          }}
        >
          <div className="lightbox-toolbar">
            <span>
              {activeIndex + 1} / {filtered.length}
            </span>
            <div>
              <button
                type="button"
                onClick={() => setZoom(!zoom)}
                aria-label={
                  zoom ? "Уменьшить изображение" : "Увеличить изображение"
                }
              >
                {zoom ? <ZoomOut size={21} /> : <ZoomIn size={21} />}
              </button>
              <button
                type="button"
                onClick={() => move(-1)}
                aria-label="Предыдущее изображение"
              >
                <ArrowLeft size={21} />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                aria-label="Следующее изображение"
              >
                <ArrowRight size={21} />
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveId(null);
                  setZoom(false);
                }}
                aria-label="Закрыть просмотр"
              >
                <X size={23} />
              </button>
            </div>
          </div>
          <div className="lightbox-body">
            <div className={`lightbox-art ${zoom ? "is-zoomed" : ""}`}>
              <img
                src={active.src}
                alt={active.title}
                width={active.width}
                height={active.height}
              />
            </div>
            <aside className="lightbox-caption">
              <span className="collection-kind">
                {active.kind === "generated"
                  ? "Современная цифровая иллюстрация"
                  : "Музейная карточка"}
              </span>
              <h2 id="collection-active-title">{active.title}</h2>
              <p className="lightbox-author">
                {active.author}
                <br />
                {active.date}
              </p>
              <p>{active.description}</p>
              <dl>
                <dt>Размер веб-копии</dt>
                <dd>
                  {active.width} × {active.height}
                </dd>
                <dt>Условия использования</dt>
                <dd>
                  <a href={active.licenseUrl} target="_blank" rel="noreferrer">
                    {active.license} ↗
                  </a>
                </dd>
              </dl>
              {active.sourceUrl && (
                <a href={active.sourceUrl} target="_blank" rel="noreferrer">
                  Открыть первоисточник ↗
                </a>
              )}
              {active.chapterIds?.length ? (
                <div className="lightbox-chapters">
                  <h3>В романе</h3>
                  {active.chapterIds.map((id) => {
                    const c = chapterMap.get(id);
                    return c ? (
                      <Link href={`/read/${id}`} key={id}>
                        {c.book === 13 ? "Эпилог" : `Книга ${c.book}`} ·{" "}
                        {c.title} ↗
                      </Link>
                    ) : null;
                  })}
                </div>
              ) : null}
              <p className="lightbox-note">
                Стрелки ← → переключают материалы. Escape закрывает просмотр.
              </p>
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}
