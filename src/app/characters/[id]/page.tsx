import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { characters } from "@/data/museum";
import quotes from "@/data/quotes.json";
import { Portrait } from "@/components/portrait";
import { SpoilerGate, ChapterLink } from "@/components/spoiler-gate";
export function generateStaticParams() {
  return characters.map((c) => ({ id: c.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: characters.find((c) => c.id === id)?.name || "Персонаж" };
}
export default async function CharacterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = characters.find((c) => c.id === id);
  if (!c) notFound();
  const selectedQuotes = quotes
    .filter((q) => q.characterId === c.id)
    .slice(0, 3);
  return (
    <div className="page-shell">
      <Link href="/characters" className="back-link">
        <ArrowLeft size={14} /> Все персонажи
      </Link>
      <div className="character-detail">
        <aside className="character-sidebar">
          <div className="portrait-wrap">
            <Portrait id={c.id} name={c.name} />
          </div>
          <span className="eyebrow">{c.epithet}</span>
          <p className="art-note">
            Современная цифровая иллюстрация.
            <br />
            Художественная интерпретация.
          </p>
          <Link className="text-link" href="/map">
            Отношения на карте ↗
          </Link>
        </aside>
        <article className="character-main">
          <span className="eyebrow">ЛИЦА И СУДЬБЫ</span>
          <h1 className="page-title">{c.name}</h1>
          <p className="lead">{c.intro}</p>
          <SpoilerGate chapterId={c.revealAt}>
            <div className="editorial-label">Факты текста</div>
            <h2>История героя</h2>
            <p>{c.biography}</p>
            <div className="editorial-label">
              Редакционный литературный анализ
            </div>
            <h2>Роль в романе</h2>
            <p>{c.role}</p>
            <h2>Психологический портрет</h2>
            <p>{c.psychology}</p>
            <h2>Мировоззрение</h2>
            <p>{c.worldview}</p>
            <h2>Внутренние конфликты</h2>
            {c.conflicts.map((t) => (
              <p key={t}>{t}</p>
            ))}
            <h2>Возможное прочтение</h2>
            {c.analysis.map((t) => (
              <p key={t}>{t}</p>
            ))}
            <h2>Отношения</h2>
            <div className="chapter-links">
              {c.connections.map((r) => (
                <Link href={`/characters/${r.id}`} key={r.id}>
                  {characters.find((x) => x.id === r.id)?.shortName} · {r.label}
                </Link>
              ))}
            </div>
          </SpoilerGate>
          <h2>Ключевые главы</h2>
          <div className="chapter-links">
            {c.chapters.map((ch) => (
              <ChapterLink id={ch} key={ch} />
            ))}
          </div>
          {selectedQuotes.length > 0 && (
            <>
              <h2>Голос героя</h2>
              {selectedQuotes.map((q) => (
                <SpoilerGate chapterId={q.chapterId} key={q.id}>
                  <blockquote className="argument">
                    <p>«{q.text}»</p>
                    <Link className="text-link" href={`/read/${q.chapterId}`}>
                      Книга {q.chapterId.replace("-", " · глава ")} · Проверить
                      в тексте ↗
                    </Link>
                  </blockquote>
                </SpoilerGate>
              ))}
            </>
          )}
          <p className="art-note">
            Основание: текст романа, издание «Наука», 1991, т. 9–10. Биография и
            сюжетные сведения отделены от редакционных интерпретаций.{" "}
            <Link href="/sources">Источники →</Link>
          </p>
        </article>
      </div>
    </div>
  );
}
