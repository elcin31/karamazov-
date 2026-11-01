import type { MetadataRoute } from "next";
import { characters } from "@/data/museum";
import { studies } from "@/data/studies";
import { literaryRoutes } from "@/data/routes";
import { bookGuides, chapterGuides } from "@/data/book-guides";
import chapters from "@/data/chapters.json";
export default function sitemap(): MetadataRoute.Sitemap {
  const paths = [
    "",
    "/read",
    "/guide",
    "/characters",
    "/philosophy",
    "/context",
    "/gallery",
    "/map",
    "/timeline",
    "/quotes",
    "/court",
    "/routes",
    "/sources",
    ...characters.map((c) => `/characters/${c.id}`),
    ...studies.map((s) => `/philosophy/${s.id}`),
    ...bookGuides.map((b) => `/guide/${b.book}`),
    ...chapterGuides.map((c) => `/chapters/${c.id}`),
    ...literaryRoutes.map((r) => `/routes/${r.id}`),
    ...chapters.map((c) => `/read/${c.id}`),
  ];
  return paths.map((p) => ({
    url: `https://karamazov-eight.vercel.app${p}`,
    changeFrequency: "monthly",
    priority: p === "" ? 1 : 0.6,
  }));
}
