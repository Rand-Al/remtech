export type LocalizedText = {
  uk: string;
  ru: string;
};

export type SiteContacts = {
  /** Отображаемый номер, например +38 000 000 00 00 */
  phone: string;
  telegramUrl: string;
  /** Подпись ссылки Telegram в контактах, например @example */
  telegramLabel: string;
  schedule: LocalizedText;
  area: LocalizedText;
};

export const DEFAULT_CONTACTS: SiteContacts = {
  phone: "+38 000 000 00 00",
  telegramUrl: "https://t.me/example",
  telegramLabel: "@example",
  schedule: {
    uk: "Щодня, 10:00–18:00",
    ru: "Ежедневно, 10:00–18:00",
  },
  area: {
    uk: "Бровари та Броварський район",
    ru: "Бровары и Броварский район",
  },
};

/** tel:-ссылка из отображаемого номера телефона */
export function phoneHrefFromPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("380")) return `tel:+${digits}`;
  if (digits.startsWith("0")) return `tel:+38${digits}`;
  return `tel:+${digits}`;
}

export function contactsWithDefaults(
  value: Partial<SiteContacts> | null | undefined
): SiteContacts {
  if (!value) return { ...DEFAULT_CONTACTS };
  return {
    phone: value.phone?.trim() || DEFAULT_CONTACTS.phone,
    telegramUrl: value.telegramUrl?.trim() || DEFAULT_CONTACTS.telegramUrl,
    telegramLabel: value.telegramLabel?.trim() || DEFAULT_CONTACTS.telegramLabel,
    schedule: {
      uk: value.schedule?.uk?.trim() || DEFAULT_CONTACTS.schedule.uk,
      ru: value.schedule?.ru?.trim() || DEFAULT_CONTACTS.schedule.ru,
    },
    area: {
      uk: value.area?.uk?.trim() || DEFAULT_CONTACTS.area.uk,
      ru: value.area?.ru?.trim() || DEFAULT_CONTACTS.area.ru,
    },
  };
}
