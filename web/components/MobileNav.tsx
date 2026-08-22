"use client";

import { useEffect, useRef, useState } from "react";

type NavVariant = "home" | "kotly" | "service";

export default function MobileNav({ variant = "service" }: { variant?: NavVariant }) {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef<HTMLElement>(null);

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
        aria-label="Відкрити меню"
        aria-controls="mobile-menu"
        aria-expanded={isOpen}
        title="Меню"
        onClick={() => setIsOpen((open) => !open)}
      >
        <span></span><span></span><span></span>
      </button>

      <nav
        ref={navRef}
        className="mobile-nav"
        id="mobile-menu"
        aria-label="Мобільна навігація"
        aria-hidden={!isOpen}
        inert={!isOpen}
        hidden
      >
        {variant === "home" && (
          <>
            <a href="#services" onClick={close}>Послуги</a>
            <a href="#faq" onClick={close}>FAQ</a>
            <a href="#contacts" onClick={close}>Контакти</a>
          </>
        )}
        {variant === "kotly" && (
          <>
            <a href="/" onClick={close}>Головна</a>
            <a href="#directions" onClick={close}>Напрями</a>
            <a href="/#faq" onClick={close}>FAQ</a>
            <a href="/#contacts" onClick={close}>Контакти</a>
          </>
        )}
        {variant === "service" && (
          <>
            <a href="/" onClick={close}>Головна</a>
            <a href="/#services" onClick={close}>Послуги</a>
            <a href="/#faq" onClick={close}>FAQ</a>
            <a href="/#contacts" onClick={close}>Контакти</a>
          </>
        )}
        <a href="tel:+380000000000" onClick={close}>Зателефонувати</a>
        <button type="button" data-open-chat onClick={close}>Написати менеджеру</button>
      </nav>
    </>
  );
}