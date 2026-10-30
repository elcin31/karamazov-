"use client";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="not-found">
      <span className="eyebrow">НЕ УДАЛОСЬ ОТКРЫТЬ ЗАЛ</span>
      <h1>Попробуем ещё раз.</h1>
      <p>
        Произошла ошибка загрузки. Ваши локальные заметки остаются в браузере.
      </p>
      <button className="button button-burgundy" onClick={reset}>
        Повторить загрузку
      </button>
    </section>
  );
}
