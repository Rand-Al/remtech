import {
  formatPrice,
  getCustomerPrices,
  type PriceId,
} from "@/shared/pricing";

const BOILER_PRICE_IDS: readonly PriceId[] = [
  "visit-brovary",
  "boiler-diagnostics",
  "boiler-maintenance",
  "boiler-installation",
  "boiler-replacement",
  "boiler-repair",
];

export default function PricingSection() {
  const prices = getCustomerPrices(BOILER_PRICE_IDS);

  return (
    <section className="boiler-prices" id="prices">
      <div className="boiler-prices-heading">
        <p className="section-kicker">Орієнтовна вартість</p>
        <h2>Вартість послуг</h2>
        <p>Точна сума залежить від моделі котла, стану обладнання та обсягу потрібних робіт.</p>
        <button type="button" data-open-chat>Уточнити вартість</button>
      </div>

      <div className="boiler-price-list" aria-label="Орієнтовна вартість послуг">
        {prices.map((item) => (
          <div key={item.label.uk}>
            <span>{item.label.uk}</span>
            <strong>{formatPrice(item.value, "uk")}</strong>
          </div>
        ))}
        <p>Виїзд і діагностика оплачуються окремо. Роботи та запчастини погоджуються до початку ремонту.</p>
      </div>
    </section>
  );
}
