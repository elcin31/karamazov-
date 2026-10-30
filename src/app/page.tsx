import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  BookOpen,
  Network,
  Clock3,
  Quote,
  ChevronDown,
} from "lucide-react";
import { Reveal } from "@/components/motion-reveal";
import { characters } from "@/data/museum";
import { Portrait } from "@/components/portrait";
import quotes from "@/data/quotes.json";
const homeQuote = quotes.find(q => q.id === "battle")!;
export default function Home() {
  return (
    <div className="home">
      <section className="hero">
        <Image
          src="/images/hero.webp"
          alt="Авторская композиция: Карамазовы в сумеречном монастырском дворе"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="hero-image"
        />
        <div className="hero-shade" />
        <div className="hero-content">
          <span className="eyebrow hero-eyebrow">
            <span /> РОМАН О ЧЕЛОВЕКЕ. МУЗЕЙ О КАЖДОМ ИЗ НАС.
          </span>
          <p className="hero-author">Фёдор Михайлович Достоевский</p>
          <h1>
            БРАТЬЯ
            <br />
            КАРАМАЗОВЫ<span className="title-dot">.</span>
          </h1>
          <p className="hero-description">
            Вера и сомнение. Любовь и вина. Свобода и выбор.
            <br className="desktop-break" /> Войдите в мир романа, в котором
            вечные вопросы
            <br className="desktop-break" /> обретают человеческие лица.
          </p>
          <div className="hero-actions">
            <Link prefetch={false} className="button button-burgundy" href="#explore">
              Исследовать роман <ArrowUpRight size={17} />
            </Link>
            <Link prefetch={false} className="button button-glass" href="/read">
              <BookOpen size={17} /> Начать чтение
            </Link>
          </div>
        </div>
        <div className="hero-bottom">
          <span>
            1879–1880 <i /> ПОСЛЕДНИЙ РОМАН ДОСТОЕВСКОГО
          </span>
          <a href="#explore" aria-label="Перейти к разделам музея">
            <ChevronDown size={18} /> ПРОДОЛЖИТЬ ПУТЕШЕСТВИЕ
          </a>
          <span className="hero-art-label">
            Современная цифровая иллюстрация
          </span>
        </div>
      </section>
      <section className="home-intro">
        <span className="eyebrow">
          НЕ ПРОСТО ПРОЧИТАТЬ. ПОЧУВСТВОВАТЬ И ПОНЯТЬ.
        </span>
        <h2>
          Один роман. <em>Бесконечность вопросов.</em>
        </h2>
        <p>
          Семейная драма, судебная история, философский спор — и удивительно
          точный портрет человека.
          <br />
          Этот музей — пространство для медленного чтения, открытий и
          собственного взгляда.
        </p>
      </section>
      <section className="home-section" id="explore">
        <div className="section-heading">
          <div>
            <span className="eyebrow">01 / ПРОСТРАНСТВО РОМАНА</span>
            <h2>Выберите свой путь</h2>
          </div>
          <span className="section-aside">
            Нет единственного способа понять Достоевского
          </span>
        </div>
        <div className="path-grid">
          <Link prefetch={false} href="/read" className="path-feature">
            <Image
              src="/images/first-edition.webp"
              alt="Факсимиле журнальной публикации романа"
              fill
              sizes="(max-width:700px) 100vw, 40vw"
            />
            <div className="path-overlay" />
            <div className="path-content">
              <span className="eyebrow">ПОЛНЫЙ ТЕКСТ · 12 КНИГ И ЭПИЛОГ</span>
              <h3>
                Наедине
                <br />с Достоевским
              </h3>
              <p>
                Читайте в своём ритме.
                <br />
                Сохраняйте мысли на полях.
              </p>
              <span className="text-link">
                Открыть роман <ArrowUpRight size={19} />
              </span>
            </div>
          </Link>
          <div className="path-list">
            {[
              {
                href: "/characters",
                n: "I",
                title: "Лица и судьбы",
                text: "Двенадцать героев. Противоречия, страсти и связи.",
                label: "Энциклопедия персонажей",
              },
              {
                href: "/philosophy",
                n: "II",
                title: "Вопросы без простых ответов",
                text: "Восемь философских тем — от веры до свободы.",
                label: "Философский атлас",
              },
              {
                href: "/context",
                n: "III",
                title: "Время, ставшее романом",
                text: "Россия XIX века, замысел и история последней книги.",
                label: "История и контекст",
              },
            ].map((x) => (
              <Link prefetch={false} className="path-row" href={x.href} key={x.href}>
                <span className="path-number">{x.n}</span>
                <div>
                  <span className="eyebrow">{x.label}</span>
                  <h3>{x.title}</h3>
                  <p>{x.text}</p>
                </div>
                <ArrowUpRight size={24} />
              </Link>
            ))}
          </div>
        </div>
      </section>
      <section className="home-section characters-home">
        <div className="section-heading">
          <div>
            <span className="eyebrow">02 / ЧЕЛОВЕК — ЭТО ТАЙНА</span>
            <h2>Четыре Карамазова</h2>
          </div>
          <Link prefetch={false} className="text-link" href="/characters">
            Все персонажи <ArrowRight size={17} />
          </Link>
        </div>
        <Reveal className="brothers-grid">
          {characters.slice(0, 4).map((c, i) => (
            <Link prefetch={false}
              key={c.id}
              href={`/characters/${c.id}`}
              className="brother-card"
            >
              <div className="portrait-wrap">
                <Portrait id={c.id} name={c.name} />
                <span className="portrait-number">0{i + 1}</span>
                <ArrowUpRight className="portrait-arrow" size={20} />
              </div>
              <span className="eyebrow">{c.epithet}</span>
              <h3>{c.shortName}</h3>
              <p>{c.intro}</p>
            </Link>
          ))}
        </Reveal>
      </section>
      <section className="home-quote">
        <span className="eyebrow">
          КНИГА III, ГЛАВА III · «ИСПОВЕДЬ ГОРЯЧЕГО СЕРДЦА. В СТИХАХ»
        </span>
        <blockquote>«{homeQuote.text}»</blockquote>
        <p>Дмитрий Карамазов</p>
        <Link prefetch={false} href="/quotes" className="text-link">
          Исследовать атлас цитат <ArrowUpRight size={17} />
        </Link>
      </section>
      <section className="home-section">
        <div className="section-heading">
          <div>
            <span className="eyebrow">03 / ИНСТРУМЕНТЫ ИССЛЕДОВАТЕЛЯ</span>
            <h2>Увидеть больше, чем сюжет</h2>
          </div>
        </div>
        <div className="tool-grid">
          {[
            {
              href: "/map",
              icon: Network,
              n: "01",
              title: "Всё связано",
              text: "Карта отношений: от родства до духовного влияния.",
            },
            {
              href: "/timeline",
              icon: Clock3,
              n: "02",
              title: "Нить событий",
              text: "Хронология романа с переходами к ключевым главам.",
            },
            {
              href: "/quotes",
              icon: Quote,
              n: "03",
              title: "Голоса романа",
              text: "Проверенные цитаты, темы и контекст каждого слова.",
            },
          ].map((x) => (
            <Link prefetch={false} href={x.href} className="tool-card" key={x.href}>
              <div>
                <x.icon size={28} strokeWidth={1} />
                <span>{x.n}</span>
              </div>
              <h3>{x.title}</h3>
              <p>{x.text}</p>
              <ArrowUpRight size={20} />
            </Link>
          ))}
        </div>
      </section>
      <section className="author-section">
        <div className="author-image">
          <Image
            src="/images/dostoevsky.webp"
            alt="Ф. М. Достоевский. Портрет работы В. Г. Перова, 1872"
            fill
            sizes="(max-width:700px) 100vw, 40vw"
          />
        </div>
        <div className="author-copy">
          <span className="eyebrow">ЗА СТРАНИЦАМИ РОМАНА</span>
          <h2>
            Последняя книга.
            <br />
            <em>Главные вопросы.</em>
          </h2>
          <p>
            Достоевский писал «Братьев Карамазовых» в 1878–1880 годах. В
            последнем завершённом романе сошлись его размышления о вере,
            человеческой свободе и ответственности перед другим.
          </p>
          <p>
            Рукопись стала итогом жизни. Разговор, начатый на её страницах,
            продолжается.
          </p>
          <Link prefetch={false} className="text-link" href="/context">
            О писателе и его времени <ArrowRight size={18} />
          </Link>
          <small>
            В. Г. Перов. Портрет Ф. М. Достоевского, 1872.
            <br />
            Государственная Третьяковская галерея · Общественное достояние
          </small>
        </div>
      </section>
      <section className="reading-invitation">
        <span className="eyebrow">ВАША ИСТОРИЯ ЧТЕНИЯ НАЧИНАЕТСЯ ЗДЕСЬ</span>
        <h2>Откройте первую страницу.</h2>
        <p>Без регистрации. В своём темпе. С правом на собственный ответ.</p>
        <Link prefetch={false} href="/read" className="button button-burgundy">
          Начать чтение <ArrowUpRight size={17} />
        </Link>
      </section>
    </div>
  );
}
