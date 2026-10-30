import Link from "next/link";
export default function NotFound() {
  return (
    <section className="not-found">
      <span className="eyebrow">404 · СТРАНИЦА НЕ НАЙДЕНА</span>
      <h1>Здесь ещё нет страницы.</h1>
      <p>Вернитесь к оглавлению музея или откройте роман.</p>
      <Link href="/" className="button button-burgundy">
        В музей ↗
      </Link>
    </section>
  );
}
