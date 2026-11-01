import Link from "next/link";
import { Artwork, SectionHeading } from "@/components/editorial";
import { Portrait } from "@/components/portrait";
import { characters } from "@/data/museum";
export default function Home() {
  return (
    <div className="museum-home">
      <section className="editorial-hero">
        <div className="hero-copy">
          <span className="eyebrow">Ф. М. ДОСТОЕВСКИЙ · 1879—1880</span>
          <h1>
            Братья
            <br />
            <em>Карамазовы</em>
          </h1>
          <p className="hero-dek">
            Семейная хроника.
            <br />
            Философский спор.
            <br />
            История преступления.
          </p>
          <p className="hero-description">
            Литературный музей последнего романа Достоевского. Полный текст,
            архивные документы и исследования помогают увидеть, как частная
            история семьи становится разговором о свободе, вере и
            ответственности.
          </p>
          <div className="hero-actions">
            <Link href="/read" className="button button-wine" prefetch={false}>
              Читать роман <span>↗</span>
            </Link>
            <Link href="/guide" className="underlined-link" prefetch={false}>
              Путеводитель по книгам
            </Link>
          </div>
          <div className="hero-edition">
            <span>
              Четыре части
              <br />
              Двенадцать книг и эпилог
            </span>
            <span>
              Полный русский текст
              <br />
              Без регистрации
            </span>
          </div>
        </div>
        <div className="hero-art">
          <Artwork id="dostoevsky" priority />
          <span className="hero-folio" aria-hidden="true">
            I
          </span>
        </div>
      </section>
      <section className="issue-note">
        <span className="eyebrow">КАК ПОЛЬЗОВАТЬСЯ МУЗЕЕМ</span>
        <p>
          Начните с текста — или с вопроса. Страницы героев связаны с главами,
          событиями и исследованиями. Режим без спойлеров сохраняет
          неизвестность; читательский архив собирает ваши заметки.
        </p>
        <Link href="/routes" className="text-link">
          Выбрать маршрут ↗
        </Link>
      </section>
      <section className="home-reading">
        <SectionHeading
          number="01"
          title="Роман, книга за книгой"
          href="/guide"
          label="Полный путеводитель"
        />
        <div className="reading-spread">
          <div className="edition-image">
            <Artwork id="first-edition" />
          </div>
          <div className="reading-editorial">
            <span className="eyebrow">
              ЧИТАТЬ · СОПОСТАВЛЯТЬ · ВОЗВРАЩАТЬСЯ
            </span>
            <h2>
              Войти в историю
              <br />
              одной семейки
            </h2>
            <p>
              Предисловие обещает жизнеописание Алёши. Но читатель сначала
              знакомится с отцом и братьями — с семейной историей, в которой
              забота о ребёнке всякий раз оказывается чьим-то чужим делом.
            </p>
            <p>
              Путеводитель отделяет события от их толкований. Каждая книга
              сопровождается разбором, а каждая глава — вопросами для
              внимательного чтения.
            </p>
            <div className="reading-links">
              <Link href="/read/preface" prefetch={false}>
                От автора <span>Оригинальный текст ↗</span>
              </Link>
              <Link href="/guide/1" prefetch={false}>
                История одной семейки <span>Книга первая · путеводитель ↗</span>
              </Link>
              <Link href="/chapters/5-5" prefetch={false}>
                Великий инквизитор{" "}
                <span>Текст и исследовательский комментарий ↗</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
      <section className="home-dossier">
        <div className="dossier-image">
          <Portrait id="ivan" name="Иван Карамазов" />
          <p className="art-note">
            Иван Карамазов. Современная цифровая иллюстрация; художественная
            интерпретация.
          </p>
        </div>
        <div className="dossier-copy">
          <span className="eyebrow">
            В ЦЕНТРЕ ВНИМАНИЯ · ИССЛЕДОВАТЕЛЬСКОЕ ДОСЬЕ
          </span>
          <h2>
            Иван.
            <br />
            Право не согласиться
          </h2>
          <p className="large-serif">
            Что именно Иван отказывается принять — Бога, устройство мира или
            цену будущей гармонии?
          </p>
          <p>
            Его разговор с Алёшей нельзя свести к формуле неверия. «Бунт» ставит
            вопрос о страдании детей, а поэма об инквизиторе меняет саму
            плоскость спора: способен ли человек вынести свободу?
          </p>
          <Link
            href="/characters/ivan"
            className="underlined-link"
            prefetch={false}
          >
            Читать досье Ивана
          </Link>
          <div className="dossier-related">
            <Link href="/philosophy/rebellion" prefetch={false}>
              Бунт Ивана ↗
            </Link>
            <Link href="/philosophy/inquisitor" prefetch={false}>
              Великий инквизитор ↗
            </Link>
          </div>
        </div>
      </section>
      <section className="home-people">
        <SectionHeading
          number="02"
          title="Лица и отношения"
          href="/characters"
          label="Энциклопедия героев"
        />
        <div className="people-intro">
          <p>
            От Карамазовых до семьи Снегирёвых, от монастыря до зала суда.
            Большие и малые роли складываются в мир, где ни один человек не
            исчерпывается чужим приговором.
          </p>
          <Link className="text-link" href="/map">
            Исследовать карту связей ↗
          </Link>
        </div>
        <div className="people-roster">
          {characters.slice(0, 12).map((c, i) => (
            <Link href={`/characters/${c.id}`} key={c.id} prefetch={false}>
              <span className="roster-number">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span>{c.shortName}</span>
              <small>{c.epithet}</small>
              <b aria-hidden="true">↗</b>
            </Link>
          ))}
        </div>
      </section>
      <section className="home-studies">
        <SectionHeading
          number="03"
          title="Не один ответ"
          href="/philosophy"
          label="Все исследования"
        />
        <div className="study-frontpage">
          <article>
            <span className="eyebrow">ФИЛОСОФИЯ</span>
            <h3>
              <Link href="/philosophy/innocence" prefetch={false}>
                Можно ли оправдать страдание ребёнка?
              </Link>
            </h3>
            <p>
              Не отвлечённая задача о происхождении зла, а вопрос, на который
              Иван требует личного ответа.
            </p>
            <Link href="/philosophy/innocence" className="text-link">
              Страдание детей ↗
            </Link>
          </article>
          <article>
            <span className="eyebrow">ЭТИКА</span>
            <h3>
              <Link href="/philosophy/money" prefetch={false}>
                Три тысячи рублей — и цена достоинства
              </Link>
            </h3>
            <p>
              Долг, наследство, милостыня и подкуп: деньги связывают сюжет с
              нравственными отношениями.
            </p>
            <Link href="/philosophy/money" className="text-link">
              Деньги и нравственность ↗
            </Link>
          </article>
          <article>
            <span className="eyebrow">ПРАВО</span>
            <h3>
              <Link href="/court" prefetch={false}>
                Убедительный рассказ ещё не доказательство
              </Link>
            </h3>
            <p>
              Сопоставьте улики, свидетельства и версии. Отделите знания суда от
              того, что доступно читателю.
            </p>
            <Link href="/court" className="text-link">
              Войти в судебный зал ↗
            </Link>
          </article>
        </div>
      </section>
      <section className="home-archive">
        <div>
          <span className="eyebrow">КОЛЛЕКЦИЯ</span>
          <h2>
            Свидетельства
            <br />
            времени.
          </h2>
          <p>
            Портреты, страницы изданий, письма и исторические виды. Архивный
            документ и современная реконструкция имеют разные задачи — и всегда
            обозначены отдельно.
          </p>
          <Link href="/gallery" className="underlined-link" prefetch={false}>
            Открыть художественный архив
          </Link>
          <Link href="/context" className="text-link">
            Достоевский и история романа ↗
          </Link>
        </div>
        <Artwork id="theatre-1922" />
      </section>
      <section className="home-final">
        <span className="eyebrow">ЛИЧНЫЙ ЧИТАТЕЛЬСКИЙ АРХИВ</span>
        <h2>
          Оставить место
          <br />
          для собственной мысли.
        </h2>
        <p>
          Закладки, избранные цитаты, сохранённые исследования и заметки — на
          вашем устройстве. Без обязательной регистрации.
        </p>
        <Link href="/cabinet" className="button button-wine" prefetch={false}>
          Открыть архив ↗
        </Link>
      </section>
    </div>
  );
}
