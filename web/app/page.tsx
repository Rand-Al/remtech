import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatPanel from "@/components/ChatPanel";
import Faq from "@/components/Faq";

export const metadata: Metadata = {
  title: "Ремонт побутової техніки у Броварах — RemTech",
  description:
    "Ремонт котлів, пральних та посудомийних машин і іншої побутової техніки у Броварах та Броварському районі з виїздом майстра.",
  alternates: {
    canonical: "https://example.com/",
    languages: {
      uk: "https://example.com/",
      ru: "https://example.com/ru/",
    },
  },
  openGraph: {
    type: "website",
    title: "Ремонт побутової техніки у Броварах — RemTech",
    url: "https://example.com/",
    description:
      "Ремонт котлів, пральних та посудомийних машин і іншої побутової техніки з виїздом майстра.",
  },
};

export default function HomePage() {
  return (
    <>
      <Header variant="home" altLangHref="/ru/" />

      <main>
        <section className="hero">
          <div className="hero-image" role="img" aria-label="Майстер обслуговує настінний газовий котел"></div>
          <div className="hero-content">
            <p className="location">Бровари та Броварський район</p>
            <h1>Ремонт котлів, пральних, посудомийних машин та іншої побутової техніки в Броварах</h1>
            <p className="hero-copy">RemTech допомагає з ремонтом і обслуговуванням побутової техніки з виїздом по Броварах і Броварському району. Опишіть проблему, і менеджер уточнить деталі для майстра.</p>

            <div className="hero-actions">
              <button className="primary-button" type="button" data-open-chat>Написати менеджеру</button>
              <a className="secondary-button" href="tel:+380000000000">Зателефонувати</a>
              <a className="text-button telegram-button" href="https://t.me/example" rel="nofollow">Telegram <span aria-hidden="true">&#8599;</span></a>
            </div>

            <ul className="benefits" aria-label="Коротко про сервіс">
              <li><span aria-hidden="true">&#10003;</span> Виїзд по району</li>
              <li><span aria-hidden="true">&#10003;</span> Вартість ремонту після огляду</li>
              <li><span aria-hidden="true">&#10003;</span> Ремонт після погодження</li>
            </ul>
          </div>
        </section>

        <section className="services" id="services">
          <div className="services-heading">
            <div>
              <p className="section-kicker">Послуги RemTech</p>
              <h2>Яка техніка потребує ремонту?</h2>
            </div>
            <p>Оберіть потрібну послугу або напишіть менеджеру, якщо вашої техніки немає в списку.</p>
          </div>

          <article className="featured-service">
            <div className="featured-service-image" role="img" aria-label="Обслуговування настінного газового котла"></div>
            <div className="featured-service-content">
              <p className="service-number">01 / Котли</p>
              <h3>Ремонт та обслуговування котлів</h3>
              <p>Працюємо з двоконтурними газовими котлами. Оберіть потрібний напрям, і менеджер одразу врахує його в розмові.</p>
              <a className="featured-page-link" href="/kotly/">Детальніше про котли <span aria-hidden="true">&#8594;</span></a>
              <div className="featured-actions">
                <button type="button" data-open-chat data-service="boiler-repair"><span>Ремонт котлів</span><span aria-hidden="true">&#8594;</span></button>
                <button type="button" data-open-chat data-service="boiler-cleaning"><span>Чистка та обслуговування</span><span aria-hidden="true">&#8594;</span></button>
                <button type="button" data-open-chat data-service="boiler-installation"><span>Встановлення та заміна</span><span aria-hidden="true">&#8594;</span></button>
              </div>
            </div>
          </article>

          <div className="service-grid">
            <article className="service-tile">
              <a className="service-tile-page-link" href="/pralni-mashyny/" aria-label="Детальніше про ремонт пральних машин">
                <img src="/assets/washing-machine-concept.png" alt="Пральна машина в домашньому приміщенні" />
              </a>
              <div className="service-tile-content">
                <p className="service-number">02</p>
                <h3><a href="/pralni-mashyny/">Ремонт пральних машин</a></h3>
                <p>Не зливає воду, не гріє, шумить, протікає, не вмикається або показує помилку.</p>
                <button className="service-link" type="button" data-open-chat data-service="washer">Написати менеджеру <span aria-hidden="true">&#8594;</span></button>
              </div>
            </article>

            <article className="service-tile">
              <a className="service-tile-page-link" href="/posudomyini-mashyny/" aria-label="Детальніше про ремонт посудомийних машин">
                <img src="/assets/dishwasher-concept.png" alt="Відкрита посудомийна машина в домашній кухні" />
              </a>
              <div className="service-tile-content">
                <p className="service-number">03</p>
                <h3><a href="/posudomyini-mashyny/">Ремонт посудомийних машин</a></h3>
                <p>Не набирає або не зливає воду, протікає, погано миє, не гріє чи зупиняється з помилкою.</p>
                <button className="service-link" type="button" data-open-chat data-service="dishwasher">Написати менеджеру <span aria-hidden="true">&#8594;</span></button>
              </div>
            </article>

            <article className="service-tile other-service">
              <div className="service-tile-content">
                <p className="service-number">04</p>
                <h3>Інша побутова техніка</h3>
                <p>Опишіть техніку і несправність. Менеджер уточнить деталі та підкаже, чи можливий виїзд.</p>
                <button type="button" data-open-chat data-service="other">Написати менеджеру <span aria-hidden="true">&#8594;</span></button>
              </div>
            </article>
          </div>
        </section>

        <Faq />

        <section className="contacts" id="contacts">
          <div className="contacts-intro">
            <p className="section-kicker">Зв’язок з RemTech</p>
            <h2>Зв’яжіться з RemTech</h2>
            <p>Опишіть несправність у чаті або зателефонуйте. Менеджер уточнить деталі та погодить зручний час для зв’язку.</p>
            <div className="contact-actions">
              <button className="contact-primary" type="button" data-open-chat>Написати менеджеру</button>
              <a className="contact-secondary" href="tel:+380000000000">Зателефонувати</a>
            </div>
          </div>

          <dl className="contact-details">
            <div>
              <dt>Телефон</dt>
              <dd><a href="tel:+380000000000">+38 000 000 00 00</a></dd>
            </div>
            <div>
              <dt>Telegram</dt>
              <dd><a href="https://t.me/example" rel="nofollow">@example</a></dd>
            </div>
            <div>
              <dt>Графік роботи</dt>
              <dd>Щодня, 10:00–18:00</dd>
            </div>
            <div>
              <dt>Зона виїзду</dt>
              <dd>Бровари та Броварський район</dd>
            </div>
          </dl>
        </section>
      </main>

      <Footer variant="home" altLangHref="/ru/" />
      <ChatPanel />
    </>
  );
}