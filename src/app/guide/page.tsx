import type { Metadata } from "next";
import Link from "next/link";
import { bookGuides } from "@/data/book-guides";
export const metadata: Metadata = {
  title: "Путеводитель по роману — двенадцать книг и эпилог",
};
export default function Guide() {
  return (
    <div className="page-shell">
      <span className="eyebrow">
        ПОЛНОЕ ИЗДАНИЕ / ИССЛЕДОВАТЕЛЬСКИЙ АППАРАТ
      </span>
      <h1 className="page-title">Книга за книгой</h1>
      <p className="page-intro">
        Двенадцать книг и эпилог — тринадцать смысловых движений романа. Здесь
        можно прочитать оригинал, сопоставить события и вернуться к вопросу,
        оставшемуся между строк. Разборы содержат сведения о сюжете; режим без
        спойлеров скрывает их до соответствующей главы.
      </p>
      <nav className="page-nav">
        <Link href="/read">Открыть полный текст ↗</Link>
        <Link href="/routes">Читать тематическим маршрутом ↗</Link>
        <Link href="/sources">Об издании и источнике ↗</Link>
      </nav>
      <div className="guide-volume-list">
        {bookGuides.map((b) => (
          <Link href={`/guide/${b.book}`} className="guide-volume" key={b.book}>
            <span>
              {b.book === 13 ? "Эп." : String(b.book).padStart(2, "0")}
            </span>
            <div>
              <h2>{b.title}</h2>
              <small>
                {b.chapterIds.length} глав · Оригинал и путеводитель ↗
              </small>
            </div>
            <p>{b.dek}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
