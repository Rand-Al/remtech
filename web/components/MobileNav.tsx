"use client";

import { useEffect, useRef, useState } from "react";
import type { NavVariant, SiteLang } from "@/components/Header";

const TEXTS = {
  uk: {
    navAria: "Мобільна навігація",
    menuAria: "Відкрити меню",
    menuTitle: "Меню",
    main: "Головна",
    services: "Послуги",
    directions: "Напрями",
    contacts: "Контакти",
    call: "Зателефонувати",
    chat: "Написати менеджеру",
  },
  ru: {
    navAria: "Мобильная навигация",
    menuAria: "Открыть меню",
    menuTitle: "Меню",
    main: "Главная",
    services: "Услуги",
    directions: "Направления",
    contacts: "Контакты",
    call: "Позвонить",
    chat: "Написать менеджеру",
  },
} as const;

export default function MobileNav({
  variant = "service",
  lang = "uk",
}: {
  variant?: NavVariant;
  lang?: SiteLang;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const t = TEXTS[lang];
  const homePath = lang === "ru" ? "/ru/" : "/";

  const close = () => setIsOpen(false);

  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    if (isOpen) {
      nav.hidden = false;
      requestAnimationFrame(() => nav.classList.add("is-open"));
    } else {
      nav.classList.remove("is-open");
      const timer = setTimeout(() => {
        nav.hidden = true;
      }, 220);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (isOpen && !target.closest(".mobile-nav") && !target.closest(".menu-button")) {
        setIsOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
    };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  return (
    <>
      <button
        className="menu-button"
        type="button"
        aria-label={t.menuAria}
        aria-controls="mobile-menu"
        aria-expanded={isOpen}
        title={t.menuTitle}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span></span><span></span><span></span>
      </button>

      <nav
        ref={navRef}
        className="mobile-nav"
        id="mobile-menu"
        aria-label={t.navAria}
        aria-hidden={!isOpen}
        inert={!isOpen}
        hidden
      >
        {variant !== "home" && (
          <a href={homePath} onClick={close}>{t.main}</a>
        )}
        {variant === "kotly" ? (
          <a href="#directions" onClick={close}>{t.directions}</a>
        ) : (
          <a href={variant === "home" ? "#services" : `${homePath}#services`} onClick={close}>
            {t.services}
          </a>
        )}
        <a href={variant === "home" ? "#faq" : `${homePath}#faq`} onClick={close}>FAQ</a>
        <a href={variant === "home" ? "#contacts" : `${homePath}#contacts`} onClick={close}>
          {t.contacts}
        </a>
        <a href="tel:+380000000000" onClick={close}>{t.call}</a>
        <button type="button" data-open-chat onClick={close}>{t.chat}</button>
      </nav>
    </>
  );
}
