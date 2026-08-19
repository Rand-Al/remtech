import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RemTech — ремонт побутової техніки у Броварах",
  description:
    "Ремонт та обслуговування котлів у Броварах та Броварському районі з виїздом майстра.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uk">
      <body data-theme="orange">{children}</body>
    </html>
  );
}