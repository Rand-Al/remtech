"use client";

import Link from "next/link";
import type { SiteLang } from "@/components/Header";

const LANG_CHOICE_KEY = "remtech-lang-choice";

export default function LangSwitch({
  lang,
  altLangHref,
  className,
  ariaLabel,
}: {
  lang: SiteLang;
  altLangHref?: string;
  className: string;
  ariaLabel: string;
}) {
  const rememberChoice = () => {
    try {
      window.localStorage.setItem(LANG_CHOICE_KEY, lang === "uk" ? "ru" : "uk");
    } catch {
      // без localStorage выбор языка просто не запомнится
    }
  };

  return (
    <div className={className} aria-label={ariaLabel}>
      {lang === "ru" && altLangHref && (
        <Link href={altLangHref} scroll={false} onClick={rememberChoice}>UA</Link>
      )}
      <button className="is-active" type="button" aria-current="true">
        {lang === "ru" ? "RU" : "UA"}
      </button>
      {lang === "uk" && altLangHref && (
        <Link href={altLangHref} scroll={false} onClick={rememberChoice}>RU</Link>
      )}
    </div>
  );
}
