import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatPanel from "@/components/ChatPanel";

export const metadata: Metadata = {
  title: "Ремонт пральних машин у Броварах — RemTech",
  description:
    "Ремонт пральних машин у Броварах та Броварському районі з виїздом майстра.",
  alternates: {
    canonical: "https://example.com/pralni-mashyny/",
    languages: {
      uk: "https://example.com/pralni-mashyny/",
      ru: "https://example.com/ru/pralni-mashyny/",
    },
  },
  openGraph: {
    type: "website",
    title: "Ремонт пральних машин у Броварах — RemTech",
    url: "https://example.com/pralni-mashyny/",
    description:
      "Ремонт пральних машин у Броварах та Броварському районі з виїздом майстра та діагностикою.",
  },
};

export default function PralniMashynyPage() {
  return (
    <>
      <Header altLangHref="/ru/pralni-mashyny/" />

      <main>
        <section className="hero service-page-hero washer-page-hero">
          <div className="hero-image" role="img" aria-label="Пральна машина у домашньому приміщенні"></div>
          <div className="hero-content">
            <p className="location">Пральні машини · Бровари та Броварський район</p>
            <h1>Ремонт пральних машин у Броварах та Броварському районі</h1>
            <p className="hero-copy">Пральна машина не зливає воду, не віджимає, шумить, протікає або показує помилку? Опишіть несправність — менеджер уточнить деталі для майстра.</p>

            <div className="hero-actions">
              <button className="primary-button" type="button" data-open-chat>Написати менеджеру</button>
              <a className="secondary-button" href="tel:+380000000000">Зателефонувати</a>
            </div>
          </div>
        </section>

        <section className="washer-symptoms" id="symptoms">
          <div className="washer-symptoms-heading">
            <p className="section-kicker">Ремонт пральних машин</p>
            <h2>З якими несправностями можна звернутися?</h2>
            <p>Якщо вашої ситуації немає у списку, опишіть її менеджеру — він уточнить деталі звернення.</p>
            <button type="button" data-open-chat data-service="washer">Описати несправність менеджеру</button>
          </div>

          <ul className="washer-symptom-list">
            <li><span>01</span><strong>Не вмикається або раптом вимикається</strong></li>
            <li><span>02</span><strong>Не набирає воду або набирає дуже повільно</strong></li>
            <li><span>03</span><strong>Не віджимає або віджимає нерівномірно</strong></li>
            <li><span>04</span><strong>Не зливає воду</strong></li>
            <li><span>05</span><strong>Підтікає вода</strong></li>
            <li><span>06</span><strong>Сильно шумить або вібрує</strong></li>
            <li><span>07</span><strong>Показує код помилки</strong></li>
          </ul>
        </section>

        <section className="washer-request-guide" id="request-guide">
          <div className="washer-request-guide-heading">
            <div>
              <p className="section-kicker">Перед зверненням</p>
              <h2>Що допоможе швидше оформити звернення</h2>
              <p>Якщо чогось не знаєте, менеджер допоможе уточнити.</p>
            </div>
            <button type="button" data-open-chat>Описати проблему менеджеру</button>
          </div>

          <ul className="washer-request-guide-list">
            <li><strong>Марка і модель</strong><span>Якщо відомі</span></li>
            <li><strong>Несправність</strong><span>Що сталося або який код помилки</span></li>
            <li><strong>Адреса</strong><span>Куди приїхати майстру</span></li>
            <li><strong>Фото або відео</strong><span>За можливості</span></li>
          </ul>
        </section>

        <section className="washer-terms" id="terms">
          <div className="washer-terms-heading">
            <p className="section-kicker">Умови робіт</p>
            <h2>Як узгоджується ремонт</h2>
            <p>До початку робіт ви знатимете умови виїзду, результати огляду та погоджену вартість ремонту.</p>
          </div>

          <div className="washer-terms-steps">
            <article>
              <span>Перед виїздом</span>
              <h3>Виїзд і діагностика</h3>
              <p>Виїзд і діагностика оплачуються окремо. Менеджер пояснить умови до виїзду майстра.</p>
            </article>
            <article>
              <span>На місці</span>
              <h3>Огляд машини</h3>
              <p>Майстер огляне пральну машину і визначить обсяг потрібних робіт.</p>
            </article>
            <article>
              <span>Перед ремонтом</span>
              <h3>Погодження ремонту</h3>
              <p>Вартість ремонту повідомляємо після огляду. Ремонт починаємо після вашої згоди.</p>
            </article>
          </div>
        </section>

        <section className="washer-final-cta" id="contact">
          <div>
            <p className="section-kicker">Зв’язок з RemTech</p>
            <h2>Потрібна допомога з пральною машиною?</h2>
            <p>Опишіть ситуацію в чаті або зателефонуйте. Менеджер уточнить деталі та погодить зручний час для зв’язку.</p>
          </div>
          <div className="washer-final-actions">
            <button type="button" data-open-chat>Написати менеджеру</button>
            <a href="tel:+380000000000">Зателефонувати</a>
          </div>
        </section>
      </main>

      <Footer altLangHref="/ru/pralni-mashyny/" />
      <ChatPanel defaultService="washer" />
    </>
  );
}
