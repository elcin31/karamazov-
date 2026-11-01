import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import chapters from "@/data/chapters.json";
import { chapterGuides } from "@/data/book-guides";
import { SpoilerGate, ChapterLink } from "@/components/spoiler-gate";
import { RelatedResources } from "@/components/related-resources";
import { SaveArticle } from "@/components/archive-tools";
export function generateStaticParams() {
  return chapterGuides.map((c) => ({ id: c.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `${chapters.find((c) => c.id === id)?.title || "Глава"} — путеводитель`,
  };
}
export default async function ChapterGuide({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = chapters.find((c) => c.id === id);
  const g = chapterGuides.find((g) => g.id === id);
  if (!c || !g) notFound();
  return (
    <div className="page-shell">
      <Link className="back-link" href={`/guide/${c.book}`}>
        ← {c.bookTitle}
      </Link>
      <span className="eyebrow">
        {c.book === 13 ? "ЭПИЛОГ" : `КНИГА ${c.book}`} / ГЛАВА {c.chapter}
      </span>
      <h1 className="page-title">{c.title}</h1>
      <div className="article-tools">
        <Link href={`/read/${id}`} className="button button-wine">
          Читать оригинал ↗
        </Link>
        <SaveArticle
          id={`chapter:${id}`}
          title={c.title}
          url={`/chapters/${id}`}
        />
      </div>
      <SpoilerGate chapterId={id}>
        <article
          className="prose"
          style={{ maxWidth: 780, margin: "45px auto" }}
        >
          <span className="kind-label">Сведения текста</span>
          <h2>Что происходит</h2>
          <p>{g.summary}</p>
          <span className="kind-label">Редакционный комментарий</span>
          <h2>На что обратить внимание</h2>
          {g.analysis.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
          <h2>Вопросы к чтению</h2>
          <ul>
            {g.questions.map((q) => (
              <li key={q}>{q}</li>
            ))}
          </ul>
          <h2>Сопоставить</h2>
          <div className="chapter-links">
            {g.relatedChapterIds.map((ch) => (
              <ChapterLink id={ch} key={ch} />
            ))}
          </div>
          <p className="art-note">
            Комментарий не заменяет оригинал.{" "}
            <a href={c.sourceUrl} target="_blank" rel="noreferrer">
              Источник текста этой главы ↗
            </a>
          </p>
        </article>
      </SpoilerGate>
      <RelatedResources chapterId={id} />
    </div>
  );
}
