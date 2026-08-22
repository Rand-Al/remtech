import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatPanel from "@/components/ChatPanel";
import PricingSection from "@/components/PricingSection";
import { getContacts } from "@/lib/contacts";
import { phoneHrefFromPhone } from "@/shared/settings";

export const metadata: Metadata = {
  title: "Ремонт и обслуживание котлов в Броварах — RemTech",
  description:
    "Ремонт и обслуживание двухконтурных газовых котлов в Броварах и Броварском районе.",
  alternates: {
    canonical: "https://example.com/ru/kotly/",
    languages: {
      uk: "https://example.com/kotly/",
      ru: "https://example.com/ru/kotly/",
    },
  },
  openGraph: {
    type: "website",
    title: "Ремонт и обслуживание котлов в Броварах — RemTech",
    url: "https://example.com/ru/kotly/",
    description:
      "Ремонт, чистка и установка двухконтурных газовых котлов в Броварах и Броварском районе.",
  },
};

export default async function RuKotlyPage() {
  const contacts = await getContacts();
  const phoneHref = phoneHrefFromPhone(contacts.phone);
  return (
    <>
      <Header variant="kotly" lang="ru" altLangHref="/kotly/" />

      <main>
        <section className="hero service-page-hero">
          <div className="hero-image" role="img" aria-label="Мастер обслуживает настенный газовый котел"></div>
          <div className="hero-content">
            <p className="location">Котлы · Бровары и Броварский район</p>
            <h1>Ремонт и обслуживание котлов в Броварах и Броварском районе</h1>
            <p className="hero-copy">Работаем с двухконтурными газовыми котлами. Опишите неисправность или нужную работу — менеджер уточнит детали и передаст обращение мастеру.</p>

            <div className="hero-actions">
              <button className="primary-button" type="button" data-open-chat>Написать менеджеру</button>
              <a className="secondary-button" href={phoneHref}>Позвонить</a>
            </div>
          </div>
        </section>

        <section className="service-directions" id="directions">
          <div className="service-directions-heading">
            <div>
              <p className="section-kicker">Направления работы</p>
              <h2>Что нужно сделать?</h2>
            </div>
            <p>Выберите нужное направление. Если не уверены, просто опишите неисправность менеджеру.</p>
          </div>

          <div className="service-direction-grid">
            <article className="service-direction">
              <p className="service-number">01</p>
              <h3>Ремонт котла</h3>
              <p>Котел не включается, работает нестабильно, не нагревает воду или показывает ошибку.</p>
              <button type="button" data-open-chat data-service="boiler-repair" aria-label="Написать менеджеру о ремонте котла">Написать менеджеру <span aria-hidden="true">&#8594;</span></button>
            </article>

            <article className="service-direction">
              <p className="service-number">02</p>
              <h3>Чистка и обслуживание</h3>
              <p>Периодическая очистка внутренних узлов и проверка состояния оборудования.</p>
              <button type="button" data-open-chat data-service="boiler-cleaning" aria-label="Написать менеджеру о чистке и обслуживании котла">Написать менеджеру <span aria-hidden="true">&#8594;</span></button>
            </article>

            <article className="service-direction">
              <p className="service-number">03</p>
              <h3>Установка или замена</h3>
              <p>Установка нового котла или замена имеющегося оборудования после уточнения деталей.</p>
              <button type="button" data-open-chat data-service="boiler-installation" aria-label="Написать менеджеру об установке или замене котла">Написать менеджеру <span aria-hidden="true">&#8594;</span></button>
            </article>
          </div>
        </section>

        <section className="boiler-symptoms" id="symptoms">
          <div className="boiler-symptoms-heading">
            <p className="section-kicker">Ремонт котлов</p>
            <h2>С какими неисправностями можно обратиться?</h2>
            <p>Если вашей ситуации нет в списке, опишите ее менеджеру — он уточнит детали обращения.</p>
            <button type="button" data-open-chat data-service="boiler-repair">Описать неисправность менеджеру</button>
          </div>

          <ul className="boiler-symptom-list">
            <li><span>01</span><strong>Котел не включается или сам выключается</strong></li>
            <li><span>02</span><strong>Не нагревает воду</strong></li>
            <li><span>03</span><strong>Не прогревает систему отопления</strong></li>
            <li><span>04</span><strong>Падает или растет давление</strong></li>
            <li><span>05</span><strong>Показывает код ошибки</strong></li>
            <li><span>06</span><strong>Шумит, протекает или работает нестабильно</strong></li>
          </ul>
        </section>

        <section className="boiler-maintenance" id="maintenance">
          <div className="boiler-maintenance-heading">
            <p className="section-kicker">Чистка и обслуживание</p>
            <h2>Когда стоит обратиться по обслуживанию?</h2>
            <p>Обслуживание нужно не только после появления ошибки. Менеджер уточнит модель котла, когда его обслуживали в последний раз и что изменилось в работе.</p>
            <button type="button" data-open-chat data-service="boiler-cleaning">Спросить об обслуживании</button>
          </div>

          <div className="boiler-maintenance-details">
            <ul className="boiler-maintenance-list">
              <li><span aria-hidden="true">&#10003;</span><strong>Котел давно не проходил обслуживание</strong></li>
              <li><span aria-hidden="true">&#10003;</span><strong>Нужна плановая чистка без явной неисправности</strong></li>
              <li><span aria-hidden="true">&#10003;</span><strong>Оборудование запускают после длительного перерыва</strong></li>
              <li><span aria-hidden="true">&#10003;</span><strong>Нужна проверка перед отопительным сезоном</strong></li>
            </ul>
            <p className="boiler-maintenance-note">Перечень работ определяется после уточнения модели и осмотра оборудования.</p>
          </div>
        </section>

        <section className="boiler-installation" id="installation">
          <div className="boiler-installation-heading">
            <div>
              <p className="section-kicker">Установка и замена</p>
              <h2>Новый котел или замена имеющегося?</h2>
            </div>
            <p>Перед выездом менеджер уточнит модель оборудования, место установки и нужно ли демонтировать старый котел.</p>
          </div>

          <div className="boiler-installation-options">
            <article>
              <span aria-hidden="true">01</span>
              <h3>Установка нового котла</h3>
              <p>Если котел устанавливают впервые, опишите оборудование и место, где планируется монтаж.</p>
            </article>
            <article>
              <span aria-hidden="true">02</span>
              <h3>Замена котла</h3>
              <p>Если нужно заменить имеющийся котел, сообщите его модель и модель нового оборудования, если уже выбрали.</p>
            </article>
          </div>

          <div className="boiler-installation-action">
            <p>Точный объем работ мастер определит после осмотра оборудования и подключений.</p>
            <button type="button" data-open-chat data-service="boiler-installation">Обсудить установку или замену</button>
          </div>
        </section>

        <section className="boiler-request-guide" id="request-guide">
          <div className="boiler-request-guide-heading">
            <div>
              <p className="section-kicker">Перед обращением</p>
              <h2>Что поможет быстрее оформить обращение</h2>
              <p>Если чего-то не знаете, менеджер поможет уточнить.</p>
            </div>
            <button type="button" data-open-chat>Описать проблему менеджеру</button>
          </div>

          <ul className="boiler-request-guide-list">
            <li><strong>Марка и модель</strong><span>Если известны</span></li>
            <li><strong>Неисправность</strong><span>Что произошло или какой код ошибки</span></li>
            <li><strong>Адрес</strong><span>Куда приехать мастеру</span></li>
            <li><strong>Фото или видео</strong><span>По возможности</span></li>
          </ul>
        </section>

        <section className="boiler-terms" id="terms">
          <div className="boiler-terms-heading">
            <p className="section-kicker">Условия работ</p>
            <h2>Как согласуется ремонт</h2>
            <p>До начала работ вы будете знать условия выезда, результаты осмотра и согласованную стоимость ремонта.</p>
          </div>

          <div className="boiler-terms-steps">
            <article>
              <span>Перед выездом</span>
              <h3>Выезд и диагностика</h3>
              <p>Оплачиваются отдельно. Менеджер уточнит условия перед выездом мастера.</p>
            </article>
            <article>
              <span>На месте</span>
              <h3>Осмотр оборудования</h3>
              <p>Мастер осматривает котел и определяет, какие работы нужны.</p>
            </article>
            <article>
              <span>Перед ремонтом</span>
              <h3>Согласование ремонта</h3>
              <p>Стоимость ремонта сообщается после осмотра. Работы начинаются после вашего согласия.</p>
            </article>
          </div>
        </section>

        <PricingSection lang="ru" />

        <aside className="boiler-safety" id="safety" aria-labelledby="boiler-safety-title">
          <div>
            <p className="section-kicker">Важно для безопасности</p>
            <h2 id="boiler-safety-title">Не разбирайте газовый котел самостоятельно</h2>
          </div>
          <p>Если почувствовали запах газа, не пользуйтесь открытым огнем, не включайте и не выключайте свет или электроприборы. Перекройте газ, откройте окна, покиньте помещение и позвоните в аварийную газовую службу с безопасного места.</p>
          <a href="tel:104" aria-label="Позвонить в аварийную газовую службу 104">Аварийная газовая служба <strong>104</strong></a>
        </aside>

        <section className="boiler-final-cta" id="contact">
          <div>
            <p className="section-kicker">Связь с RemTech</p>
            <h2>Нужна помощь с котлом?</h2>
            <p>Опишите ситуацию в чате или позвоните. Менеджер уточнит детали и согласует удобное время для связи.</p>
          </div>
          <div className="boiler-final-actions">
            <button type="button" data-open-chat>Написать менеджеру</button>
            <a href={phoneHref}>Позвонить</a>
          </div>
        </section>
      </main>

      <Footer variant="kotly" lang="ru" altLangHref="/kotly/" />
      <ChatPanel defaultService="boiler-repair" lang="ru" />
    </>
  );
}
