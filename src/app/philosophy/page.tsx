import type { Metadata } from "next";
import Link from "next/link";
import { studies } from "@/data/studies";
export const metadata: Metadata = { title: "Исследования — философский атлас" };
export default function Philosophy() {
  return (
    <div className="page-shell">
      <span className="eyebrow">ИССЛЕДОВАНИЯ / ФИЛОСОФСКИЙ АТЛАС</span>
      <h1 className="page-title">Не один ответ</h1>
      <p className="page-intro">
        {studies.length} исследований: аргументы героев, возражения и
        внимательное чтение ключевых сцен. Ни один голос не принят здесь за
        окончательный голос автора. Текст, исторический контекст и редакционная
        интерпретация обозначены отдельно.
      </p>
      <nav className="page-nav">
        <Link href="/routes">Тематические маршруты ↗</Link>
        <Link href="/quotes">Атлас проверенных цитат ↗</Link>
      </nav>
      <div className="study-index">
        {studies.map((s, i) => (
          <Link
            className="study-index-row"
            href={`/philosophy/${s.id}`}
            key={s.id}
          >
            <span>{String(i + 1).padStart(2, "0")}</span>
            <div>
              <span className="eyebrow">{s.subtitle}</span>
              <h2>{s.title}</h2>
            </div>
            <p>{s.dek}</p>
            <b aria-hidden="true">↗</b>
          </Link>
        ))}
      </div>
    </div>
  );
}
