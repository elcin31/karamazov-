import type { SearchIndexItem } from "@/components/site-search";
import { characters, events } from "@/data/museum";
import { studies } from "@/data/studies";
import { characterEssays } from "@/data/character-essays";
import { bookGuides, chapterGuides } from "@/data/book-guides";
import { authorSections } from "@/data/author";
import { literaryRoutes } from "@/data/routes";
import { courtEvidence } from "@/data/court";
import chapterData from "@/data/chapters.json";
import imageData from "@/data/images.json";

type IndexedImage = (typeof imageData)[number] & {
  chapterIds?: string[];
  characterIds?: string[];
  tags?: string[];
};
const chapterById = new Map(
  chapterData.map((chapter) => [chapter.id, chapter]),
);
function lastChapter(ids: string[]): string | undefined {
  return ids.reduce<string | undefined>((last, id) => {
    const current = chapterById.get(id);
    return current &&
      (!last || current.order > (chapterById.get(last)?.order ?? -1))
      ? id
      : last;
  }, undefined);
}
const paragraphText = (paragraphs: string[]) => paragraphs.join("\n\n");

/**
 * The page receives descriptions and headings only. The complete editorial
 * corpus is requested separately when a visitor actually starts searching.
 * Original novel text remains in its own, independently loaded search corpus.
 */
export function getSearchIndex(full = false): SearchIndexItem[] {
  const items: SearchIndexItem[] = [];
  const add = (item: SearchIndexItem, body: string[] = []) => {
    items.push({
      ...item,
      keywords: [...(item.keywords ?? []), ...(full ? body : [])],
    });
  };

  for (const character of characters) {
    // Names and introductory identities can be searched without reading a finale.
    add({
      id: `character:${character.id}`,
      type: "character",
      title: character.name,
      excerpt: character.intro,
      url: `/characters/${character.id}`,
      keywords: [character.shortName, character.epithet],
    });
    const essay = characterEssays[character.id];
    const sections = essay?.sections ?? character.sections ?? [];
    const boundary = lastChapter([
      character.revealAt,
      ...character.chapters,
      ...sections.flatMap((section) => section.chapterIds),
    ]);
    add(
      {
        id: `dossier:${character.id}`,
        type: "article",
        title: `${character.shortName}: исследовательское досье`,
        excerpt:
          essay?.dek ??
          "Биография в романе, психологический портрет, мотивы поступков, связи и возможные прочтения.",
        url: `/characters/${character.id}`,
        revealAt: boundary,
        keywords: [character.name, ...sections.map((section) => section.title)],
      },
      [
        character.biography,
        character.psychology,
        character.worldview,
        character.role,
        ...character.conflicts,
        ...character.analysis,
        ...sections.flatMap((section) => section.paragraphs),
      ],
    );
  }

  for (const study of studies) {
    add(
      {
        id: `study:${study.id}`,
        type: "study",
        title: study.title,
        excerpt: study.dek,
        url: `/philosophy/${study.id}`,
        revealAt: lastChapter([
          study.revealAt,
          ...study.chapterIds,
          ...study.sections.flatMap((section) => section.chapterIds),
        ]),
        keywords: [
          study.subtitle,
          ...study.sections.map((section) => section.title),
          ...study.characterIds.map(
            (id) =>
              characters.find((character) => character.id === id)?.name ?? id,
          ),
        ],
      },
      study.sections.flatMap((section) => section.paragraphs),
    );
  }

  for (const event of events) {
    add({
      id: `event:${event.id}`,
      type: "event",
      title: event.title,
      excerpt: event.text,
      url: `/timeline#${event.id}`,
      chapterId: event.chapterId,
      keywords: [event.period],
    });
  }

  for (const image of imageData as IndexedImage[]) {
    add({
      id: `image:${image.id}`,
      type: "image",
      title: image.title,
      excerpt: `${image.author} · ${image.date}. ${image.description}`,
      url: `/gallery?image=${image.id}`,
      revealAt: lastChapter(image.chapterIds ?? []),
      keywords: [
        image.author,
        image.section,
        image.license,
        ...(image.tags ?? []),
        ...(image.characterIds ?? []).map(
          (id) =>
            characters.find((character) => character.id === id)?.name ?? id,
        ),
      ],
    });
  }

  for (const book of bookGuides) {
    add(
      {
        id: `book:${book.book}`,
        type: "book",
        title: `${book.book === 13 ? "Эпилог" : `Книга ${book.book}`} · ${book.title}`,
        excerpt: book.dek,
        url: `/guide/${book.book}`,
        revealAt: book.revealAt,
        keywords: [
          ...book.analysis.map((section) => section.title),
          ...book.conflicts,
          ...book.symbols,
        ],
      },
      [
        ...book.intro,
        ...book.summary,
        ...book.analysis.flatMap((section) => section.paragraphs),
      ],
    );
  }

  for (const chapter of chapterData) {
    const guide = chapterGuides.find((entry) => entry.id === chapter.id);
    add(
      {
        id: `chapter:${chapter.id}`,
        type: "chapter",
        title: `${chapter.book === 0 ? "От автора" : chapter.book === 13 ? `Эпилог, глава ${chapter.chapter}` : `Книга ${chapter.book}, глава ${chapter.chapter}`} · ${chapter.title}`,
        excerpt:
          guide?.summary ??
          `${chapter.bookTitle}. Оригинальный текст и адрес главы.`,
        url: guide ? `/chapters/${chapter.id}` : `/read/${chapter.id}`,
        chapterId: chapter.id,
        keywords: [chapter.bookTitle, ...(guide?.questions ?? [])],
      },
      guide?.analysis ?? [],
    );
  }

  for (const section of authorSections) {
    add(
      {
        id: `author:${section.id}`,
        type: "article",
        title: `Достоевский: ${section.title}`,
        excerpt:
          section.paragraphs[0]?.slice(0, 220) ??
          "Биография писателя и история создания романа.",
        url: `/context#${section.id}`,
        revealAt: lastChapter(section.chapterIds),
        keywords: [
          "Фёдор Михайлович Достоевский",
          "история создания",
          "биография",
        ],
      },
      section.paragraphs,
    );
  }

  add({
    id: "court:overview",
    type: "article",
    title: "Интерактивный суд: доказательства и версии",
    excerpt:
      "Сопоставьте улики, свидетельства и аргументы. Отделите сведения, доступные суду, от знаний читателя и сохраните собственную позицию.",
    url: "/court",
    keywords: [
      "суд",
      "правосудие",
      "улики",
      "показания",
      "вердикт",
      "присяжные",
    ],
  });
  for (const evidence of courtEvidence) {
    add(
      {
        id: `court:${evidence.id}`,
        type: "article",
        title: `Судебное дело: ${evidence.title}`,
        excerpt: evidence.summary,
        url: "/court",
        revealAt: lastChapter(["12-1", ...evidence.chapterIds]),
        keywords: [
          evidence.category,
          "суд",
          "доказательства",
          ...(evidence.knownToCourt
            ? ["известно суду"]
            : ["только знание читателя"]),
        ],
      },
      [evidence.prosecution, evidence.defense, evidence.limit],
    );
  }

  for (const route of literaryRoutes) {
    add({
      id: `route:${route.id}`,
      type: "route",
      title: route.title,
      excerpt: route.dek,
      url: `/routes/${route.id}`,
      keywords: route.characterIds.map(
        (id) => characters.find((character) => character.id === id)?.name ?? id,
      ),
    });
    for (const [step, entry] of route.steps.entries()) {
      add(
        {
          id: `route-step:${route.id}:${step}`,
          type: "route",
          title: `${route.title}: ${entry.title}`,
          excerpt: entry.comment.slice(0, 240),
          url: `/routes/${route.id}`,
          chapterId: entry.chapterId,
          keywords: [route.title, entry.title],
        },
        [entry.comment],
      );
    }
  }
  return items;
}
