import type { Metadata } from "next";
import Link from "next/link";
import images from "@/data/images.json";
import { sources, editorialPolicy } from "@/data/sources";
export const metadata: Metadata = {
  title: "Источники, редакционная методика и авторские права",
};
export default function Sources() {
  return (
    <div className="page-shell">
      <span className="eyebrow">ОТКРЫТЫЙ РЕДАКЦИОННЫЙ АППАРАТ</span>
      <h1 className="page-title">
        Источники
        <br />и авторские права
      </h1>
      <p className="page-intro">
        Происхождение материала — часть музейного опыта. Здесь собраны текстовые
        источники, редакционные принципы и сведения о каждом из {images.length}{" "}
        визуальных материалов. У отдельных исследований есть собственные
        библиографические списки.
      </p>
      <div className="article-layout">
        <nav className="article-contents" aria-label="Источники: содержание">
          <span>ПРОИСХОЖДЕНИЕ МАТЕРИАЛОВ</span>
          <a href="#text">Текст и издание</a>
          <a href="#method">Редакционная методика</a>
          <a href="#visual">Изображения и лицензии</a>
          <a href="#fonts">Шрифты</a>
          <a href="#privacy">Читательские данные</a>
        </nav>
        <article className="article-body prose">
          <section id="text">
            <h2>Текст и исследовательские источники</h2>
            {sources.map((s) => (
              <section className="source-record" key={s.id}>
                <span className="kind-label">
                  {s.type === "primary"
                    ? "Первичный источник"
                    : s.type === "research"
                      ? "Исследование"
                      : "Музейный источник"}
                </span>
                <h3>{s.title}</h3>
                <p>{s.note}</p>
                <a href={s.url} target="_blank" rel="noreferrer">
                  Открыть источник ↗
                </a>
              </section>
            ))}
            <p>
              <a href="/text/provenance.json">
                Машиночитаемый журнал происхождения текста и SHA-256 исходных
                страниц
              </a>
            </p>
          </section>
          <section id="method">
            <h2>Редакционные принципы</h2>
            {editorialPolicy.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
          <section id="visual">
            <h2>Каталог прав на изображения</h2>
            <p>
              Работы Глазунова и Алексеева исследованы, но не воспроизводятся
              без подходящего разрешения. У каждого материала ниже указан
              собственный правовой режим. Лицензия CC BY-SA на отдельную
              иллюстрацию не становится лицензией всего сайта.
            </p>
            {images.map((a) => (
              <section className="source-record" key={a.id}>
                <span className="kind-label">
                  {a.kind === "generated"
                    ? "Современная генеративная реконструкция"
                    : "Материал из внешнего источника"}
                </span>
                <h3>{a.title}</h3>
                <p>
                  {a.author} · {a.date}
                </p>
                <p>{a.description}</p>
                <p className="source-license">
                  {a.license} · Веб-копия {a.width} × {a.height}
                </p>
                <div className="article-tools">
                  {a.sourceUrl && (
                    <a href={a.sourceUrl} target="_blank" rel="noreferrer">
                      Источник ↗
                    </a>
                  )}
                  <a href={a.licenseUrl} target="_blank" rel="noreferrer">
                    Условия использования ↗
                  </a>
                  <Link href={`/gallery?image=${a.id}`}>
                    Рассмотреть экспонат ↗
                  </Link>
                </div>
              </section>
            ))}
          </section>
          <section id="fonts">
            <h2>Кириллическая типографика</h2>
            <p>
              Cormorant Garamond — Christian Thalmann; Literata — TypeTogether;
              Golos Text — Paratype. Все три семейства содержат кириллицу и
              распространяются по SIL Open Font License 1.1. Шрифты загружаются
              с этого сайта в WOFF2. Лицензии находятся рядом с файлами в
              репозитории.
            </p>
          </section>
          <section id="privacy">
            <h2>Личные данные читателя</h2>
            <p>
              Обязательной регистрации нет. IndexedDB вашего браузера хранит
              заметки, закладки, историю, избранное, настройки и позицию чтения.
              Они не отправляются на сервер и не синхронизируются между
              устройствами автоматически. В архиве можно скачать резервную копию
              и объединить её с записями на другом устройстве.
            </p>
            <Link href="/cabinet" className="text-link">
              Открыть читательский архив ↗
            </Link>
          </section>
        </article>
      </div>
    </div>
  );
}
