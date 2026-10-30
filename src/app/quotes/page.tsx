import type { Metadata } from "next";
import { QuoteAtlas } from "@/components/explore";
export const metadata: Metadata = {
  title: "Атлас цитат — Братья Карамазовы",
  description:
    "Проверенные фрагменты романа: тематический поиск, слова героев и ссылки на главы.",
};
export default function QuotesPage() {
  return (
    <section className="page-shell">
      <span className="eyebrow">ИНСТРУМЕНТЫ ИССЛЕДОВАНИЯ · 03</span>
      <h1 className="page-title">Слова, которые остаются</h1>
      <p className="page-intro">
        Мысли о свободе, вере и человеческой ответственности. Каждая цитата
        возвращает к голосу героя и полному тексту главы.
      </p>
      <QuoteAtlas />
    </section>
  );
}
