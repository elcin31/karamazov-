"use client";
import Link from "next/link";
import { useReader } from "@/lib/reader-store";
import chapters from "@/data/chapters.json";
export function SpoilerGate({
  chapterId,
  children,
}: {
  chapterId: string;
  children: React.ReactNode;
}) {
  const s = useReader();
  const chapter = chapters.find((c) => c.id === chapterId);
  if (s.spoilerFree && chapter && chapter.order > s.maxOrder)
    return (
      <aside className="spoiler-gate">
        <span className="eyebrow">РЕЖИМ БЕЗ СПОЙЛЕРОВ</span>
        <p>
          Этот материал обсуждает события до{" "}
          {chapter.book === 13 ? "эпилога" : `книги ${chapter.book}`}, главы{" "}
          {chapter.chapter}.{" "}
          <Link href={`/read/${chapter.id}`}>Перейти к чтению</Link> или
          отключить режим без спойлеров в верхней панели.
        </p>
      </aside>
    );
  return <>{children}</>;
}
export function ChapterLink({ id }: { id: string }) {
  const s = useReader();
  const c = chapters.find((c) => c.id === id);
  if (!c) return null;
  const hidden = s.spoilerFree && c.order > s.maxOrder;
  return (
    <Link href={`/read/${id}`}>
      {c.book === 13 ? "Эпилог" : c.book}.{c.chapter} ·{" "}
      {hidden ? "Глава ещё не прочитана" : c.title}
    </Link>
  );
}
