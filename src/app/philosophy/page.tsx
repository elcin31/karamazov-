import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { themes } from "@/data/museum";
export const metadata: Metadata = { title: "Философский атлас" };
export default function Philosophy() {
  return (
    <div className="page-shell">
      <span className="eyebrow">ФИЛОСОФСКИЙ АТЛАС</span>
      <h1 className="page-title">Вопросы без простых ответов</h1>
      <p className="page-intro">
        Роман не сводится к одной формуле. Аргументы Ивана, опыт Дмитрия,
        деятельная любовь Алёши и поучения Зосимы образуют спор, в котором ни
        один голос нельзя безоговорочно принять за голос автора.
      </p>
      <div className="theme-grid">
        {themes.map((t, i) => (
          <Link key={t.id} href={`/philosophy/${t.id}`} className="theme-card">
            <span>0{i + 1}</span>
            <div>
              <span className="eyebrow">{t.subtitle}</span>
              <h2>{t.title}</h2>
              <p>{t.intro}</p>
            </div>
            <ArrowUpRight size={20} />
          </Link>
        ))}
      </div>
      <div className="editorial-label">
        Все статьи — редакционные интерпретации с опорой на главы романа.
      </div>
    </div>
  );
}
