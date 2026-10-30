import type { Metadata } from "next";
import { CharacterMap } from "@/components/explore";
export const metadata: Metadata = {
  title: "Карта персонажей — Братья Карамазовы",
  description:
    "Интерактивная сеть родственных, конфликтных и духовных связей героев романа.",
};
export default function MapPage() {
  return (
    <section className="page-shell">
      <span className="eyebrow">ИНСТРУМЕНТЫ ИССЛЕДОВАНИЯ · 01</span>
      <h1 className="page-title">Нити, связывающие героев</h1>
      <p className="page-intro">
        Семья, соперничество, любовь и духовное родство. Исследуйте отношения,
        из которых складывается мир Карамазовых.
      </p>
      <CharacterMap />
    </section>
  );
}
