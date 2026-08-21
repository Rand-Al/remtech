import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatPanel from "@/components/ChatPanel";
import PricingSection from "@/components/PricingSection";

export const metadata: Metadata = {
  title: "Ремонт та обслуговування котлів у Броварах — RemTech",
  description:
    "Ремонт та обслуговування двоконтурних газових котлів у Броварах та Броварському районі.",
  alternates: {
    canonical: "https://example.com/kotly/",
    languages: {
      uk: "https://example.com/kotly/",
      ru: "https://example.com/ru/kotly/",
    },
  },
  openGraph: {
    type: "website",
    title: "Ремонт та обслуговування котлів у Броварах — RemTech",
    url: "https://example.com/kotly/",
    description:
      "Ремонт, чистка та встановлення двоконтурних газових котлів у Броварах та Броварському районі.",
  },
};

export default function KotlyPage() {
  return (
    <>
      <Header />

      <main>
        <section className="hero service-page-hero">
          <div className="hero-image" role="img" aria-label="Майстер обслуговує настінний газовий котел"></div>
          <div className="hero-content">
            <p className="location">Котли · Бровари та Броварський район</p>
            <h1>Ремонт та обслуговування котлів у Броварах та Броварському районі</h1>
            <p className="hero-copy">Працюємо з двоконтурними газовими котлами. Опишіть несправність або потрібну роботу — менеджер уточнить деталі та передасть звернення майстру.</p>

            <div className="hero-actions">
              <button className="primary-button" type="button" data-open-chat>Написати менеджеру</button>
              <a className="secondary-button" href="tel:+380000000000">Зателефонувати</a>
            </div>
          </div>
        </section>

        <section className="service-directions" id="directions">
          <div className="service-directions-heading">
            <div>
              <p className="section-kicker">Напрями роботи</p>
              <h2>Що потрібно зробити?</h2>
            </div>
            <p>Оберіть потрібний напрям. Якщо не впевнені, просто опишіть несправність менеджеру.</p>
          </div>

          <div className="service-direction-grid">
            <article className="service-direction">
              <p className="service-number">01</p>
              <h3>Ремонт котла</h3>
              <p>Котел не вмикається, працює нестабільно, не нагріває воду або показує помилку.</p>
              <button type="button" data-open-chat data-service="boiler-repair" aria-label="Написати менеджеру щодо ремонту котла">Написати менеджеру <span aria-hidden="true">&#8594;</span></button>
            </article>

            <article className="service-direction">
              <p className="service-number">02</p>
              <h3>Чистка та обслуговування</h3>
              <p>Періодичне очищення внутрішніх вузлів та перевірка стану обладнання.</p>
              <button type="button" data-open-chat data-service="boiler-cleaning" aria-label="Написати менеджеру щодо чистки та обслуговування котла">Написати менеджеру <span aria-hidden="true">&#8594;</span></button>
            </article>

            <article className="service-direction">
              <p className="service-number">03</p>
              <h3>Встановлення або заміна</h3>
              <p>Встановлення нового котла або заміна наявного обладнання після уточнення деталей.</p>
              <button type="button" data-open-chat data-service="boiler-installation" aria-label="Написати менеджеру щодо встановлення або заміни котла">Написати менеджеру <span aria-hidden="true">&#8594;</span></button>
            </article>
          </div>
        </section>

        <section className="boiler-symptoms" id="symptoms">
          <div className="boiler-symptoms-heading">
            <p className="section-kicker">Ремонт котлів</p>
            <h2>З якими несправностями можна звернутися?</h2>
            <p>Якщо вашої ситуації немає у списку, опишіть її менеджеру — він уточнить деталі звернення.</p>
            <button type="button" data-open-chat data-service="boiler-repair">Описати несправність менеджеру</button>
          </div>

          <ul className="boiler-symptom-list">
            <li><span>01</span><strong>Котел не вмикається або сам вимикається</strong></li>
            <li><span>02</span><strong>Не нагріває воду</strong></li>
            <li><span>03</span><strong>Не прогріває систему опалення</strong></li>
            <li><span>04</span><strong>Падає або зростає тиск</strong></li>
            <li><span>05</span><strong>Показує код помилки</strong></li>
            <li><span>06</span><strong>Шумить, протікає або працює нестабільно</strong></li>
          </ul>
        </section>

        <section className="boiler-maintenance" id="maintenance">
          <div className="boiler-maintenance-heading">
            <p className="section-kicker">Чистка та обслуговування</p>
            <h2>Коли варто звернутися щодо обслуговування?</h2>
            <p>Обслуговування потрібне не лише після появи помилки. Менеджер уточнить модель котла, коли його обслуговували востаннє та що змінилося в роботі.</p>
            <button type="button" data-open-chat data-service="boiler-cleaning">Запитати про обслуговування</button>
          </div>

          <div className="boiler-maintenance-details">
            <ul className="boiler-maintenance-list">
              <li><span aria-hidden="true">&#10003;</span><strong>Котел давно не проходив обслуговування</strong></li>
              <li><span aria-hidden="true">&#10003;</span><strong>Потрібна планова чистка без явної несправності</strong></li>
              <li><span aria-hidden="true">&#10003;</span><strong>Обладнання запускають після тривалої перерви</strong></li>
              <li><span aria-hidden="true">&#10003;</span><strong>Потрібна перевірка перед опалювальним сезоном</strong></li>
            </ul>
            <p className="boiler-maintenance-note">Перелік робіт визначається після уточнення моделі та огляду обладнання.</p>
          </div>
        </section>

        <section className="boiler-installation" id="installation">
          <div className="boiler-installation-heading">
            <div>
              <p className="section-kicker">Встановлення та заміна</p>
              <h2>Новий котел чи заміна наявного?</h2>
            </div>
            <p>Перед виїздом менеджер уточнить модель обладнання, місце встановлення та чи потрібно демонтувати старий котел.</p>
          </div>

          <div className="boiler-installation-options">
            <article>
              <span aria-hidden="true">01</span>
              <h3>Встановлення нового котла</h3>
              <p>Якщо котел встановлюють уперше, опишіть обладнання та місце, де планується монтаж.</p>
            </article>
            <article>
              <span aria-hidden="true">02</span>
              <h3>Заміна котла</h3>
              <p>Якщо потрібно замінити наявний котел, повідомте його модель і модель нового обладнання, якщо вже обрали.</p>
            </article>
          </div>

          <div className="boiler-installation-action">
            <p>Точний обсяг робіт майстер визначить після огляду обладнання та підключень.</p>
            <button type="button" data-open-chat data-service="boiler-installation">Обговорити встановлення або заміну</button>
          </div>
        </section>

        <section className="boiler-request-guide" id="request-guide">
          <div className="boiler-request-guide-heading">
            <div>
              <p className="section-kicker">Перед зверненням</p>
              <h2>Що допоможе швидше оформити звернення</h2>
              <p>Якщо чогось не знаєте, менеджер допоможе уточнити.</p>
            </div>
            <button type="button" data-open-chat>Описати проблему менеджеру</button>
          </div>

          <ul className="boiler-request-guide-list">
            <li><strong>Марка і модель</strong><span>Якщо відомі</span></li>
            <li><strong>Несправність</strong><span>Що сталося або який код помилки</span></li>
            <li><strong>Адреса</strong><span>Куди приїхати майстру</span></li>
            <li><strong>Фото або відео</strong><span>За можливості</span></li>
          </ul>
        </section>

        <section className="boiler-terms" id="terms">
          <div className="boiler-terms-heading">
            <p className="section-kicker">Умови робіт</p>
            <h2>Як узгоджується ремонт</h2>
            <p>До початку робіт ви знатимете умови виїзду, результати огляду та погоджену вартість ремонту.</p>
          </div>

          <div className="boiler-terms-steps">
            <article>
              <span>Перед виїздом</span>
              <h3>Виїзд і діагностика</h3>
              <p>Оплачуються окремо. Менеджер уточнить умови перед виїздом майстра.</p>
            </article>
            <article>
              <span>На місці</span>
              <h3>Огляд обладнання</h3>
              <p>Майстер оглядає котел і визначає, які роботи потрібні.</p>
            </article>
            <article>
              <span>Перед ремонтом</span>
              <h3>Погодження ремонту</h3>
              <p>Вартість ремонту повідомляється після огляду. Роботи починаються після вашої згоди.</p>
            </article>
          </div>
        </section>

        <PricingSection />

        <aside className="boiler-safety" id="safety" aria-labelledby="boiler-safety-title">
          <div>
            <p className="section-kicker">Важливо для безпеки</p>
            <h2 id="boiler-safety-title">Не розбирайте газовий котел самостійно</h2>
          </div>
          <p>Якщо відчули запах газу, не користуйтеся відкритим вогнем, не вмикайте й не вимикайте світло або електроприлади. Перекрийте газ, відчиніть вікна, залиште приміщення та зателефонуйте до аварійної газової служби з безпечного місця.</p>
          <a href="tel:104" aria-label="Зателефонувати до аварійної газової служби 104">Аварійна газова служба <strong>104</strong></a>
        </aside>

        <section className="boiler-final-cta" id="contact">
          <div>
            <p className="section-kicker">Зв’язок з RemTech</p>
            <h2>Потрібна допомога з котлом?</h2>
            <p>Опишіть ситуацію в чаті або зателефонуйте. Менеджер уточнить деталі та погодить зручний час для зв’язку.</p>
          </div>
          <div className="boiler-final-actions">
            <button type="button" data-open-chat>Написати менеджеру</button>
            <a href="tel:+380000000000">Зателефонувати</a>
          </div>
        </section>
      </main>

      <Footer />
      <ChatPanel defaultService="boiler-repair" />
    </>
  );
}
