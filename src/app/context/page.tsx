import type { Metadata } from "next";
import {
  authorSections,
  authorChronology,
  authorSources,
  authorQuotes,
} from "@/data/author";
import { Artwork, ArticleSources } from "@/components/editorial";
import { SaveArticle } from "@/components/archive-tools";
export const metadata: Metadata = {
  title: "Достоевский — жизнь и история последнего романа",
  description:
    "Биография, последние годы, история замысла, журнальная публикация, письма и рецепция «Братьев Карамазовых».",
};
export default function Context() {
  return (
    <div className="page-shell">
      <header className="context-hero">
        <div>
          <span className="eyebrow">ДОСТОЕВСКИЙ / ИСТОРИЯ РОМАНА</span>
          <h1 className="page-title">
            Последние годы.
            <br />
            Незавершённый разговор.
          </h1>
          <p className="large-serif">
            От биографии писателя — к истории текста, который оказался его
            последним завершённым романом.
          </p>
          <p className="page-intro">
            Биографическая параллель не объясняет героя целиком. В этом разделе
            документы отделены от возможных связей между жизнью, замыслом и
            художественным миром.
          </p>
          <SaveArticle
            id="author:history"
            title="Достоевский и история романа"
            url="/context"
          />
        </div>
        <Artwork id="dostoevsky-panov-1880" />
      </header>
      <div className="article-layout">
        <nav
          className="article-contents"
          aria-label="История романа: содержание"
        >
          <span>ПИСАТЕЛЬ И ЕГО ВРЕМЯ</span>
          {authorSections.map((s) => (
            <a href={`#${s.id}`} key={s.id}>
              {s.title}
            </a>
          ))}
          <a href="#letter">Голос документа</a>
          <a href="#chronology">Хронология</a>
          <a href="#references">Источники</a>
        </nav>
        <article className="article-body prose">
          {authorSections.map((s, i) => (
            <section key={s.id} id={s.id} className="article-section">
              <span className="kind-label">
                Исторический контекст и редакционный комментарий
              </span>
              <h2>{s.title}</h2>
              {s.paragraphs.map((p, j) => (
                <p key={j}>{p}</p>
              ))}
              {i === 1 && <Artwork id="anna-1871" />}
              {i === 3 && <Artwork id="karamazov-draft" />}
              {i === 6 && <Artwork id="vremya-1861" />}
            </section>
          ))}
          <section id="letter" className="article-section">
            <span className="kind-label">Первичный документ</span>
            <h2>Автор о пятой книге</h2>
            {authorQuotes.map((q) => (
              <blockquote className="argument" key={q.id}>
                <p>«{q.text}»</p>
                <cite>
                  {q.author}
                  <br />
                  {q.date}
                </cite>
                <p className="art-note">{q.context}</p>
                <a
                  href={q.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-link"
                >
                  Прочитать письмо ↗
                </a>
              </blockquote>
            ))}
          </section>
          <section id="chronology">
            <h2>Жизнь и работа над романом</h2>
            <ol className="history-list">
              {authorChronology.map((h) => (
                <li key={h.year + h.title}>
                  <time>{h.year}</time>
                  <div>
                    <h3>{h.title}</h3>
                    <p>{h.text}</p>
                    {h.imageId && <Artwork id={h.imageId} />}
                  </div>
                </li>
              ))}
            </ol>
          </section>
          <ArticleSources sources={authorSources} />
        </article>
      </div>
    </div>
  );
}
