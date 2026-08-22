import {
  contactsWithDefaults,
  type SiteContacts,
} from "../../shared/settings.js";

export type ContactsValidation =
  | { ok: true; value: SiteContacts }
  | { ok: false; errors: string[] };

const PHONE_PATTERN = /^\+?[\d\s()-]{9,20}$/;
const TELEGRAM_URL_PATTERN = /^https:\/\/t\.me\/[A-Za-z0-9_]{4,32}$/;

function checkLocalized(
  value: unknown,
  field: string,
  errors: string[],
  maxLength = 120
): void {
  if (typeof value !== "object" || value === null) {
    errors.push(`Поле ${field} заполнено неверно`);
    return;
  }
  for (const lang of ["uk", "ru"] as const) {
    const text = (value as Record<string, unknown>)[lang];
    if (typeof text !== "string" || !text.trim()) {
      errors.push(`${field}: заполните ${lang.toUpperCase()}`);
    } else if (text.trim().length > maxLength) {
      errors.push(`${field}: максимум ${maxLength} символов`);
    }
  }
}

export function validateContacts(input: unknown): ContactsValidation {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Контакты переданы неверно"] };
  }
  const raw = input as Record<string, unknown>;

  const phone = typeof raw.phone === "string" ? raw.phone.trim() : "";
  if (!PHONE_PATTERN.test(phone)) {
    errors.push("Телефон: укажите номер в международном формате, например +38 050 123 45 67");
  }

  const telegramUrl =
    typeof raw.telegramUrl === "string" ? raw.telegramUrl.trim() : "";
  if (!TELEGRAM_URL_PATTERN.test(telegramUrl)) {
    errors.push("Telegram: ссылка вида https://t.me/имя_канала");
  }

  const telegramLabel =
    typeof raw.telegramLabel === "string" ? raw.telegramLabel.trim() : "";
  if (!telegramLabel || telegramLabel.length > 40) {
    errors.push("Подпись Telegram: от 1 до 40 символов");
  }

  checkLocalized(raw.schedule, "График работы", errors);
  checkLocalized(raw.area, "Зона выезда", errors);

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: contactsWithDefaults({
      phone,
      telegramUrl,
      telegramLabel,
      schedule: raw.schedule as SiteContacts["schedule"],
      area: raw.area as SiteContacts["area"],
    }),
  };
}
