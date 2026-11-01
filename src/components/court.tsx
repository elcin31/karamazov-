"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowUpRight,
  Check,
  ChevronDown,
  Scale,
  ShieldCheck,
} from "lucide-react";
import chapters from "@/data/chapters.json";
import {
  courtEvidence,
  courtWitnesses,
  courtContradictions,
} from "@/data/court";
import {
  hydrateReader,
  updateReader,
  useReader,
  type CourtNotebook,
} from "@/lib/reader-store";
import "./court.css";
const orderById = new Map(chapters.map((c) => [c.id, c.order]));
const labels: Record<CourtNotebook["verdict"], string> = {
  undecided: "Пока воздерживаюсь",
  "not-proven": "Обвинение не доказано",
  guilty: "Доводы обвинения меня убедили",
  "not-guilty": "Считаю Дмитрия невиновным",
};
export function InteractiveCourt() {
  const reader = useReader();
  const [perspective, setPerspective] = useState<"court" | "reader">("court");
  const [category, setCategory] = useState("all");
  const [draft, setDraft] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    void hydrateReader();
  }, []);
  useEffect(() => {
    if (reader.hydrated) setDraft(reader.court.reasoning);
  }, [reader.hydrated, reader.court.reasoning]);
  const courtOrder = orderById.get("12-1") ?? Infinity;
  const locked = reader.spoilerFree && reader.maxOrder < courtOrder;
  const canRead = (ids: string[]) =>
    !reader.spoilerFree ||
    Math.max(...ids.map((id) => orderById.get(id) ?? Infinity)) <=
      reader.maxOrder;
  const evidence = courtEvidence.filter(
    (e) =>
      (perspective === "reader" || e.knownToCourt) &&
      (category === "all" || e.category === category),
  );
  const selected = courtEvidence.filter(
    (e) =>
      reader.court.evidenceIds.includes(e.id) &&
      canRead(e.chapterIds) &&
      (perspective === "reader" || e.knownToCourt),
  );
  function selectEvidence(id: string) {
    const ids = reader.court.evidenceIds.includes(id)
      ? reader.court.evidenceIds.filter((e) => e !== id)
      : [...reader.court.evidenceIds, id];
    updateReader({
      court: { ...reader.court, evidenceIds: ids, updatedAt: Date.now() },
    });
  }
  function save(verdict = reader.court.verdict) {
    updateReader({
      court: {
        ...reader.court,
        verdict,
        reasoning: draft.trim(),
        updatedAt: Date.now(),
      },
    });
    setMessage("Позиция сохранена в вашем браузере.");
  }
  if (locked)
    return (
      <div className="court-locked">
        <Scale size={43} strokeWidth={1} />
        <h2>Прежде чем открыть дело</h2>
        <p>
          Материалы процесса раскрывают ключевые события романа. В режиме без
          спойлеров этот зал откроется после начала книги XII. Вы можете
          продолжить чтение или осознанно открыть материалы сейчас.
        </p>
        <div>
          <Link href="/read/12-1">
            Перейти к книге XII <ArrowUpRight size={16} />
          </Link>
          <button
            type="button"
            disabled={!reader.hydrated}
            onClick={() => updateReader({ spoilerFree: false })}
          >
            Открыть дело со спойлерами
          </button>
        </div>
      </div>
    );
  return (
    <div className="court-workspace">
      <aside className="court-method">
        <ShieldCheck size={21} />
        <p>
          Это исследовательская реконструкция, а не новая версия романа и не
          юридическая консультация. Все свидетельства пересказаны своими
          словами; ссылки ведут к конкретным главам. Ваш вердикт сохраняет
          личную позицию и не изменяет фактов текста.
        </p>
      </aside>
      <div
        className="court-perspectives"
        role="group"
        aria-label="Доступ к сведениям"
      >
        <button
          type="button"
          className={perspective === "court" ? "active" : ""}
          aria-pressed={perspective === "court"}
          onClick={() => setPerspective("court")}
        >
          <span>01</span>Что слышит суд
          <small>Материалы и версии процесса</small>
        </button>
        <button
          type="button"
          className={perspective === "reader" ? "active" : ""}
          aria-pressed={perspective === "reader"}
          onClick={() => setPerspective("reader")}
        >
          <span>02</span>Что знает читатель
          <small>Также сцены за пределами суда</small>
        </button>
      </div>
      <p className="court-perspective-note">
        {perspective === "court"
          ? "В этом режиме не используются сцены, непосредственно не доступные присяжным. Сообщение Ивана в суде включено как его показание, а не как независимая запись разговора со Смердяковым."
          : "Добавлены сцены, показанные читателю вне процесса. Они помогают понять ошибку судебного рассказа, но не должны автоматически считаться доказательствами, исследованными присяжными."}
      </p>
      <div className="court-layout">
        <div className="court-case">
          <header className="court-heading">
            <span className="eyebrow">I. ПРЕДМЕТЫ И ПОКАЗАНИЯ</span>
            <h2>Исследуйте цепочку доводов</h2>
            <p>
              Выберите материалы для сопоставления. Читайте не только версию
              обвинения или защиты, но и границы каждого вывода.
            </p>
            <label>
              Раздел дела
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                aria-label="Категория материалов суда"
              >
                <option value="all">Все материалы</option>
                {["вещественное", "свидетельство", "документ", "версия"].map(
                  (c) => (
                    <option value={c} key={c}>
                      {c}
                    </option>
                  ),
                )}
              </select>
            </label>
          </header>
          <div className="court-evidence-list">
            {evidence.map((e, i) =>
              canRead(e.chapterIds) ? (
                <article className="court-evidence" key={e.id}>
                  <div className="evidence-label">
                    <span>
                      {String(i + 1).padStart(2, "0")} / {e.category}
                    </span>
                    {!e.knownToCourt && <strong>Только знание читателя</strong>}
                  </div>
                  <details>
                    <summary>
                      <h3>{e.title}</h3>
                      <ChevronDown size={20} />
                    </summary>
                    <p className="evidence-summary">{e.summary}</p>
                    <div className="evidence-arguments">
                      <section>
                        <h4>Логика обвинения</h4>
                        <p>{e.prosecution}</p>
                      </section>
                      <section>
                        <h4>Возражение защиты</h4>
                        <p>{e.defense}</p>
                      </section>
                    </div>
                    <div className="evidence-limit">
                      <h4>Граница вывода</h4>
                      <p>{e.limit}</p>
                    </div>
                    <div className="evidence-sources">
                      {e.chapterIds.map((id) => {
                        const c = chapters.find((c) => c.id === id);
                        return c ? (
                          <Link key={id} href={`/read/${id}`}>
                            {c.book}.{c.chapter} · {c.title} ↗
                          </Link>
                        ) : null;
                      })}
                    </div>
                  </details>
                  <label className="evidence-select">
                    <input
                      type="checkbox"
                      checked={reader.court.evidenceIds.includes(e.id)}
                      onChange={() => selectEvidence(e.id)}
                    />
                    В моём сопоставлении
                  </label>
                </article>
              ) : (
                <article key={e.id} className="court-evidence evidence-locked">
                  <p>
                    Материал из ещё не прочитанной главы скрыт. Продолжите
                    чтение или отключите защиту от спойлеров.
                  </p>
                </article>
              ),
            )}
          </div>
          <section className="court-witnesses">
            <span className="eyebrow">II. ЛЮДИ ПЕРЕД СУДОМ</span>
            <h2>Кто говорит — и откуда знает?</h2>
            {courtWitnesses
              .filter((w) => canRead([w.chapterId]))
              .map((w) => (
                <article key={w.id}>
                  <div>
                    <h3>{w.title}</h3>
                    <span>{w.position}</span>
                  </div>
                  <p>{w.text}</p>
                  <Link href={`/read/${w.chapterId}`}>
                    Прочитать показание в контексте ↗
                  </Link>
                </article>
              ))}
          </section>
          <section className="court-contradictions">
            <span className="eyebrow">III. ТОЧКИ НЕСОВПАДЕНИЯ</span>
            <h2>Проверьте собственную логику</h2>
            {courtContradictions
              .filter((c) =>
                c.evidenceIds.every((id) => {
                  const e = courtEvidence.find((e) => e.id === id);
                  return e && canRead(e.chapterIds);
                }),
              )
              .map((c) => (
                <details key={c.id}>
                  <summary>
                    {c.title}
                    <ChevronDown size={18} />
                  </summary>
                  <p>{c.text}</p>
                  <div>
                    {c.evidenceIds.map((id) => (
                      <span key={id}>
                        {courtEvidence.find((e) => e.id === id)?.title}
                      </span>
                    ))}
                  </div>
                </details>
              ))}
          </section>
        </div>
        <aside className="court-notebook">
          <span className="eyebrow">ВАША ИССЛЕДОВАТЕЛЬСКАЯ ТЕТРАДЬ</span>
          <h2>Сопоставление</h2>
          {selected.length ? (
            <div className="comparison-list">
              {selected.map((e) => (
                <section key={e.id}>
                  <header>
                    <h3>{e.title}</h3>
                    <button
                      type="button"
                      onClick={() => selectEvidence(e.id)}
                      aria-label={`Убрать из сопоставления: ${e.title}`}
                    >
                      ×
                    </button>
                  </header>
                  <p>{e.limit}</p>
                </section>
              ))}
            </div>
          ) : (
            <p className="court-empty">
              Отметьте хотя бы два материала: здесь будет видно, что именно
              каждый из них доказывает и чего не устанавливает.
            </p>
          )}
          <div className="court-verdict">
            <h3>Моя позиция</h3>
            <fieldset>
              <legend className="sr-only">Выберите личный вердикт</legend>
              {Object.entries(labels).map(([value, label]) => (
                <label key={value}>
                  <input
                    type="radio"
                    name="reader-verdict"
                    value={value}
                    checked={reader.court.verdict === value}
                    onChange={() => save(value as CourtNotebook["verdict"])}
                  />
                  <span>{label}</span>
                </label>
              ))}
            </fieldset>
            <label className="court-reason-label" htmlFor="court-reasoning">
              На каких доводах она основана?
            </label>
            <textarea
              id="court-reasoning"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setMessage("");
              }}
              placeholder="Разделите наблюдение, свидетельство и предположение…"
              rows={7}
              maxLength={12000}
            />
            <button className="court-save" type="button" onClick={() => save()}>
              <Check size={16} />
              Сохранить позицию
            </button>
            <p className="court-feedback" role="status">
              {message}
            </p>
            <p className="court-backup-note">
              Позиция и выбранные материалы входят в резервную копию
              читательского архива. Регистрация не нужна.
            </p>
          </div>
          {canRead(["12-14"]) && (
            <details className="canonical-verdict">
              <summary>
                Сопоставить с исходом романа
                <ChevronDown size={17} />
              </summary>
              <p>
                Присяжные признают Дмитрия виновным. Читатель знает о признании
                Смердякова и потому видит расхождение между фактически
                совершённым убийством и судебной версией. Нравственная
                ответственность Дмитрия не тождественна вине в отцеубийстве.
              </p>
              <Link href="/read/12-14">Книга XII, глава XIV ↗</Link>
            </details>
          )}
        </aside>
      </div>
    </div>
  );
}
