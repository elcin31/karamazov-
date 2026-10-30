import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { themes } from "@/data/museum";
import { SpoilerGate, ChapterLink } from "@/components/spoiler-gate";
export function generateStaticParams() {
  return themes.map((t) => ({ id: t.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return {
    title: themes.find((t) => t.id === id)?.title || "Философский атлас",
  };
}
export default async function ThemePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = themes.find((t) => t.id === id);
  if (!t) notFound();
  return (
    <div className="page-shell">
      <article className="theme-article prose">
        <Link href="/philosophy" className="back-link">
          <ArrowLeft size={14} /> Философский атлас
        </Link>
        <span className="eyebrow">{t.subtitle}</span>
        <h1 className="page-title">{t.title}</h1>
        <p className="page-intro">{t.intro}</p>
        <div className="editorial-label">
          Редакционный анализ · интерпретации, а не единственный ответ
        </div>
        <SpoilerGate chapterId={t.revealAt}>
          <h2>Голоса и аргументы</h2>
          {t.arguments.map((a) => (
            <section key={a.speaker} className="argument">
              <h3>{a.speaker}</h3>
              <p>{a.text}</p>
            </section>
          ))}
          <h2>В контексте романа</h2>
          <p>{t.context}</p>
          <h2>Несколько путей прочтения</h2>
          <ol className="interpretation-list">
            {t.interpretations.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ol>
        </SpoilerGate>
        <h2>Читать и сопоставлять</h2>
        <div className="chapter-links">
          {t.chapters.map((id) => (
            <ChapterLink id={id} key={id} />
          ))}
        </div>
        <p className="art-note">
          Пересказы аргументов не являются цитатами. Для дословных фрагментов с
          подтверждёнными адресами см. <Link href="/quotes">атлас цитат</Link>.
          Научный контекст: комментарии к Собранию сочинений в 15 томах, т.
          9–10; ссылки на <Link href="/sources">странице источников</Link>.
        </p>
      </article>
    </div>
  );
}
