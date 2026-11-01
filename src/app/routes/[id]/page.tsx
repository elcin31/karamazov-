import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { literaryRoutes } from "@/data/routes";
import { studies } from "@/data/studies";
import { events } from "@/data/museum";
import quotes from "@/data/quotes.json";
import { SpoilerGate, ChapterLink } from "@/components/spoiler-gate";
import { SaveArticle } from "@/components/archive-tools";
import { Artwork } from "@/components/editorial";
export function generateStaticParams() {
  return literaryRoutes.map((r) => ({ id: r.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  return { title: literaryRoutes.find((r) => r.id === id)?.title || "Маршрут" };
}
export default async function RoutePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const r = literaryRoutes.find((r) => r.id === id);
  if (!r) notFound();
  return (
    <div className="page-shell">
      <Link href="/routes" className="back-link">
        ← Все маршруты
      </Link>
      <span className="eyebrow">
        ЛИТЕРАТУРНЫЙ МАРШРУТ / {r.steps.length} ОСТАНОВОК
      </span>
      <h1 className="page-title">{r.title}</h1>
      <p className="page-intro">{r.dek}</p>
      <SaveArticle id={`route:${id}`} title={r.title} url={`/routes/${id}`} />
      <ol className="route-steps">
        {r.steps.map((s, i) => (
          <li key={s.chapterId}>
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <SpoilerGate chapterId={s.chapterId}>
                <h2>{s.title}</h2>
                <p>{s.comment}</p>
                {s.imageIds.map((im) => (
                  <Artwork id={im} key={im} />
                ))}
                {s.quoteIds.map((qid) => {
                  const q = quotes.find((q) => q.id === qid);
                  return q ? (
                    <blockquote key={qid} className="argument">
                      <p>«{q.text}»</p>
                      <cite>{q.speaker}</cite>
                    </blockquote>
                  ) : null;
                })}
                <div className="chapter-links">
                  {s.studyIds.map((sid) => (
                    <Link href={`/philosophy/${sid}`} key={sid}>
                      Исследование: {studies.find((x) => x.id === sid)?.title} ↗
                    </Link>
                  ))}
                  {s.eventIds.map((eid) => (
                    <Link href={`/timeline#${eid}`} key={eid}>
                      Событие: {events.find((e) => e.id === eid)?.title} ↗
                    </Link>
                  ))}
                </div>
              </SpoilerGate>
              <ChapterLink id={s.chapterId} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
