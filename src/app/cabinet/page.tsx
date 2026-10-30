import type { Metadata } from "next";
import { Cabinet } from "@/components/explore";
export const metadata: Metadata = {
  title: "Кабинет читателя — Братья Карамазовы",
  description:
    "Личные заметки, закладки и прогресс чтения. Локальное хранение без регистрации.",
};
export default function CabinetPage() {
  return (
    <section className="page-shell">
      <span className="eyebrow">ВАШЕ ПРОСТРАНСТВО В МУЗЕЕ</span>
      <h1 className="page-title">Кабинет читателя</h1>
      <p className="page-intro">
        Книга становится своей, когда на её полях появляются ваши мысли.
      </p>
      <Cabinet />
    </section>
  );
}
