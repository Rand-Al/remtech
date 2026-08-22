import type { Metadata } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ChatPanel from "@/components/ChatPanel";
import { getContacts } from "@/lib/contacts";
import { phoneHrefFromPhone } from "@/shared/settings";

export const metadata: Metadata = {
  title: "Ремонт посудомийних машин у Броварах — RemTech",
  description:
    "Ремонт посудомийних машин у Броварах та Броварському районі з виїздом майстра.",
  alternates: {
    canonical: "https://example.com/posudomyini-mashyny/",
    languages: {
      uk: "https://example.com/posudomyini-mashyny/",
      ru: "https://example.com/ru/posudomyini-mashyny/",
    },
  },
  openGraph: {
    type: "website",
    title: "Ремонт посудомийних машин у Броварах — RemTech",
    url: "https://example.com/posudomyini-mashyny/",
    description:
      "Ремонт посудомийних машин у Броварах та Броварському районі з виїздом майстра та діагностикою.",
  },
};

export default async function PosudomyiniMashynyPage() {
  const contacts = await getContacts();
  const phoneHref = phoneHrefFromPhone(contacts.phone);
  return (
    <>
      <Header altLangHref="/ru/posudomyini-mashyny/" />

      <main>
        <section className="hero service-page-hero dishwasher-page-hero">
          <div className="hero-image" role="img" aria-label="Посудомийна машина у домашньому приміщенні"></div>
          <div className="hero-content">
            <p className="location">Посудомийні машини · Бровари та Броварський район</p>
            <h1>Ремонт посудомийних машин у Броварах та Броварському районі</h1>
            <p className="hero-copy">Посудомийна машина не миє посуд, не зливає воду, протікає або показує помилку? Опишіть несправність — менеджер уточнить деталі для майстра.</p>

            <div className="hero-actions">
              <button className="primary-button" type="button" data-open-chat>Написати менеджеру</button>
              <a className="secondary-button" href={phoneHref}>Зателефонувати</a>
            </div>
          </div>
        </section>

        <section className="dishwasher-symptoms" id="symptoms">
          <div className="dishwasher-symptoms-heading">
            <p className="section-kicker">Ремонт посудомийних машин</p>
            <h2>З якими несправностями можна звернутися?</h2>
            <p>Якщо вашої ситуації немає у списку, опишіть її менеджеру — він уточнить деталі звернення.</p>
            <button type="button" data-open-chat data-service="dishwasher">Описати несправність менеджеру</button>
          </div>

          <ul className="dishwasher-symptom-list">
            <li><span>01</span><strong>Не вмикається або раптом вимикається</strong></li>
            <li><span>02</span><strong>Не набирає воду або набирає дуже повільно</strong></li>
            <li><span>03</span><strong>Погано миє посуд</strong></li>
            <li><span>04</span><strong>Не зливає воду</strong></li>
            <li><span>05</span><strong>Підтікає вода</strong></li>
            <li><span>06</span><strong>Сильно шумить або вібрує</strong></li>
            <li><span>07</span><strong>Показує код помилки</strong></li>
          </ul>
        </section>

        <section className="dishwasher-request-guide" id="request-guide">
          <div className="dishwasher-request-guide-heading">
            <div>
              <p className="section-kicker">Перед зверненням</p>
              <h2>Що допоможе швидше оформити звернення</h2>
              <p>Якщо чогось не знаєте, менеджер допоможе уточнити.</p>
            </div>
            <button type="button" data-open-chat>Описати проблему менеджеру</button>
          </div>

          <ul className="dishwasher-request-guide-list">
            <li><strong>Марка і модель</strong><span>Якщо відомі</span></li>
            <li><strong>Несправність</strong><span>Що сталося або який код помилки</span></li>
            <li><strong>Адреса</strong><span>Куди приїхати майстру</span></li>
            <li><strong>Фото або відео</strong><span>За можливості</span></li>
          </ul>
        </section>

        <section className="dishwasher-terms" id="terms">
          <div className="dishwasher-terms-heading">
            <p className="section-kicker">Умови робіт</p>
            <h2>Як узгоджується ремонт</h2>
            <p>До початку робіт ви знатимете умови виїзду, результати огляду та погоджену вартість ремонту.</p>
          </div>

          <div className="dishwasher-terms-steps">
            <article>
              <span>Перед виїздом</span>
              <h3>Виїзд і діагностика</h3>
              <p>Виїзд і діагностика оплачуються окремо. Менеджер пояснить умови до виїзду майстра.</p>
            </article>
            <article>
              <span>На місці</span>
              <h3>Огляд машини</h3>
              <p>Майстер огляне посудомийну машину і визначить обсяг потрібних робіт.</p>
            </article>
            <article>
              <span>Перед ремонтом</span>
              <h3>Погодження ремонту</h3>
              <p>Вартість ремонту повідомляємо після огляду. Ремонт починаємо після вашої згоди.</p>
            </article>
          </div>
        </section>

        <section className="dishwasher-final-cta" id="contact">
          <div>
            <p className="section-kicker">Зв’язок з RemTech</p>
            <h2>Потрібна допомога з посудомийною машиною?</h2>
            <p>Опишіть ситуацію в чаті або зателефонуйте. Менеджер уточнить деталі та погодить зручний час для зв’язку.</p>
          </div>
          <div className="dishwasher-final-actions">
            <button type="button" data-open-chat>Написати менеджеру</button>
            <a href={phoneHref}>Зателефонувати</a>
          </div>
        </section>
      </main>

      <Footer altLangHref="/ru/posudomyini-mashyny/" />
      <ChatPanel defaultService="dishwasher" />
    </>
  );
}
