import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { bookGuides, chapterGuides } from "@/data/book-guides";
import chapters from "@/data/chapters.json";
import { SpoilerGate, ChapterLink } from "@/components/spoiler-gate";
import { ArticleSources, KindLabel } from "@/components/editorial";
import { SaveArticle } from "@/components/archive-tools";
export function generateStaticParams() {
  return bookGuides.map((b) => ({ book: String(b.book) }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ book: string }>;
}): Promise<Metadata> {
  const { book } = await params;
  return {
    title:
      bookGuides.find((b) => b.book === Number(book))?.title || "Путеводитель",
  };
}
export default async function BookGuide({
  params,
}: {
  params: Promise<{ book: string }>;
}) {
  const { book } = await params;
  const b = bookGuides.find((b) => b.book === Number(book));
  if (!b) notFound();
  return (
    <div className="page-shell">
      <Link href="/guide" className="back-link">
        ← Все книги романа
      </Link>
      <header className="book-header">
        <div>
          <span className="eyebrow">
            {b.book === 13 ? "ЭПИЛОГ" : `КНИГА ${b.book} / ПУТЕВОДИТЕЛЬ`}
          </span>
          <h1 className="page-title">{b.title}</h1>
          <p className="page-intro">{b.dek}</p>
          <SaveArticle
            id={`book:${b.book}`}
            title={b.title}
            url={`/guide/${b.book}`}
          />
        </div>
        <Link href={`/read/${b.chapterIds[0]}`} className="button button-wine">
          Читать оригинал ↗
        </Link>
      </header>
      <SpoilerGate chapterId={b.revealAt}>
        <div className="article-layout">
          <nav
            className="article-contents"
            aria-label="Содержание путеводителя"
          >
            <span>В ЭТОЙ КНИГЕ</span>
            <a href="#introduction">Введение</a>
            <a href="#summary">События</a>
            {b.analysis.map((s, i) => (
              <a href={`#analysis-${i}`} key={i}>
                {s.title}
              </a>
            ))}
            <a href="#chapters">По главам</a>
            <a href="#references">Источники</a>
          </nav>
          <article className="article-body prose">
            <section id="introduction" className="article-section">
              <KindLabel kind="interpretation" />
              <h2>Перед чтением</h2>
              {b.intro.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
            <section id="summary" className="article-section">
              <KindLabel kind="text-fact" />
              <h2>Последовательность событий</h2>
              {b.summary.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
            {b.analysis.map((s, i) => (
              <section id={`analysis-${i}`} className="article-section" key={i}>
                <KindLabel kind="interpretation" />
                <h2>{s.title}</h2>
                {s.paragraphs.map((p, j) => (
                  <p key={j}>{p}</p>
                ))}
              </section>
            ))}
            <section className="article-section">
              <h2>Конфликты и символы</h2>
              {b.conflicts.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {b.symbols.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
            <section id="chapters">
              <h2>Глава за главой</h2>
              <ol className="chapter-directory">
                {b.chapterIds.map((id) => {
                  const c = chapters.find((c) => c.id === id);
                  const g = chapterGuides.find((g) => g.id === id);
                  return c ? (
                    <li key={id}>
                      <span>{c.chapter}</span>
                      <div>
                        <h3>
                          <Link href={`/chapters/${id}`}>{c.title}</Link>
                        </h3>
                        {g && <p>{g.summary}</p>}
                        <small>
                          <Link href={`/read/${id}`}>Оригинальный текст ↗</Link>{" "}
                          · <Link href={`/chapters/${id}`}>Комментарий ↗</Link>
                        </small>
                      </div>
                    </li>
                  ) : null;
                })}
              </ol>
            </section>
            <ArticleSources sources={b.sources} />
          </article>
        </div>
      </SpoilerGate>
      <section className="crosslinks">
        <h2>Продолжить чтение</h2>
        <div className="chapter-links">
          {b.chapterIds.map((ch) => (
            <ChapterLink id={ch} key={ch} />
          ))}
        </div>
        {b.book < 13 && (
          <Link href={`/guide/${b.book + 1}`} className="text-link">
            Следующая {b.book === 12 ? "часть: эпилог" : "книга"} ↗
          </Link>
        )}
      </section>
    </div>
  );
}
