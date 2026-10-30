import type { Metadata } from "next";
import { notFound } from "next/navigation";
import chapters from "@/data/chapters.json";
import { Reader } from "@/components/reader";
export function generateStaticParams() {
  return chapters.map((c) => ({ id: c.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const c = chapters.find((c) => c.id === id);
  return {
    title: c ? `${c.title} — читать` : "Глава не найдена",
    description: c
      ? `«Братья Карамазовы». ${c.bookTitle}. ${c.title}. Полный текст с сохранением прогресса.`
      : undefined,
  };
}
export default async function ChapterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  if (!chapters.some((c) => c.id === id)) notFound();
  return <Reader chapterId={id} />;
}
