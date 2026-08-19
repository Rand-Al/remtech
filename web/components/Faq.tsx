"use client";

import { useCallback, useState } from "react";

const FAQ_ITEMS = [
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
    answer:
      "Виїзд і діагностика оплачуються окремо. Вартість залежить від виду техніки та адреси й узгоджується до виїзду.",
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

export default function Faq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = useCallback((index: number) => {
    setOpenIndex((current) => (current === index ? null : index));
  }, []);

  return (
    <section className="faq" id="faq">
      <div className="faq-heading">
        <p className="section-kicker">Коротко про сервіс</p>
        <h2>Поширені запитання</h2>
        <p>Про послуги, виїзд, діагностику та умови ремонту.</p>
      </div>

      <div className="faq-list">
        {FAQ_ITEMS.map((item, index) => {
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