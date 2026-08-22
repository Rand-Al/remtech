export type PricingLocale = "uk" | "ru";
export type PricingService =
  | "boiler-repair"
  | "boiler-cleaning"
  | "boiler-installation"
  | "washer"
  | "dishwasher"
  | "other";

type LocalizedText = Record<PricingLocale, string>;

export type PriceValue =
  | { kind: "fixed"; amount: number }
  | { kind: "range"; min: number; max: number }
  | { kind: "from"; amount: number }
  | { kind: "after-inspection" }
  | { kind: "individual" };

export type PriceItem = {
  label: LocalizedText;
  value: PriceValue;
  services: readonly PricingService[];
  customerVisible: boolean;
};

export const pricingCatalog = {
  currency: "UAH",
  rules: {
    visitAndDiagnosticsPaidSeparately: true,
    repairPriceAfterInspection: true,
  },
  items: {
    "visit-brovary": {
      label: {
        uk: "Виїзд майстра у Броварах",
        ru: "Выезд мастера в Броварах",
      },
      value: { kind: "fixed", amount: 400 },
      services: [
        "boiler-repair",
        "boiler-cleaning",
        "boiler-installation",
        "washer",
        "dishwasher",
        "other",
      ],
      customerVisible: true,
    },
    "boiler-diagnostics": {
      label: {
        uk: "Діагностика двоконтурного котла",
        ru: "Диагностика двухконтурного котла",
      },
      value: { kind: "range", min: 500, max: 800 },
      services: ["boiler-repair", "boiler-cleaning", "boiler-installation"],
      customerVisible: true,
    },
    "boiler-maintenance": {
      label: {
        uk: "Чистка та обслуговування",
        ru: "Чистка и обслуживание",
      },
      value: { kind: "from", amount: 1500 },
      services: ["boiler-cleaning"],
      customerVisible: true,
    },
    "boiler-installation": {
      label: {
        uk: "Встановлення нового котла",
        ru: "Установка нового котла",
      },
      value: { kind: "from", amount: 3500 },
      services: ["boiler-installation"],
      customerVisible: true,
    },
    "boiler-replacement": {
      label: {
        uk: "Заміна наявного котла",
        ru: "Замена имеющегося котла",
      },
      value: { kind: "from", amount: 2800 },
      services: ["boiler-installation"],
      customerVisible: true,
    },
    "boiler-repair": {
      label: {
        uk: "Ремонт і запчастини",
        ru: "Ремонт и запчасти",
      },
      value: { kind: "after-inspection" },
      services: ["boiler-repair"],
      customerVisible: true,
    },
  } satisfies Record<string, PriceItem>,
} as const;

export type PriceId = keyof typeof pricingCatalog.items;

// Переопределения из админки: только значения, подписи остаются из каталога.
export type PriceOverrides = Partial<Record<PriceId, PriceValue>>;

export function getPriceItem(id: PriceId): PriceItem {
  return pricingCatalog.items[id];
}

// Единая точка чтения цены: каталог как дефолт плюс сохранённые в базе правки.
export function resolvePriceItem(id: PriceId, overrides?: PriceOverrides): PriceItem {
  const item = pricingCatalog.items[id];
  const override = overrides?.[id];
  if (!override) return item;
  return { ...item, value: override };
}

export function getCustomerPrices(
  ids: readonly PriceId[],
  overrides?: PriceOverrides
): PriceItem[] {
  return ids
    .map((id) => resolvePriceItem(id, overrides))
    .filter((item) => item.customerVisible);
}

export function getDiagnosticPrice(
  service: string,
  overrides?: PriceOverrides
): PriceItem | null {
  const item = resolvePriceItem("boiler-diagnostics", overrides);
  return item.services.includes(service as PricingService) ? item : null;
}

export function formatPrice(value: PriceValue, locale: PricingLocale): string {
  const numberLocale = locale === "uk" ? "uk-UA" : "ru-RU";
  const number = (amount: number) => new Intl.NumberFormat(numberLocale).format(amount);

  if (value.kind === "fixed") return `${number(value.amount)} грн`;
  if (value.kind === "range") return `${number(value.min)}–${number(value.max)} грн`;
  if (value.kind === "from") {
    return `${locale === "uk" ? "від" : "от"} ${number(value.amount)} грн`;
  }
  if (value.kind === "after-inspection") {
    return locale === "uk" ? "після огляду" : "после осмотра";
  }
  return locale === "uk" ? "індивідуально" : "индивидуально";
}
