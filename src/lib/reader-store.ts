"use client";
import { openDB } from "idb";
import { useSyncExternalStore } from "react";
export type Bookmark = { chapterId: string; title: string; createdAt: number };
export type Note = {
  id: string;
  chapterId: string;
  text: string;
  createdAt: number;
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
};
let state = initial;
const listeners = new Set<() => void>();
let loading: Promise<void> | undefined;
let writing = Promise.resolve();
let dbPromise: ReturnType<typeof openDB> | undefined;
const database = () =>
  dbPromise ??= openDB("karamazov-reader", 1, {
    upgrade(db) {
      db.createObjectStore("state");
    },
  });
function emit() {
  listeners.forEach((l) => l());
}
export function hydrateReader() {
  if (!loading)
    loading = (async () => {
      try {
        const db = await database();
        const saved = await db.get("state", "reader");
        state = { ...initial, ...saved, hydrated: true };
      } catch {
        state = { ...state, hydrated: true, storageError: true };
      }
      emit();
    })();
  return loading;
}
export function updateReader(patch: Partial<ReaderState>) {
  if (!state.hydrated) { void hydrateReader().then(() => updateReader(patch)); return; }
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
  if (!state.hydrated) { void hydrateReader().then(() => toggleBookmark(chapterId, title)); return; }
  updateReader({
    bookmarks: state.bookmarks.some((b) => b.chapterId === chapterId)
      ? state.bookmarks.filter((b) => b.chapterId !== chapterId)
      : [...state.bookmarks, { chapterId, title, createdAt: Date.now() }],
  });
}
export function addNote(chapterId: string, text: string) {
  if (!state.hydrated) { void hydrateReader().then(() => addNote(chapterId, text)); return; }
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
  if (!state.hydrated) { void hydrateReader().then(() => removeNote(id)); return; }
  updateReader({ notes: state.notes.filter((n) => n.id !== id) });
}
