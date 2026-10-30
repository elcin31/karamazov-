"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  Search,
  BookOpen,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { hydrateReader, useReader, updateReader } from "@/lib/reader-store";
const links = [
  ["/read", "Читать роман"],
  ["/characters", "Персонажи"],
  ["/philosophy", "Философия"],
  ["/context", "Контекст"],
  ["/gallery", "Галерея"],
];
export function Header() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const s = useReader();
  useEffect(() => {
    hydrateReader();
  }, []);
  useEffect(() => setOpen(false), [path]);
  return (
    <>
      <a className="skip-link" href="#main">
        К содержанию
      </a>
      <header className="site-header">
        <Link prefetch={false} href="/" className="wordmark" aria-label="Карамазов — главная">
          К<span className="wordmark-rule" />
          КАРАМАЗОВ
          <span className="brand-sub">ЦИФРОВОЙ ЛИТЕРАТУРНЫЙ МУЗЕЙ</span>
        </Link>
        <nav className="desktop-nav" aria-label="Основная навигация">
          {links.map(([href, label]) => (
            <Link prefetch={false}
              className={path.startsWith(href) ? "active" : ""}
              key={href}
              href={href}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="header-tools">
          <Link prefetch={false}
            className="icon-button search-button"
            href="/read?search=1"
            aria-label="Поиск по роману"
          >
            <Search size={19} />
          </Link>
          <Link prefetch={false} className="cabinet-link" href="/cabinet">
            <BookOpen size={16} /> Мой кабинет
          </Link>
          <button
            className="icon-button menu-toggle"
            onClick={() => setOpen(!open)}
            aria-label={open ? "Закрыть меню" : "Открыть меню"}
            aria-expanded={open}
          >
            {open ? <X /> : <Menu />}
          </button>
        </div>
      </header>
      {open && (
        <nav className="mobile-nav" aria-label="Мобильная навигация">
          {[
            ...links,
            ["/map", "Карта связей"],
            ["/timeline", "Хронология"],
            ["/quotes", "Атлас цитат"],
            ["/cabinet", "Мой кабинет"],
            ["/sources", "Источники"],
          ].map(([href, label]) => (
            <Link prefetch={false} key={href} href={href}>
              {label}
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </nav>
      )}
      <div className="museum-strip">
        <span>
          Ф. М. ДОСТОЕВСКИЙ <i /> ПОСЛЕДНИЙ РОМАН · 1879–1880
        </span>
        <button
          className={
            s.spoilerFree ? "spoiler-switch enabled" : "spoiler-switch"
          }
          disabled={!s.hydrated}
          onClick={() => updateReader({ spoilerFree: !s.spoilerFree })}
          aria-pressed={s.spoilerFree}
        >
          <ShieldCheck size={13} />
          <span>Без спойлеров</span>
          <b>{s.spoilerFree ? "ВКЛ" : "ВЫКЛ"}</b>
        </button>
      </div>
      {s.storageError && (
        <div role="status" className="storage-warning">
          Хранилище браузера недоступно. Заметки и прогресс сохранятся только до
          закрытия страницы.
        </div>
      )}
    </>
  );
}
export function Footer() {
  return (
    <footer className="site-footer">
      <div>
        <Link prefetch={false} href="/" className="footer-brand">
          КАРАМАЗОВ<span>Цифровой литературный музей</span>
        </Link>
        <p>Роман, который продолжается в каждом из нас.</p>
      </div>
      <div className="footer-links">
        <Link prefetch={false} href="/map">Карта персонажей</Link>
        <Link prefetch={false} href="/timeline">Хронология</Link>
        <Link prefetch={false} href="/quotes">Атлас цитат</Link>
        <Link prefetch={false} href="/sources">Источники и авторские права</Link>
      </div>
      <div className="footer-bottom">
        <span>Фёдор Михайлович Достоевский · 1821–1881</span>
        <span>Независимый образовательный проект · 1.0</span>
      </div>
    </footer>
  );
}
