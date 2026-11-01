import type { Metadata } from "next";
import CollectionGallery from "@/components/collection-gallery";
export const metadata: Metadata = {
  title: "Коллекция — художественный и документальный архив",
  description:
    "Исторические документы, фотографии, художественные произведения и современные реконструкции. Источники и лицензии каждого экспоната.",
};
export default function Gallery() {
  return (
    <div className="page-shell">
      <span className="eyebrow">ИЗОБРАЖЕНИЯ / КАТАЛОГ</span>
      <h1 className="page-title">Коллекция</h1>
      <p className="page-intro">
        Архивные документы и современные реконструкции. Откройте экспонат, чтобы
        рассмотреть детали, источник и условия использования.
      </p>
      <CollectionGallery />
    </div>
  );
}
