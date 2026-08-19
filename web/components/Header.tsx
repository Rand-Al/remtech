import MobileNav from "@/components/MobileNav";

export default function Header({ home = false }: { home?: boolean }) {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="RemTech, головна">
        <span className="brand-mark" aria-hidden="true">R</span>
        <span>RemTech</span>
      </a>

      <nav className="desktop-nav" aria-label="Головна навігація">
        {home ? (
          <>
            <a href="#services">Послуги</a>
            <a href="#faq">FAQ</a>
            <a href="#contacts">Контакти</a>
          </>
        ) : (
          <>
            <a href="/">Головна</a>
            <a href="#directions">Напрями</a>
            <a href="/#faq">FAQ</a>
            <a href="/#contacts">Контакти</a>
          </>
        )}
      </nav>

      <div className="header-actions">
        <div className="language-switch" aria-label="Мова сайту">
          <button className="is-active" type="button" aria-current="true">UA</button>
        </div>
        <a className="phone-link" href="tel:+380000000000">+38 000 000 00 00</a>
        <button className="header-chat-button" type="button" data-open-chat>Написати менеджеру</button>
        <MobileNav home={home} />
      </div>
    </header>
  );
}