import Link from "next/link";
import MobileNav from "@/components/MobileNav";

export type NavVariant = "home" | "kotly" | "service";
export type SiteLang = "uk" | "ru";

const TEXTS = {
  uk: {
    navAria: "Головна навігація",
    brand: "RemTech, головна",
    langAria: "Мова сайту",
    chat: "Написати менеджеру",
    home: { services: "Послуги", directions: "Напрями" },
  },
  ru: {
    navAria: "Главная навигация",
    brand: "RemTech, главная",
    langAria: "Язык сайта",
    chat: "Написать менеджеру",
    home: { services: "Услуги", directions: "Направления" },
  },
} as const;

export default function Header({
  variant = "service",
  lang = "uk",
  altLangHref,
}: {
  variant?: NavVariant;
  lang?: SiteLang;
  altLangHref?: string;
}) {
  const t = TEXTS[lang];
  const homePath = lang === "ru" ? "/ru/" : "/";
  const faqHref = variant === "home" ? "#faq" : `${homePath}#faq`;
  const contactsHref = variant === "home" ? "#contacts" : `${homePath}#contacts`;

  return (
    <header className="site-header">
      <a className="brand" href={homePath} aria-label={t.brand}>
        <span className="brand-mark" aria-hidden="true">R</span>
        <span>RemTech</span>
      </a>

      <nav className="desktop-nav" aria-label={t.navAria}>
        {variant === "home" && (
          <>
            <a href="#services">{t.home.services}</a>
            <a href="#faq">FAQ</a>
            <a href="#contacts">Контакти</a>
          </>
        )}
        {variant === "kotly" && (
          <>
            <a href={homePath}>{lang === "ru" ? "Главная" : "Головна"}</a>
            <a href="#directions">{t.home.directions}</a>
            <a href={faqHref}>FAQ</a>
            <a href={contactsHref}>{lang === "ru" ? "Контакты" : "Контакти"}</a>
          </>
        )}
        {variant === "service" && (
          <>
            <a href={homePath}>{lang === "ru" ? "Главная" : "Головна"}</a>
            <a href={`${homePath}#services`}>{t.home.services}</a>
            <a href={faqHref}>FAQ</a>
            <a href={contactsHref}>{lang === "ru" ? "Контакты" : "Контакти"}</a>
          </>
        )}
      </nav>

      <div className="header-actions">
        <div className="language-switch" aria-label={t.langAria}>
          {lang === "ru" && altLangHref && (
            <Link href={altLangHref} scroll={false}>UA</Link>
          )}
          <button className="is-active" type="button" aria-current="true">
            {lang === "ru" ? "RU" : "UA"}
          </button>
          {lang === "uk" && altLangHref && (
            <Link href={altLangHref} scroll={false}>RU</Link>
          )}
        </div>
        <a className="phone-link" href="tel:+380000000000">+38 000 000 00 00</a>
        <button className="header-chat-button" type="button" data-open-chat>{t.chat}</button>
        <MobileNav variant={variant} lang={lang} />
      </div>
    </header>
  );
}
