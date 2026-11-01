import type { Metadata, Viewport } from "next";
import "./fonts.css";
import "./globals.css";
import { Header, Footer } from "@/components/shell";
export const metadata: Metadata = {
  metadataBase: new URL("https://karamazov-eight.vercel.app"),
  title: {
    default: "КАРАМАЗОВ — цифровой литературный музей",
    template: "%s · КАРАМАЗОВ",
  },
  description:
    "«Братья Карамазовы» Ф. М. Достоевского: полный текст, энциклопедия героев, философский атлас и интерактивные маршруты чтения.",
  applicationName: "КАРАМАЗОВ",
  openGraph: {
    type: "website",
    locale: "ru_RU",
    title: "КАРАМАЗОВ — цифровой литературный музей",
    description:
      "Полный текст, архивная коллекция и исследовательские маршруты.",
  },
  robots: { index: true, follow: true },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f4f1e9",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" data-scroll-behavior="smooth">
      <head>
        <link
          rel="preload"
          href="/fonts/cormorant-500.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href="/fonts/golos-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
