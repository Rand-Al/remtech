import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatPanel from "@/components/ChatPanel";
import Faq from "@/components/Faq";
import { getContacts } from "@/lib/contacts";
import { phoneHrefFromPhone } from "@/shared/settings";

export const metadata: Metadata = {
  title: "Ремонт бытовой техники в Броварах — RemTech",
  description:
    "Ремонт котлов, стиральных и посудомоечных машин и другой бытовой техники в Броварах и Броварском районе с выездом мастера.",
  alternates: {
    canonical: "https://example.com/ru/",
    languages: {
      uk: "https://example.com/",
      ru: "https://example.com/ru/",
    },
  },
  openGraph: {
    type: "website",
    title: "Ремонт бытовой техники в Броварах — RemTech",
    url: "https://example.com/ru/",
    description:
      "Ремонт котлов, стиральных и посудомоечных машин и другой бытовой техники с выездом мастера.",
  },
};

export default async function RuHomePage() {
  const contacts = await getContacts();
  const phoneHref = phoneHrefFromPhone(contacts.phone);
  return (
    <>
      <Header variant="home" lang="ru" altLangHref="/" />

      <main>
        <section className="hero">
          <div className="hero-image" role="img" aria-label="Мастер обслуживает настенный газовый котел"></div>
          <div className="hero-content">
            <p className="location">Бровары и Броварский район</p>
            <h1>Ремонт котлов, стиральных, посудомоечных машин и другой бытовой техники в Броварах</h1>
            <p className="hero-copy">RemTech помогает с ремонтом и обслуживанием бытовой техники с выездом по Броварам и Броварскому району. Опишите проблему, и менеджер уточнит детали для мастера.</p>

            <div className="hero-actions">
              <button className="primary-button" type="button" data-open-chat>Написать менеджеру</button>
              <a className="secondary-button" href={phoneHref}>Позвонить</a>
              <a className="text-button telegram-button" href={contacts.telegramUrl} rel="nofollow">Telegram <span aria-hidden="true">&#8599;</span></a>
            </div>

            <ul className="benefits" aria-label="Кратко о сервисе">
              <li><span aria-hidden="true">&#10003;</span> Выезд по району</li>
              <li><span aria-hidden="true">&#10003;</span> Стоимость ремонта после осмотра</li>
              <li><span aria-hidden="true">&#10003;</span> Ремонт после согласования</li>
            </ul>
          </div>
        </section>

        <section className="services" id="services">
          <div className="services-heading">
            <div>
              <p className="section-kicker">Услуги RemTech</p>
              <h2>Какая техника нуждается в ремонте?</h2>
            </div>
            <p>Выберите нужную услугу или напишите менеджеру, если вашей техники нет в списке.</p>
          </div>

          <article className="featured-service">
            <div className="featured-service-image" role="img" aria-label="Обслуживание настенного газового котла"></div>
            <div className="featured-service-content">
              <p className="service-number">01 / Котлы</p>
              <h3>Ремонт и обслуживание котлов</h3>
              <p>Работаем с двухконтурными газовыми котлами. Выберите нужное направление, и менеджер сразу учтет его в разговоре.</p>
              <a className="featured-page-link" href="/ru/kotly/">Подробнее о котлах <span aria-hidden="true">&#8594;</span></a>
              <div className="featured-actions">
                <button type="button" data-open-chat data-service="boiler-repair"><span>Ремонт котлов</span><span aria-hidden="true">&#8594;</span></button>
                <button type="button" data-open-chat data-service="boiler-cleaning"><span>Чистка и обслуживание</span><span aria-hidden="true">&#8594;</span></button>
                <button type="button" data-open-chat data-service="boiler-installation"><span>Установка и замена</span><span aria-hidden="true">&#8594;</span></button>
              </div>
            </div>
          </article>

          <div className="service-grid">
            <article className="service-tile">
              <a className="service-tile-page-link" href="/ru/pralni-mashyny/" aria-label="Подробнее о ремонте стиральных машин">
                <img src="/assets/washing-machine-concept.png" alt="Стиральная машина в домашнем помещении" />
              </a>
              <div className="service-tile-content">
                <p className="service-number">02</p>
                <h3><a href="/ru/pralni-mashyny/">Ремонт стиральных машин</a></h3>
                <p>Не сливает воду, не греет, шумит, протекает, не включается или показывает ошибку.</p>
                <button className="service-link" type="button" data-open-chat data-service="washer">Написать менеджеру <span aria-hidden="true">&#8594;</span></button>
              </div>
            </article>

            <article className="service-tile">
              <a className="service-tile-page-link" href="/ru/posudomyini-mashyny/" aria-label="Подробнее о ремонте посудомоечных машин">
                <img src="/assets/dishwasher-concept.png" alt="Открытая посудомоечная машина на домашней кухне" />
              </a>
              <div className="service-tile-content">
                <p className="service-number">03</p>
                <h3><a href="/ru/posudomyini-mashyny/">Ремонт посудомоечных машин</a></h3>
                <p>Не набирает или не сливает воду, протекает, плохо моет, не греет или останавливается с ошибкой.</p>
                <button className="service-link" type="button" data-open-chat data-service="dishwasher">Написать менеджеру <span aria-hidden="true">&#8594;</span></button>
              </div>
            </article>

            <article className="service-tile other-service">
              <div className="service-tile-content">
                <p className="service-number">04</p>
                <h3>Другая бытовая техника</h3>
                <p>Опишите технику и неисправность. Менеджер уточнит детали и подскажет, возможен ли выезд.</p>
                <button type="button" data-open-chat data-service="other">Написать менеджеру <span aria-hidden="true">&#8594;</span></button>
              </div>
            </article>
          </div>
        </section>

        <Faq lang="ru" />

        <section className="contacts" id="contacts">
          <div className="contacts-intro">
            <p className="section-kicker">Связь с RemTech</p>
            <h2>Свяжитесь с RemTech</h2>
            <p>Опишите неисправность в чате или позвоните. Менеджер уточнит детали и согласует удобное время для связи.</p>
            <div className="contact-actions">
              <button className="contact-primary" type="button" data-open-chat>Написать менеджеру</button>
              <a className="contact-secondary" href={phoneHref}>Позвонить</a>
            </div>
          </div>

          <dl className="contact-details">
            <div>
              <dt>Телефон</dt>
              <dd><a href={phoneHref}>{contacts.phone}</a></dd>
            </div>
            <div>
              <dt>Telegram</dt>
              <dd><a href={contacts.telegramUrl} rel="nofollow">{contacts.telegramLabel}</a></dd>
            </div>
            <div>
              <dt>График работы</dt>
              <dd>{contacts.schedule.ru}</dd>
            </div>
            <div>
              <dt>Зона выезда</dt>
              <dd>{contacts.area.ru}</dd>
            </div>
          </dl>
        </section>
      </main>

      <Footer variant="home" lang="ru" altLangHref="/" />
      <ChatPanel lang="ru" />
    </>
  );
}
