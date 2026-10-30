import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import images from "@/data/images.json";
import { SpoilerGate } from "@/components/spoiler-gate";
export const metadata: Metadata = { title: "Галерея — образы и документы" };
export default function Gallery() {
  return (
    <div className="page-shell">
      <span className="eyebrow">ВИЗУАЛЬНЫЙ АРХИВ</span>
      <h1 className="page-title">Образы и документы</h1>
      <p className="page-intro">
        Портрет писателя, страница старого издания, театральное пространство и
        современная иллюстрация. Каждый экспонат имеет автора, источник и
        условия использования. Оригинальные генерации подписаны отдельно.
      </p>
      <div className="gallery-grid">
        {images.map((im) => (
          <figure key={im.id}>
            <SpoilerGate
              chapterId={im.id === "snegirev-scene" ? "4-6" : "preface"}
            >
              <div className="gallery-image">
                <Image
                  fill
                  sizes="(max-width:560px) 100vw, 45vw"
                  src={im.src}
                  alt={im.title}
                />
              </div>
            <figcaption>
              <span className="eyebrow" style={{ marginTop: 20 }}>
                {im.kind === "generated"
                  ? "СОВРЕМЕННАЯ ЦИФРОВАЯ ИЛЛЮСТРАЦИЯ"
                  : "ИЗ СОБРАНИЯ ИЗОБРАЖЕНИЙ"}
              </span>
              <h2>{im.title}</h2>
              <p>
                {im.author} · {im.date}
              </p>
              <p>{im.description}</p>
              <p>{im.license}</p>
              {im.sourceUrl && (
                <a href={im.sourceUrl} target="_blank" rel="noreferrer">
                  Карточка источника ↗
                </a>
              )}{" "}
              <a href={im.licenseUrl} target="_blank" rel="noreferrer">
                Условия использования ↗
              </a>
            </figcaption>
            </SpoilerGate>
          </figure>
        ))}
      </div>
      <p className="art-note">
        <Link href="/sources">
          Полный каталог источников и авторских прав →
        </Link>
      </p>
    </div>
  );
}
