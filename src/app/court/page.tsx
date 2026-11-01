import type { Metadata } from "next";
import { InteractiveCourt } from "@/components/court";
export const metadata: Metadata = {
  title: "Дело Дмитрия Карамазова — интерактивный суд",
  description:
    "Сопоставьте улики, показания и аргументы сторон. Отделите сведения присяжных от знания читателя и сохраните собственную позицию.",
};
export default function CourtPage() {
  return (
    <section className="page-shell">
      <span className="eyebrow">ИССЛЕДОВАТЕЛЬСКАЯ ЛАБОРАТОРИЯ</span>
      <h1 className="page-title">Дело Дмитрия Карамазова</h1>
      <p className="page-intro">
        Как убедительный рассказ становится приговором? Изучите материалы,
        проверьте переходы от факта к выводу и сформулируйте собственную
        позицию.
      </p>
      <InteractiveCourt />
    </section>
  );
}
