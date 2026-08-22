type NavVariant = "home" | "kotly" | "service";

export default function Footer({ variant = "service" }: { variant?: NavVariant }) {
  return (
    <footer className="site-footer service-page-footer">
      <div className="footer-brand">
        <a className="brand footer-logo" href="/" aria-label="RemTech, головна">
          <span className="brand-mark" aria-hidden="true">R</span>
          <span>RemTech</span>
        </a>
        <p>Ремонт та обслуговування побутової техніки у Броварах і Броварському районі.</p>
      </div>
      <div className="footer-contact">
        <p className="footer-heading">Зв’язок</p>
        <a href="tel:+380000000000">+38 000 000 00 00</a>
        <a href="https://t.me/example">Telegram</a>
        <span>Щодня, 10:00–18:00</span>
        <span>Бровари та Броварський район</span>
      </div>
      <nav className="footer-nav" aria-label="Навігація у підвалі">
        <span className="footer-heading">Навігація</span>
        {variant === "home" && (
          <>
            <a href="#services">Послуги</a>
            <a href="#faq">FAQ</a>
            <a href="#contacts">Контакти</a>
          </>
        )}
        {variant === "kotly" && (
          <>
            <a href="/">Головна</a>
            <a href="#directions">Напрями</a>
            <a href="#maintenance">Обслуговування</a>
            <a href="/#faq">FAQ</a>
            <a href="/#contacts">Контакти</a>
          </>
        )}
        {variant === "service" && (
          <>
            <a href="/">Головна</a>
            <a href="/#services">Послуги</a>
            <a href="/#faq">FAQ</a>
            <a href="/#contacts">Контакти</a>
          </>
        )}
      </nav>
      <div className="footer-bottom">
        <p className="footer-note">© 2026 RemTech</p>
        <a className="footer-policy" href="/privacy/">Політика конфіденційності</a>
        <div className="footer-language" aria-label="Мова сайту">
          <button className="is-active" type="button" aria-current="true">UA</button>
        </div>
      </div>
    </footer>
  );
}
