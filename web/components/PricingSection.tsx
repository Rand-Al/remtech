import {
  formatPrice,
  getCustomerPrices,
  type PriceId,
  type PricingLocale,
} from "@/shared/pricing";

const BOILER_PRICE_IDS: readonly PriceId[] = [
  "visit-brovary",
  "boiler-diagnostics",
  "boiler-maintenance",
  "boiler-installation",
  "boiler-replacement",
  "boiler-repair",
];

const TEXTS = {
  uk: {
    kicker: "Орієнтовна вартість",
    title: "Вартість послуг",
    copy: "Точна сума залежить від моделі котла, стану обладнання та обсягу потрібних робіт.",
    button: "Уточнити вартість",
    listAria: "Орієнтовна вартість послуг",
    note: "Виїзд і діагностика оплачуються окремо. Роботи та запчастини погоджуються до початку ремонту.",
  },
  ru: {
    kicker: "Ориентировочная стоимость",
    title: "Стоимость услуг",
    copy: "Точная сумма зависит от модели котла, состояния оборудования и объема нужных работ.",
    button: "Уточнить стоимость",
    listAria: "Ориентировочная стоимость услуг",
    note: "Выезд и диагностика оплачиваются отдельно. Работы и запчасти согласуются до начала ремонта.",
  },
} as const;

export default function PricingSection({ lang = "uk" }: { lang?: "uk" | "ru" }) {
  const prices = getCustomerPrices(BOILER_PRICE_IDS);
  const t = TEXTS[lang];
  const locale: PricingLocale = lang;

  return (
    <section className="boiler-prices" id="prices">
      <div className="boiler-prices-heading">
        <p className="section-kicker">{t.kicker}</p>
        <h2>{t.title}</h2>
        <p>{t.copy}</p>
        <button type="button" data-open-chat>{t.button}</button>
      </div>

      <div className="boiler-price-list" aria-label={t.listAria}>
        {prices.map((item) => (
          <div key={item.label.uk}>
            <span>{item.label[locale]}</span>
            <strong>{formatPrice(item.value, locale)}</strong>
          </div>
        ))}
        <p>{t.note}</p>
      </div>
    </section>
  );
}
