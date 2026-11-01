import { sources as textSources } from "@/data/sources";
import { characterArtwork } from "@/data/art-direction";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { characters } from "@/data/museum";
import { characterEssays } from "@/data/character-essays";
import quotes from "@/data/quotes.json";
import chapters from "@/data/chapters.json";
import { Portrait } from "@/components/portrait";
import { SpoilerGate, ChapterLink } from "@/components/spoiler-gate";
import { ArticleSources, KindLabel, Artwork } from "@/components/editorial";
import { SaveArticle, FavoriteQuote } from "@/components/archive-tools";
import { RelatedResources } from "@/components/related-resources";
export function generateStaticParams() {
  return characters.map((c) => ({ id: c.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = characters.find((c) => c.id === id);
  return { title: c?.name || "Персонаж", description: c?.intro };
}
export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = characters.find((c) => c.id === id);
  if (!c) notFound();
  const essay = characterEssays[id];
  const boundary = [
    c.revealAt,
    ...(essay?.sections.flatMap((s) => s.chapterIds) || []),
  ].reduce((a, b) =>
    (chapters.find((c) => c.id === a)?.order || 0) >
    (chapters.find((c) => c.id === b)?.order || 0)
      ? a
      : b,
  );
  const fragments = quotes
    .filter(
      (q) =>
        q.characterId === id ||
        ("subjectIds" in q && (q.subjectIds as string[]).includes(id)),
    )
    .slice(0, 5);
  const sections =
    essay?.sections ||
    c.sections?.map((s, i) => ({ ...s, id: `section-${i}`, sourceIds: [] })) ||
    [];
  return (
    <div className="page-shell">
      <Link className="back-link" href="/characters">
        ← Энциклопедия персонажей
      </Link>
      <header className="character-masthead">
        <div>
          <span className="eyebrow">ДОСЬЕ / {c.epithet}</span>
          <h1 className="page-title">{c.name}</h1>
          <p className="lead">{c.intro}</p>
          <p className="article-meta">
            {essay ? `${essay.readingTime} минут чтения · ` : ""}Факты романа и
            редакционный анализ
          </p>
          <SaveArticle
            id={`character:${id}`}
            title={c.name}
            url={`/characters/${id}`}
          />
        </div>
        <figure className="character-plate">
          <div className="portrait-wrap">
            <Portrait id={id} name={c.name} />
          </div>
          <figcaption className="art-note">
            {characters.indexOf(c) < 12
              ? "Современная цифровая иллюстрация. Художественная интерпретация внешности."
              : "Типографическая каталожная композиция. Исторический портрет не приписывается."}
          </figcaption>
        </figure>
      </header>
      <SpoilerGate chapterId={boundary}>
        <div className="article-layout">
          <aside className="article-contents">
            <span>В ЭТОМ ДОСЬЕ</span>
            <a href="#biography">Сведения текста</a>
            {sections.map((s) => (
              <a href={`#${s.id}`} key={s.id}>
                {s.title}
              </a>
            ))}
            <a href="#connections">Отношения</a>
            <a href="#quotes">Голос и контекст</a>
            <a href="#references">Источники</a>
          </aside>
          <article className="article-body prose">
            <section className="article-section" id="biography">
              <KindLabel kind="text-fact" />
              <h2>История в романе</h2>
              <p>{c.biography}</p>
            </section>
            {sections.map((s) => (
              <section className="article-section" id={s.id} key={s.id}>
                <KindLabel kind={s.kind} />
                <h2>{s.title}</h2>
                {s.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                <div className="chapter-links">
                  {s.chapterIds.map((ch) => (
                    <ChapterLink id={ch} key={ch} />
                  ))}
                </div>
              </section>
            ))}
            {characterArtwork[id] && (
              <Artwork id={characterArtwork[id]} className="dossier-artwork" />
            )}
            <section className="article-section">
              <KindLabel kind="interpretation" />
              <h2>Характер и мотивы</h2>
              <p>{c.psychology}</p>
              <p>{c.worldview}</p>
              <h3>Конфликт и место в композиции</h3>
              <p>{c.role}</p>
              {c.conflicts.map((p) => (
                <p key={p}>{p}</p>
              ))}
              {c.analysis.map((p) => (
                <p key={p}>{p}</p>
              ))}
            </section>
            <section id="connections" className="character-relations">
              <h2>Отношения</h2>
              <div className="relation-list">
                {c.connections.map((r) => (
                  <Link href={`/characters/${r.id}`} key={r.id}>
                    {characters.find((x) => x.id === r.id)?.shortName}
                    <small>{r.label}</small>
                  </Link>
                ))}
              </div>
            </section>
            <section id="quotes">
              <h2>
                {c.quoteMode === "narrated"
                  ? "Голос рассказчика о герое"
                  : "Голос и контекст"}
              </h2>
              {fragments.map((q) => (
                <blockquote className="argument" key={q.id}>
                  <p>«{q.text}»</p>
                  <cite>
                    {q.speaker} · {q.context}
                  </cite>
                  <div className="article-tools">
                    <Link href={`/read/${q.chapterId}`} className="text-link">
                      Проверить в главе {q.chapterId} ↗
                    </Link>
                    <FavoriteQuote id={q.id} />
                  </div>
                </blockquote>
              ))}
            </section>
            <ArticleSources
              sources={
                essay?.sources ||
                textSources.filter((s) =>
                  ["ilibrary", "rvb-commentary"].includes(s.id),
                )
              }
            />
          </article>
        </div>
      </SpoilerGate>
      <section className="crosslinks">
        <h2>Ключевые главы</h2>
        <div className="chapter-links">
          {c.chapters.map((ch) => (
            <ChapterLink key={ch} id={ch} />
          ))}
        </div>
      </section>
      <RelatedResources characterId={id} />
    </div>
  );
}
