import Link from "next/link";
import { characters, events } from "@/data/museum";
import { studies } from "@/data/studies";
import images from "@/data/images.json";
import { SpoilerGate, ChapterLink } from "@/components/spoiler-gate";
import type { MuseumImage } from "./editorial";
export function RelatedResources({
  characterId,
  chapterId,
  studyId,
}: {
  characterId?: string;
  chapterId?: string;
  studyId?: string;
}) {
  const c = characters.find((c) => c.id === characterId);
  const study = studies.find((s) => s.id === studyId);
  const chapterSet = new Set(
    chapterId ? [chapterId] : c?.chapters || study?.chapterIds || [],
  );
  const relatedStudies = studies
    .filter(
      (s) =>
        s.id !== studyId &&
        (characterId
          ? s.characterIds.includes(characterId)
          : s.chapterIds.some((ch) => chapterSet.has(ch))),
    )
    .slice(0, 5);
  const relatedImages = (images as MuseumImage[])
    .filter((a) =>
      characterId
        ? a.characterIds?.includes(characterId)
        : a.chapterIds?.some((ch) => chapterSet.has(ch)),
    )
    .slice(0, 4);
  const relatedEvents = events
    .filter((e) => chapterSet.has(e.chapterId))
    .slice(0, 4);
  return (
    <section className="crosslinks">
      <h2>Связанные материалы</h2>
      <div className="crosslinks-grid">
        {relatedStudies.length > 0 && (
          <section>
            <h3>Исследования</h3>
            {relatedStudies.map((s) => (
              <Link href={`/philosophy/${s.id}`} key={s.id}>
                {s.title} ↗
              </Link>
            ))}
          </section>
        )}
        {relatedEvents.length > 0 && (
          <section>
            <h3>Атлас событий</h3>
            {relatedEvents.map((e) => (
              <SpoilerGate chapterId={e.chapterId} key={e.id}>
                <Link href={`/timeline#${e.id}`}>{e.title} ↗</Link>
              </SpoilerGate>
            ))}
          </section>
        )}
        {relatedImages.length > 0 && (
          <section>
            <h3>Коллекция</h3>
            {relatedImages.map((a) => (
              <SpoilerGate
                chapterId={a.chapterIds?.[a.chapterIds.length - 1] || "preface"}
                key={a.id}
              >
                <Link href={`/gallery?image=${a.id}`}>{a.title} ↗</Link>
              </SpoilerGate>
            ))}
          </section>
        )}
        {chapterSet.size > 0 && (
          <section>
            <h3>Оригинальный текст</h3>
            {[...chapterSet].slice(0, 5).map((ch) => (
              <ChapterLink id={ch} key={ch} />
            ))}
          </section>
        )}
      </div>
    </section>
  );
}
