import Image from "next/image";
import Link from "next/link";
import images from "@/data/images.json";
export type MuseumImage = (typeof images)[number] & {
  chapterIds?: string[];
  characterIds?: string[];
  tags?: string[];
};
export function Artwork({
  id,
  className = "",
  priority = false,
  caption = true,
}: {
  id: string;
  className?: string;
  priority?: boolean;
  caption?: boolean;
}) {
  const a = images.find((a) => a.id === id);
  if (!a) return null;
  return (
    <figure className={`artwork ${className}`}>
      <div className="artwork-plate">
        <Image
          src={a.src}
          alt={a.title}
          width={a.width}
          height={a.height}
          sizes="(max-width:768px) 92vw, 55vw"
          priority={priority}
          fetchPriority={priority ? "high" : undefined}
        />
      </div>
      {caption && (
        <figcaption>
          <span>{a.title}</span>
          <span>
            {a.author} · {a.date}
          </span>
          <span>
            {a.kind === "generated"
              ? "Современная цифровая реконструкция"
              : a.license.split(" · ")[0]}{" "}
            · <Link href={`/gallery?image=${a.id}`}>Карточка и источник ↗</Link>
          </span>
        </figcaption>
      )}
    </figure>
  );
}
export function SectionHeading({
  number,
  title,
  href,
  label,
}: {
  number: string;
  title: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-heading">
      <span className="section-number">{number}</span>
      <h2>{title}</h2>
      {href && (
        <Link href={href} className="text-link">
          {label || "Открыть раздел"} <span aria-hidden="true">↗</span>
        </Link>
      )}
    </div>
  );
}
export function ArticleSources({
  sources,
}: {
  sources: {
    title: string;
    url: string;
    note?: string;
    description?: string;
  }[];
}) {
  return (
    <section className="article-sources" id="references">
      <span className="eyebrow">ПРОВЕРИТЬ И ПРОДОЛЖИТЬ</span>
      <h2>Источники и чтение</h2>
      <ol>
        {sources.map((s) => (
          <li key={s.url + s.title}>
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.title} ↗
            </a>
            {(s.note || s.description) && <p>{s.note || s.description}</p>}
          </li>
        ))}
      </ol>
    </section>
  );
}
export function KindLabel({ kind }: { kind: string }) {
  return (
    <span className="kind-label">
      {kind === "text-fact"
        ? "Факт текста"
        : kind === "research"
          ? "Исследовательский контекст"
          : "Редакционное прочтение"}
    </span>
  );
}
