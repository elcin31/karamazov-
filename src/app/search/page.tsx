import type { Metadata } from "next";
import { SiteSearch } from "@/components/site-search";
import { getSearchIndex } from "@/lib/search-index";
export const metadata: Metadata = {
  title: "Поиск по литературному музею",
  description:
    "Единый поиск по роману, персонажам, исследованиям, событиям и музейной коллекции.",
};
export default async function SearchPage() {
  return (
    <section className="page-shell">
      <span className="eyebrow">ПОИСК ПО МУЗЕЮ</span>
      <h1 className="page-title">Найти свою нить</h1>
      <p className="page-intro">
        От одного слова — к главе, исследованию, человеку или архивному
        документу.
      </p>
      <SiteSearch items={await getSearchIndex()} />
    </section>
  );
}
