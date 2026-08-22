"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { SiteLang } from "@/components/Header";

const LANG_CHOICE_KEY = "remtech-lang-choice";

// При первом визите без сохранённого выбора язык страницы
// подбирается по языку браузера (как в утверждённом прототипе)
export default function LangRedirect({
  lang,
  altLangHref,
}: {
  lang: SiteLang;
  altLangHref?: string;
}) {
  const router = useRouter();

  useEffect(() => {
    if (!altLangHref) return;
    try {
      if (window.localStorage.getItem(LANG_CHOICE_KEY)) return;
      const language =
        navigator.language ?? navigator.languages?.[0] ?? "";
      const detected = String(language).toLowerCase().startsWith("ru") ? "ru" : "uk";
      if (detected !== lang) router.replace(altLangHref);
    } catch {
      // без localStorage определение языка пропускаем
    }
  }, [lang, altLangHref, router]);

  return null;
}
