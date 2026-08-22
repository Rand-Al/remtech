import type { NavVariant, SiteLang } from "@/components/Header";
import LangSwitch from "@/components/LangSwitch";
import { getContacts } from "@/lib/contacts";
import { phoneHrefFromPhone } from "@/shared/settings";

const TEXTS = {
  uk: {
    about: "Ремонт та обслуговування побутової техніки у Броварах і Броварському районі.",
    contactHeading: "Зв’язок",
    navAria: "Навігація у підвалі",
    navHeading: "Навігація",
    policy: "Політика конфіденційності",
    langAria: "Мова сайту",
    main: "Головна",
    services: "Послуги",
    directions: "Напрями",
    maintenance: "Обслуговування",
    contacts: "Контакти",
    brand: "RemTech, головна",
  },
  ru: {
    about: "Ремонт и обслуживание бытовой техники в Броварах и Броварском районе.",
    contactHeading: "Связь",
    navAria: "Навигация в подвале",
    navHeading: "Навигация",
    policy: "Политика конфиденциальности",
    langAria: "Язык сайта",
    main: "Главная",
    services: "Услуги",
    directions: "Направления",
    maintenance: "Обслуживание",
    contacts: "Контакты",
    brand: "RemTech, главная",
  },
} as const;

export default async function Footer({
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
  const policyHref = lang === "ru" ? "/ru/privacy/" : "/privacy/";
  const contacts = await getContacts();

  return (
    <footer className="site-footer service-page-footer">
      <div className="footer-brand">
        <a className="brand footer-logo" href={homePath} aria-label={t.brand}>
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>RemTech</span>
        </a>
        <p>{t.about}</p>
      </div>
      <div className="footer-contact">
        <p className="footer-heading">{t.contactHeading}</p>
        <a href={phoneHrefFromPhone(contacts.phone)}>{contacts.phone}</a>
        <a href={contacts.telegramUrl}>Telegram</a>
        <span>{lang === "ru" ? contacts.schedule.ru : contacts.schedule.uk}</span>
        <span>{lang === "ru" ? contacts.area.ru : contacts.area.uk}</span>
      </div>
      <nav className="footer-nav" aria-label={t.navAria}>
        <span className="footer-heading">{t.navHeading}</span>
        {variant !== "home" && <a href={homePath}>{t.main}</a>}
        {variant === "kotly" && (
          <>
            <a href="#directions">{t.directions}</a>
            <a href="#maintenance">{t.maintenance}</a>
          </>
        )}
        {variant !== "kotly" && (
          <a href={variant === "home" ? "#services" : `${homePath}#services`}>
            {t.services}
          </a>
        )}
        <a href={variant === "home" ? "#faq" : `${homePath}#faq`}>FAQ</a>
        <a href={variant === "home" ? "#contacts" : `${homePath}#contacts`}>
          {t.contacts}
        </a>
      </nav>
      <div className="footer-bottom">
        <p className="footer-note">© 2026 RemTech</p>
        <a className="footer-policy" href={policyHref}>{t.policy}</a>
        <LangSwitch
          lang={lang}
          altLangHref={altLangHref}
          className="footer-language"
          ariaLabel={t.langAria}
        />
      </div>
    </footer>
  );
}
