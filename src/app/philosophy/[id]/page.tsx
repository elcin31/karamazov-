import { studyArtwork } from "@/data/art-direction";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { studies } from "@/data/studies";
import { SpoilerGate, ChapterLink } from "@/components/spoiler-gate";
import { ArticleSources, KindLabel, Artwork } from "@/components/editorial";
import { SaveArticle } from "@/components/archive-tools";
import { RelatedResources } from "@/components/related-resources";
export function generateStaticParams() {
  return studies.map((s) => ({ id: s.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const s = studies.find((s) => s.id === id);
  return { title: s?.title || "Исследование", description: s?.dek };
}
export default async function StudyPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const s = studies.find((s) => s.id === id);
  if (!s) notFound();
  const words = s.sections.reduce(
    (n, x) => n + x.paragraphs.join(" ").split(/\s+/).length,
    0,
  );
  return (
    <div className="page-shell">
      <Link href="/philosophy" className="back-link">
        ← Все исследования
      </Link>
      <header className="study-header">
        <span className="eyebrow">{s.subtitle}</span>
        <h1 className="page-title">{s.title}</h1>
        <p className="page-intro">{s.dek}</p>
        <div className="article-meta">
          {Math.ceil(words / 180)} минут чтения · Редакционное исследование
        </div>
        <SaveArticle
          id={`study:${id}`}
          title={s.title}
          url={`/philosophy/${id}`}
        />
      </header>
      <SpoilerGate chapterId={s.revealAt}>
        {studyArtwork[id] && (
          <Artwork id={studyArtwork[id]} className="study-artwork" />
        )}
        <div className="article-layout">
          <nav
            className="article-contents"
            aria-label="Содержание исследования"
          >
            <span>В ЭТОМ МАТЕРИАЛЕ</span>
            {s.sections.map((x) => (
              <a href={`#${x.id}`} key={x.id}>
                {x.title}
              </a>
            ))}
            <a href="#references">Источники</a>
          </nav>
          <article className="article-body prose">
            {s.sections.map((x) => (
              <section className="article-section" id={x.id} key={x.id}>
                <KindLabel kind={x.kind} />
                <h2>{x.title}</h2>
                {x.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <div className="chapter-links">
                  {x.chapterIds.map((ch) => (
                    <ChapterLink key={ch} id={ch} />
                  ))}
                </div>
              </section>
            ))}
            <ArticleSources sources={s.sources} />
          </article>
        </div>
      </SpoilerGate>
      <RelatedResources studyId={s.id} />
    </div>
  );
}
