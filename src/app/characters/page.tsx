import type { Metadata } from "next";
import Link from "next/link";
import { characters } from "@/data/museum";
import { Portrait } from "@/components/portrait";
export const metadata: Metadata = { title: "Лица и отношения — энциклопедия" };
export default function Characters() {
  return (
    <div className="page-shell">
      <span className="eyebrow">ЭНЦИКЛОПЕДИЯ / ДЕЙСТВУЮЩИЕ ЛИЦА</span>
      <div className="character-index-header">
        <h1 className="page-title">
          Лица
          <br />и отношения
        </h1>
        <p className="page-intro">
          {characters.length} персонажей: семья, монастырь, город, суд. В каждом
          досье — сведения текста, анализ мотивов и ссылки на главы. Портрет не
          заменяет человека, а литературная роль не исчерпывает его голоса.
        </p>
      </div>
      <nav className="page-nav">
        <Link href="/map">Карта связей ↗</Link>
        <Link href="/routes">Литературные маршруты ↗</Link>
        <Link href="/search?type=character">Поиск по энциклопедии ↗</Link>
      </nav>
      <div className="character-directory">
        {characters.map((c, i) => (
          <Link
            className="character-directory-row"
            href={`/characters/${c.id}`}
            key={c.id}
          >
            <span className="catalog-number">
              {String(i + 1).padStart(2, "0")}
            </span>
            <div className="portrait-thumb">
              <Portrait id={c.id} name={c.name} />
            </div>
            <div>
              <h2>{c.shortName}</h2>
              <span className="eyebrow">{c.epithet}</span>
            </div>
            <p>{c.intro}</p>
            <b aria-hidden="true">↗</b>
          </Link>
        ))}
      </div>
      <p className="art-note">
        Двенадцать основных героев представлены современными цифровыми
        иллюстрациями. Для остальных использованы типографические каталожные
        композиции: они не являются предполагаемыми историческими портретами.{" "}
        <Link href="/sources">О правах и методике →</Link>
      </p>
    </div>
  );
}
