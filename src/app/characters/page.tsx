import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { characters } from "@/data/museum";
import { Portrait } from "@/components/portrait";
export const metadata: Metadata = {
  title: "Лица и судьбы — энциклопедия персонажей",
};
export default function Characters() {
  return (
    <div className="page-shell">
      <span className="eyebrow">ЭНЦИКЛОПЕДИЯ ПЕРСОНАЖЕЙ</span>
      <h1 className="page-title">Лица и судьбы</h1>
      <p className="page-intro">
        У каждого — своя правда, своя боль и свой путь. Двенадцать портретов
        помогают разобраться в отношениях героев и услышать за сюжетным спором
        живые человеческие голоса.
      </p>
      <nav className="page-nav">
        <Link href="/map">Карта связей ↗</Link>
        <Link href="/timeline">Хронология романа ↗</Link>
      </nav>
      <div className="character-grid">
        {characters.map((c) => (
          <Link
            className="character-card"
            href={`/characters/${c.id}`}
            key={c.id}
          >
            <div className="portrait-wrap">
              <Portrait id={c.id} name={c.name} />
              <ArrowUpRight className="portrait-arrow" size={19} />
            </div>
            <h2>{c.shortName}</h2>
            <span className="eyebrow">{c.epithet}</span>
            <p>{c.intro}</p>
          </Link>
        ))}
      </div>
      <p className="art-note">
        Портреты — современные цифровые иллюстрации, художественные
        интерпретации внешности персонажей.{" "}
        <Link href="/sources">Происхождение изображений →</Link>
      </p>
    </div>
  );
}
