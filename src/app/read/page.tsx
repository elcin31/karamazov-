import type { Metadata } from "next";
import { Reader } from "@/components/reader";
export const metadata: Metadata = {
  title: "Читать роман",
  description:
    "Полный русский текст «Братьев Карамазовых»: 12 книг и эпилог. Читалка с закладками, заметками и сохранением прогресса.",
};
export default function ReadPage() {
  return <Reader />;
}
