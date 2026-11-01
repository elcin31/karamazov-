import type { Metadata } from "next";
import Link from "next/link";
import { literaryRoutes } from "@/data/routes";
export const metadata: Metadata = { title: "Литературные маршруты" };
export default function Routes() {
  return (
    <div className="page-shell">
      <span className="eyebrow">МАРШРУТЫ ВНИМАТЕЛЬНОГО ЧТЕНИЯ</span>
      <h1 className="page-title">
        Читать по вопросу,
        <br />а не только по порядку.
      </h1>
      <p className="page-intro">
        Шесть маршрутов соединяют оригинальные главы, героев, события,
        изображения и исследования. Они помогают сопоставлять сцены, но не
        заменяют последовательного чтения романа.
      </p>
      <div className="route-overview">
        {literaryRoutes.map((r, i) => (
          <Link href={`/routes/${r.id}`} key={r.id}>
            <span className="eyebrow">
              МАРШРУТ {String(i + 1).padStart(2, "0")}
            </span>
            <h2>{r.title}</h2>
            <p>{r.dek}</p>
            <small>{r.steps.length} остановок · Начать маршрут ↗</small>
          </Link>
        ))}
      </div>
    </div>
  );
}
