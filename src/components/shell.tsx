"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Menu, X, Search, Bookmark, ArrowUpRight } from "lucide-react";
import { hydrateReader, useReader, updateReader } from "@/lib/reader-store";
const mainLinks = [
  ["/guide", "Роман"],
  ["/characters", "Персонажи"],
  ["/philosophy", "Исследования"],
  ["/context", "Достоевский"],
  ["/gallery", "Коллекция"],
];
const extraLinks = [
  ["/map", "Карта связей"],
  ["/timeline", "Атлас событий"],
  ["/court", "Суд"],
  ["/routes", "Маршруты"],
  ["/quotes", "Цитаты"],
  ["/sources", "Источники"],
];
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const s = useReader();
  useEffect(() => {
    void hydrateReader();
  }, []);
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <a className="skip-link" href="#main">
        К содержанию
      </a>
      <header className="site-header">
        <div className="masthead">
          <Link href="/" className="wordmark" prefetch={false}>
            КАРАМАЗОВ<span>ЛИТЕРАТУРНЫЙ МУЗЕЙ</span>
          </Link>
          <p className="masthead-note">
            Фёдор Достоевский
            <br />
            Один роман — множество прочтений
          </p>
          <div className="header-tools">
            <Link
              href="/search"
              aria-label="Поиск по музею"
              className="header-search"
              prefetch={false}
            >
              <Search size={18} />
              <span>Поиск</span>
            </Link>
            <Link
              href="/cabinet"
              aria-label="Читательский архив"
              className="cabinet-link"
              prefetch={false}
            >
              <Bookmark size={17} />
              <span>Читательский архив</span>
            </Link>
            <button
              className="icon-button menu-toggle"
              onClick={() => setOpen(!open)}
              aria-label={open ? "Закрыть меню" : "Открыть меню"}
              aria-expanded={open}
            >
              {open ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        <div className="navigation-line">
          <nav className="desktop-nav" aria-label="Основная навигация">
            {mainLinks.map(([href, label]) => (
              <Link
                href={href}
                prefetch={false}
                className={path.startsWith(href) ? "active" : ""}
                key={href}
              >
                {label}
              </Link>
            ))}
            <Link href="/read" className="read-nav" prefetch={false}>
              Читать роман <ArrowUpRight size={14} />
            </Link>
          </nav>
          <button
            className="spoiler-switch"
            onClick={() => updateReader({ spoilerFree: !s.spoilerFree })}
            aria-pressed={s.spoilerFree}
            disabled={!s.hydrated}
          >
            <span className={s.spoilerFree ? "switch-dot on" : "switch-dot"} />
            <span>Без спойлеров</span>
            <b>{s.spoilerFree ? "Вкл" : "Выкл"}</b>
          </button>
        </div>
      </header>
      {open && (
        <nav className="mobile-nav" aria-label="Мобильная навигация">
          {[
            ...mainLinks,
            ["/read", "Читать роман"],
            ...extraLinks,
            ["/cabinet", "Читательский архив"],
            ["/search", "Поиск"],
          ].map(([href, label]) => (
            <Link href={href} key={href} prefetch={false}>
              {label}
              <ArrowUpRight size={15} />
            </Link>
          ))}
        </nav>
      )}
      {s.storageError && (
        <p className="storage-warning" role="status">
          Хранилище браузера недоступно. Скачайте резервную копию записей в
          читательском архиве до закрытия страницы.
        </p>
      )}
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <Link href="/" className="footer-brand" prefetch={false}>
          КАРАМАЗОВ<span>A LITERARY MUSEUM</span>
        </Link>
        <p>
          Читать внимательно.
          <br />
          Сопоставлять. Сомневаться.
        </p>
        <nav className="footer-links" aria-label="Разделы музея">
          {extraLinks.map(([href, title]) => (
            <Link href={href} prefetch={false} key={href}>
              {title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="footer-bottom">
        <span>Независимое образовательное издание · Выпуск 2.0</span>
        <span>
          Текст: Ф. М. Достоевский, 1879–1880 · Изображения имеют собственные
          лицензии
        </span>
      </div>
    </footer>
  );
}
