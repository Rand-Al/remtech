import type { NavVariant, SiteLang } from "@/components/Header";

const TEXTS = {
  uk: {
    about: "Ремонт та обслуговування побутової техніки у Броварах і Броварському районі.",
    contactHeading: "Зв’язок",
    schedule: "Щодня, 10:00–18:00",
    area: "Бровари та Броварський район",
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
    schedule: "Ежедневно, 10:00–18:00",
    area: "Бровары и Броварский район",
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

export default function Footer({
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
        <a href="tel:+380000000000">+38 000 000 00 00</a>
        <a href="https://t.me/example">Telegram</a>
        <span>{t.schedule}</span>
        <span>{t.area}</span>
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
        <div className="footer-language" aria-label={t.langAria}>
          {lang === "ru" && altLangHref && <a href={altLangHref}>UA</a>}
          <button className="is-active" type="button" aria-current="true">
            {lang === "ru" ? "RU" : "UA"}
          </button>
          {lang === "uk" && altLangHref && <a href={altLangHref}>RU</a>}
        </div>
      </div>
    </footer>
  );
}
