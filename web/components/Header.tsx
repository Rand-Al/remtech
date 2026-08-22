import MobileNav from "@/components/MobileNav";
import LangSwitch from "@/components/LangSwitch";
import LangRedirect from "@/components/LangRedirect";
import { getContacts } from "@/lib/contacts";
import { phoneHrefFromPhone } from "@/shared/settings";

export type NavVariant = "home" | "kotly" | "service";
export type SiteLang = "uk" | "ru";

const TEXTS = {
  uk: {
    navAria: "Головна навігація",
    brand: "RemTech, головна",
    langAria: "Мова сайту",
    chat: "Написати менеджеру",
    home: { services: "Послуги", directions: "Напрями", contacts: "Контакти" },
  },
  ru: {
    navAria: "Главная навигация",
    brand: "RemTech, главная",
    langAria: "Язык сайта",
    chat: "Написать менеджеру",
    home: { services: "Услуги", directions: "Направления", contacts: "Контакты" },
  },
} as const;

export default async function Header({
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
  const contacts = await getContacts();
  const phoneHref = phoneHrefFromPhone(contacts.phone);

  return (
    <header className="site-header">
      <LangRedirect lang={lang} altLangHref={altLangHref} />
      <a className="brand" href={homePath} aria-label={t.brand}>
        <span className="brand-mark" aria-hidden="true">R</span>
        <span>RemTech</span>
      </a>

      <nav className="desktop-nav" aria-label={t.navAria}>
        {variant === "home" && (
          <>
            <a href="#services">{t.home.services}</a>
            <a href="#faq">FAQ</a>
            <a href="#contacts">{t.home.contacts}</a>
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
        <LangSwitch
          lang={lang}
          altLangHref={altLangHref}
          className="language-switch"
          ariaLabel={t.langAria}
        />
        <a className="phone-link" href={phoneHref}>{contacts.phone}</a>
        <button className="header-chat-button" type="button" data-open-chat>{t.chat}</button>
        <MobileNav variant={variant} lang={lang} phoneHref={phoneHref} />
      </div>
    </header>
  );
}
