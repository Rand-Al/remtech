import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatPanel from "@/components/ChatPanel";
import { getContacts } from "@/lib/contacts";
import { phoneHrefFromPhone } from "@/shared/settings";

export const metadata: Metadata = {
  title: "Ремонт стиральных машин в Броварах — RemTech",
  description:
    "Ремонт стиральных машин в Броварах и Броварском районе с выездом мастера.",
  alternates: {
    canonical: "https://example.com/ru/pralni-mashyny/",
    languages: {
      uk: "https://example.com/pralni-mashyny/",
      ru: "https://example.com/ru/pralni-mashyny/",
    },
  },
  openGraph: {
    type: "website",
    title: "Ремонт стиральных машин в Броварах — RemTech",
    url: "https://example.com/ru/pralni-mashyny/",
    description:
      "Ремонт стиральных машин в Броварах и Броварском районе с выездом мастера и диагностикой.",
  },
};

export default async function RuPralniMashynyPage() {
  const contacts = await getContacts();
  const phoneHref = phoneHrefFromPhone(contacts.phone);
  return (
    <>
      <Header variant="service" lang="ru" altLangHref="/pralni-mashyny/" />

      <main>
        <section className="hero service-page-hero washer-page-hero">
          <div className="hero-image" role="img" aria-label="Стиральная машина в домашнем помещении"></div>
          <div className="hero-content">
            <p className="location">Стиральные машины · Бровары и Броварский район</p>
            <h1>Ремонт стиральных машин в Броварах и Броварском районе</h1>
            <p className="hero-copy">Стиральная машина не сливает воду, не отжимает, шумит, протекает или показывает ошибку? Опишите неисправность — менеджер уточнит детали для мастера.</p>

            <div className="hero-actions">
              <button className="primary-button" type="button" data-open-chat>Написать менеджеру</button>
              <a className="secondary-button" href={phoneHref}>Позвонить</a>
            </div>
          </div>
        </section>

        <section className="washer-symptoms" id="symptoms">
          <div className="washer-symptoms-heading">
            <p className="section-kicker">Ремонт стиральных машин</p>
            <h2>С какими неисправностями можно обратиться?</h2>
            <p>Если вашей ситуации нет в списке, опишите ее менеджеру — он уточнит детали обращения.</p>
            <button type="button" data-open-chat data-service="washer">Описать неисправность менеджеру</button>
          </div>

          <ul className="washer-symptom-list">
            <li><span>01</span><strong>Не включается или внезапно выключается</strong></li>
            <li><span>02</span><strong>Не набирает воду или набирает очень медленно</strong></li>
            <li><span>03</span><strong>Не отжимает или отжимает неравномерно</strong></li>
            <li><span>04</span><strong>Не сливает воду</strong></li>
            <li><span>05</span><strong>Подтекает вода</strong></li>
            <li><span>06</span><strong>Сильно шумит или вибрирует</strong></li>
            <li><span>07</span><strong>Показывает код ошибки</strong></li>
          </ul>
        </section>

        <section className="washer-request-guide" id="request-guide">
          <div className="washer-request-guide-heading">
            <div>
              <p className="section-kicker">Перед обращением</p>
              <h2>Что поможет быстрее оформить обращение</h2>
              <p>Если чего-то не знаете, менеджер поможет уточнить.</p>
            </div>
            <button type="button" data-open-chat>Описать проблему менеджеру</button>
          </div>

          <ul className="washer-request-guide-list">
            <li><strong>Марка и модель</strong><span>Если известны</span></li>
            <li><strong>Неисправность</strong><span>Что произошло или какой код ошибки</span></li>
            <li><strong>Адрес</strong><span>Куда приехать мастеру</span></li>
            <li><strong>Фото или видео</strong><span>По возможности</span></li>
          </ul>
        </section>

        <section className="washer-terms" id="terms">
          <div className="washer-terms-heading">
            <p className="section-kicker">Условия работ</p>
            <h2>Как согласуется ремонт</h2>
            <p>До начала работ вы будете знать условия выезда, результаты осмотра и согласованную стоимость ремонта.</p>
          </div>

          <div className="washer-terms-steps">
            <article>
              <span>Перед выездом</span>
              <h3>Выезд и диагностика</h3>
              <p>Выезд и диагностика оплачиваются отдельно. Менеджер объяснит условия до выезда мастера.</p>
            </article>
            <article>
              <span>На месте</span>
              <h3>Осмотр машины</h3>
              <p>Мастер осмотрит стиральную машину и определит объем нужных работ.</p>
            </article>
            <article>
              <span>Перед ремонтом</span>
              <h3>Согласование ремонта</h3>
              <p>Стоимость ремонта сообщаем после осмотра. Ремонт начинаем после вашего согласия.</p>
            </article>
          </div>
        </section>

        <section className="washer-final-cta" id="contact">
          <div>
            <p className="section-kicker">Связь с RemTech</p>
            <h2>Нужна помощь со стиральной машиной?</h2>
            <p>Опишите ситуацию в чате или позвоните. Менеджер уточнит детали и согласует удобное время для связи.</p>
          </div>
          <div className="washer-final-actions">
            <button type="button" data-open-chat>Написать менеджеру</button>
            <a href={phoneHref}>Позвонить</a>
          </div>
        </section>
      </main>

      <Footer variant="service" lang="ru" altLangHref="/pralni-mashyny/" />
      <ChatPanel defaultService="washer" lang="ru" />
    </>
  );
}
