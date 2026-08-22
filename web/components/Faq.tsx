"use client";

import { useCallback, useState } from "react";
import {
  formatPrice,
  resolvePriceItem,
  type PriceOverrides,
  type PricingLocale,
} from "@/shared/pricing";

type FaqLang = "uk" | "ru";

function buildFaqItems(locale: PricingLocale, overrides?: PriceOverrides) {
  const brovaryVisitPrice = formatPrice(
    resolvePriceItem("visit-brovary", overrides).value,
    locale
  );
  const boilerDiagnosticPrice = formatPrice(
    resolvePriceItem("boiler-diagnostics", overrides).value,
    locale
  );

  if (locale === "ru") {
    return [
      {
        question: "Какую бытовую технику вы ремонтируете?",
        answer:
          "Ремонтируем котлы, стиральные и посудомоечные машины. По другой бытовой технике напишите менеджеру — он уточнит, сможем ли помочь.",
      },
      {
        question: "Как оформить обращение?",
        answer:
          "Напишите в чат или позвоните. Менеджер уточнит детали, адрес и удобное время для связи.",
      },
      {
        question: "Что желательно сообщить менеджеру?",
        answer:
          "Тип техники, марку и модель, что именно произошло и где вы находитесь. Если чего-то не знаете — ничего страшного, менеджер задаст нужные вопросы.",
      },
      {
        question: "Можно ли отправить фото или видео неисправности?",
        answer:
          "Да. Фото или короткое видео помогут лучше понять обращение, но не заменяют диагностику мастера.",
      },
      {
        question: "Сколько стоят выезд и диагностика?",
        answer: `Выезд в Броварах — ${brovaryVisitPrice}, диагностика двухконтурного котла — ${boilerDiagnosticPrice}. Для другой техники и населенных пунктов стоимость согласуется до выезда.`,
      },
      {
        question: "Когда будет известна стоимость ремонта?",
        answer:
          "После осмотра и диагностики. Мастер объяснит, что нужно сделать, и согласует стоимость до начала ремонта.",
      },
      {
        question: "Какая гарантия на ремонт?",
        answer:
          "Гарантия на выполненные работы обсуждается перед ремонтом, если гарантийные условия применимы к конкретной работе.",
      },
      {
        question: "Куда выезжает мастер?",
        answer:
          "Работаем в Броварах и населенных пунктах Броварского района. Возможность выезда по конкретному адресу уточнит менеджер.",
      },
    ];
  }

  return [
    {
      question: "Яку побутову техніку ви ремонтуєте?",
      answer:
        "Ремонтуємо котли, пральні та посудомийні машини. Щодо іншої побутової техніки напишіть менеджеру — він уточнить, чи зможемо допомогти.",
    },
    {
      question: "Як оформити звернення?",
      answer:
        "Напишіть у чат або зателефонуйте. Менеджер уточнить деталі, адресу та зручний час для зв’язку.",
    },
    {
      question: "Що бажано вказати менеджеру?",
      answer:
        "Тип техніки, марку і модель, що саме сталося та де ви знаходитеся. Якщо чогось не знаєте — нічого страшного, менеджер поставить потрібні запитання.",
    },
    {
      question: "Чи можна надіслати фото або відео несправності?",
      answer:
        "Так. Фото або коротке відео допоможуть краще зрозуміти звернення, але не замінюють діагностику майстра.",
    },
    {
      question: "Скільки коштують виїзд і діагностика?",
      answer: `Виїзд у Броварах — ${brovaryVisitPrice}, діагностика двоконтурного котла — ${boilerDiagnosticPrice}. Для іншої техніки та населених пунктів вартість узгоджується до виїзду.`,
    },
    {
      question: "Коли буде відома вартість ремонту?",
      answer:
        "Після огляду та діагностики. Майстер пояснить, що потрібно зробити, і погодить вартість до початку ремонту.",
    },
    {
      question: "Яка гарантія на ремонт?",
      answer:
        "Гарантія на виконані роботи обговорюється перед ремонтом, якщо гарантійні умови застосовні до конкретної роботи.",
    },
    {
      question: "Куди виїжджає майстер?",
      answer:
        "Працюємо у Броварах та населених пунктах Броварського району. Можливість виїзду за конкретною адресою уточнить менеджер.",
    },
  ];
}

const HEADING = {
  uk: {
    kicker: "Коротко про сервіс",
    title: "Поширені запитання",
    copy: "Про послуги, виїзд, діагностику та умови ремонту.",
  },
  ru: {
    kicker: "Кратко о сервисе",
    title: "Часто задаваемые вопросы",
    copy: "Об услугах, выезде, диагностике и условиях ремонта.",
  },
} as const;

export default function Faq({
  lang = "uk",
  overrides,
}: {
  lang?: FaqLang;
  overrides?: PriceOverrides;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const items = buildFaqItems(lang, overrides);
  const heading = HEADING[lang];

  const toggle = useCallback((index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  }, []);

  return (
    <section className="faq" id="faq">
      <div className="faq-heading">
        <p className="section-kicker">{heading.kicker}</p>
        <h2>{heading.title}</h2>
        <p>{heading.copy}</p>
      </div>

      <div className="faq-list">
        {items.map((item, index) => {
          const isOpen = openIndex === index;
          const answerId = `faq-answer-${index + 1}`;
          return (
            <div key={item.question} className={`faq-item${isOpen ? " is-open" : ""}`}>
              <button
                className="faq-summary"
                type="button"
                aria-expanded={isOpen}
                aria-controls={answerId}
                onClick={() => toggle(index)}
              >
                {item.question}
              </button>
              <div className="faq-answer" id={answerId} hidden={!isOpen} aria-hidden={!isOpen}>
                <p>{item.answer}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
