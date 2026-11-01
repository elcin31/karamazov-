"use client";
import { openDB } from "idb";
import { useSyncExternalStore } from "react";
import chapterData from "@/data/chapters.json";
export type Bookmark = { chapterId: string; title: string; createdAt: number };
export type Note = {
  id: string;
  chapterId: string;
  text: string;
  createdAt: number;
};
export type SavedArticle = {
  id: string;
  title: string;
  url: string;
  createdAt: number;
};
export type ReadingVisit = { chapterId: string; visitedAt: number };
export type CourtNotebook = {
  verdict: "undecided" | "not-proven" | "guilty" | "not-guilty";
  reasoning: string;
  evidenceIds: string[];
  updatedAt: number;
};
export type ReaderState = {
  chapterId: string;
  maxOrder: number;
  paragraph: number;
  bookmarks: Bookmark[];
  notes: Note[];
  spoilerFree: boolean;
  fontSize: number;
  lineHeight: number;
  readingTheme: "paper" | "night";
  hydrated: boolean;
  storageError: boolean;
  savedArticles: SavedArticle[];
  favoriteQuoteIds: string[];
  history: ReadingVisit[];
  court: CourtNotebook;
};
const initial: ReaderState = {
  chapterId: "preface",
  maxOrder: 0,
  paragraph: 0,
  bookmarks: [],
  notes: [],
  spoilerFree: true,
  fontSize: 21,
  lineHeight: 1.85,
  readingTheme: "paper",
  hydrated: false,
  storageError: false,
  savedArticles: [],
  favoriteQuoteIds: [],
  history: [],
  court: { verdict: "undecided", reasoning: "", evidenceIds: [], updatedAt: 0 },
};
let state = initial;
const listeners = new Set<() => void>();
let loading: Promise<void> | undefined;
let writing = Promise.resolve();
let dbPromise: ReturnType<typeof openDB> | undefined;
const database = () =>
  (dbPromise ??= openDB("karamazov-reader", 1, {
    upgrade(db) {
      db.createObjectStore("state");
    },
  }));
const chapterIds = new Set(chapterData.map((c) => c.id));
function emit() {
  listeners.forEach((l) => l());
}
export function hydrateReader() {
  if (!loading)
    loading = (async () => {
      try {
        const db = await database();
        const saved = await db.get("state", "reader");
        // New fields are additive: version 1 notebooks keep their progress and notes.
        state = {
          ...initial,
          ...saved,
          court: { ...initial.court, ...saved?.court },
          hydrated: true,
        };
      } catch {
        state = { ...state, hydrated: true, storageError: true };
      }
      emit();
    })();
  return loading;
}
export function updateReader(patch: Partial<ReaderState>) {
  if (!state.hydrated) {
    void hydrateReader().then(() => updateReader(patch));
    return;
  }
  if (
    patch.chapterId &&
    !patch.history &&
    chapterIds.has(patch.chapterId) &&
    (patch.chapterId !== state.chapterId ||
      !state.history.some((h) => h.chapterId === patch.chapterId))
  ) {
    patch = {
      ...patch,
      history: [
        { chapterId: patch.chapterId, visitedAt: Date.now() },
        ...state.history.filter((h) => h.chapterId !== patch.chapterId),
      ].slice(0, 100),
    };
  }
  state = { ...state, ...patch };
  emit();
  const snapshot = { ...state };
  writing = writing.then(async () => {
    try {
      const db = await database();
      await db.put("state", snapshot, "reader");
    } catch {
      if (!state.storageError) {
        state = { ...state, storageError: true };
        emit();
      }
    }
  });
}
export function useReader() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => initial,
  );
}
export function toggleBookmark(chapterId: string, title: string) {
  if (!state.hydrated) {
    void hydrateReader().then(() => toggleBookmark(chapterId, title));
    return;
  }
  updateReader({
    bookmarks: state.bookmarks.some((b) => b.chapterId === chapterId)
      ? state.bookmarks.filter((b) => b.chapterId !== chapterId)
      : [...state.bookmarks, { chapterId, title, createdAt: Date.now() }],
  });
}
export function addNote(chapterId: string, text: string) {
  if (!state.hydrated) {
    void hydrateReader().then(() => addNote(chapterId, text));
    return;
  }
  if (text.trim())
    updateReader({
      notes: [
        ...state.notes,
        {
          id: crypto.randomUUID(),
          chapterId,
          text: text.trim(),
          createdAt: Date.now(),
        },
      ],
    });
}
export function removeNote(id: string) {
  if (!state.hydrated) {
    void hydrateReader().then(() => removeNote(id));
    return;
  }
  updateReader({ notes: state.notes.filter((n) => n.id !== id) });
}
export function toggleSavedArticle(article: Omit<SavedArticle, "createdAt">) {
  if (!state.hydrated) {
    void hydrateReader().then(() => toggleSavedArticle(article));
    return;
  }
  updateReader({
    savedArticles: state.savedArticles.some((a) => a.id === article.id)
      ? state.savedArticles.filter((a) => a.id !== article.id)
      : [...state.savedArticles, { ...article, createdAt: Date.now() }],
  });
}
export function toggleFavoriteQuote(id: string) {
  if (!state.hydrated) {
    void hydrateReader().then(() => toggleFavoriteQuote(id));
    return;
  }
  updateReader({
    favoriteQuoteIds: state.favoriteQuoteIds.includes(id)
      ? state.favoriteQuoteIds.filter((q) => q !== id)
      : [...state.favoriteQuoteIds, id],
  });
}
export function exportReaderBackup() {
  const { hydrated: _hydrated, storageError: _storageError, ...reader } = state;
  return { version: 2, exportedAt: new Date().toISOString(), reader };
}
const record = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const finite = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0;
const short = (value: unknown, max = 400): value is string =>
  typeof value === "string" && value.length > 0 && value.length <= max;
const validChapter = (value: unknown): value is string =>
  typeof value === "string" && chapterIds.has(value);
const validPath = (value: unknown): value is string =>
  typeof value === "string" &&
  /^\/(?:characters|philosophy|studies|guide|books|chapters|context|author|routes|court)(?:\/[-\w]+)*\/?$/.test(
    value,
  );
const unique = <T>(a: T[], key: (item: T) => string) =>
  Array.from(new Map(a.map((v) => [key(v), v])).values());
export async function importReaderBackup(value: unknown) {
  await hydrateReader();
  if (!record(value) || ![1, 2].includes(Number(value.version)))
    throw Error("Файл не является тетрадью Карамазова версии 1 или 2.");
  const incoming = Number(value.version) === 2 ? value.reader : value;
  if (!record(incoming))
    throw Error("В файле отсутствуют читательские данные.");
  const safeArray = (v: unknown, name: string) => {
    if (v === undefined) return [];
    if (!Array.isArray(v) || v.length > 20000)
      throw Error(`Некорректный раздел: ${name}.`);
    return v;
  };
  const bookmarks = safeArray(incoming.bookmarks, "закладки");
  if (
    !bookmarks.every(
      (b) =>
        record(b) &&
        validChapter(b.chapterId) &&
        short(b.title) &&
        finite(b.createdAt),
    )
  )
    throw Error("Некорректные закладки.");
  const notes = safeArray(incoming.notes, "заметки");
  if (
    !notes.every(
      (n) =>
        record(n) &&
        short(n.id) &&
        validChapter(n.chapterId) &&
        short(n.text, 12000) &&
        finite(n.createdAt),
    )
  )
    throw Error("Некорректные заметки.");
  const articles = safeArray(incoming.savedArticles, "статьи");
  if (
    !articles.every(
      (a) =>
        record(a) &&
        short(a.id) &&
        short(a.title) &&
        validPath(a.url) &&
        finite(a.createdAt),
    )
  )
    throw Error("Некорректные сохранённые статьи.");
  const favoriteQuoteIds = safeArray(incoming.favoriteQuoteIds, "цитаты");
  if (!favoriteQuoteIds.every((q) => short(q, 150)))
    throw Error("Некорректные избранные цитаты.");
  const history = safeArray(incoming.history, "история");
  if (
    !history.every(
      (h) => record(h) && validChapter(h.chapterId) && finite(h.visitedAt),
    )
  )
    throw Error("Некорректная история чтения.");
  const progress =
    Number(value.version) === 1 && record(incoming.progress)
      ? incoming.progress
      : incoming;
  const maxOrder = finite(progress.maxOrder)
    ? Math.min(chapterData.length - 1, Math.floor(progress.maxOrder as number))
    : state.maxOrder;
  const importedNotes = (notes as Note[]).map((note) => {
    const current = state.notes.find((item) => item.id === note.id);
    return current &&
      (current.text !== note.text || current.chapterId !== note.chapterId)
      ? { ...note, id: crypto.randomUUID() }
      : note;
  });
  const patch: Partial<ReaderState> = {
    bookmarks: unique(
      [...state.bookmarks, ...(bookmarks as Bookmark[])],
      (b) => b.chapterId,
    ),
    notes: unique([...state.notes, ...importedNotes], (n) => n.id),
    savedArticles: unique(
      [...state.savedArticles, ...(articles as SavedArticle[])],
      (a) => a.id,
    ),
    favoriteQuoteIds: [
      ...new Set([
        ...state.favoriteQuoteIds,
        ...(favoriteQuoteIds as string[]),
      ]),
    ],
    history: unique(
      [...state.history, ...(history as ReadingVisit[])].sort(
        (a, b) => b.visitedAt - a.visitedAt,
      ),
      (h) => h.chapterId,
    ).slice(0, 100),
    maxOrder: Math.max(state.maxOrder, maxOrder),
  };
  if (maxOrder > state.maxOrder && validChapter(progress.chapterId)) {
    patch.chapterId = progress.chapterId;
    patch.paragraph = finite(progress.paragraph)
      ? Math.floor(progress.paragraph as number)
      : 0;
  }
  if (incoming.court !== undefined) {
    const c = incoming.court;
    if (
      !record(c) ||
      !["undecided", "not-proven", "guilty", "not-guilty"].includes(
        String(c.verdict),
      ) ||
      typeof c.reasoning !== "string" ||
      c.reasoning.length > 12000 ||
      !Array.isArray(c.evidenceIds) ||
      c.evidenceIds.length > 100 ||
      !c.evidenceIds.every((id) => short(id, 100)) ||
      !finite(c.updatedAt)
    )
      throw Error("Некорректная тетрадь судебного исследования.");
    if ((c.updatedAt as number) > state.court.updatedAt)
      patch.court = {
        verdict: c.verdict as CourtNotebook["verdict"],
        reasoning: c.reasoning,
        evidenceIds: [...new Set(c.evidenceIds as string[])],
        updatedAt: c.updatedAt as number,
      };
  }
  // Backups merge collections. Preferences stay local; the more recent court notebook wins.
  updateReader(patch);
  await writing;
  return {
    bookmarks: bookmarks.length,
    notes: notes.length,
    articles: articles.length,
    quotes: favoriteQuoteIds.length,
  };
}
