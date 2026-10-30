import type { Metadata } from "next";
import { Timeline } from "@/components/explore";
export const metadata: Metadata = {
  title: "Хронология романа — Братья Карамазовы",
  description:
    "События романа Достоевского в последовательности повествования, с переходами к главам.",
};
export default function TimelinePage() {
  return (
    <section className="page-shell">
      <span className="eyebrow">ИНСТРУМЕНТЫ ИССЛЕДОВАНИЯ · 02</span>
      <h1 className="page-title">Время Карамазовых</h1>
      <p className="page-intro">
        От истории одной семьи к суду и последнему слову у камня. Путь сквозь
        события и поворотные точки романа.
      </p>
      <Timeline />
    </section>
  );
}
