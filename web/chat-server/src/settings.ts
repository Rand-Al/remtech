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

// Настройки LLM-провайдера хранятся в базе под ключом "llm".
// Пустой baseUrl означает возврат к заглушке (StubLlmAdapter).
export interface LlmSettings {
  baseUrl: string;
  apiKey: string;
  model: string;
  fallbackModels: string[];
  enableThinking: boolean | null;
}

export type LlmValidation =
  | { ok: true; value: LlmSettings }
  | { ok: false; errors: string[] };

const LLM_URL_PATTERN = /^https?:\/\/\S+$/i;

export const EMPTY_LLM_SETTINGS: LlmSettings = {
  baseUrl: "",
  apiKey: "",
  model: "",
  fallbackModels: [],
  enableThinking: null,
};

export function validateLlmSettings(input: unknown): LlmValidation {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Настройки LLM переданы неверно"] };
  }
  const raw = input as Record<string, unknown>;

  const baseUrl = typeof raw.baseUrl === "string" ? raw.baseUrl.trim() : "";
  if (baseUrl.length > 300) {
    errors.push("Адрес API: максимум 300 символов");
  } else if (baseUrl && !LLM_URL_PATTERN.test(baseUrl)) {
    errors.push("Адрес API: должен начинаться с http:// или https://");
  }

  // Пустой адрес — осознанный выбор «работать на заглушке».
  if (!baseUrl) {
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, value: { ...EMPTY_LLM_SETTINGS } };
  }

  const model = typeof raw.model === "string" ? raw.model.trim() : "";
  if (!model) {
    errors.push("Модель: укажите имя модели");
  } else if (model.length > 120) {
    errors.push("Модель: максимум 120 символов");
  }

  const apiKey = typeof raw.apiKey === "string" ? raw.apiKey.trim() : "";
  if (apiKey.length > 300) {
    errors.push("API-ключ: максимум 300 символов");
  }

  let fallbackModels: string[] = [];
  const rawFallbacks = raw.fallbackModels;
  if (typeof rawFallbacks === "string") {
    fallbackModels = rawFallbacks
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  } else if (Array.isArray(rawFallbacks)) {
    fallbackModels = rawFallbacks.map((item) => String(item).trim()).filter(Boolean);
  }
  if (fallbackModels.some((item) => item.length > 120)) {
    errors.push("Резервные модели: максимум 120 символов на модель");
  }
  if (fallbackModels.length > 10) {
    errors.push("Резервные модели: не больше 10");
  }
  fallbackModels = [...new Set(fallbackModels)].filter((item) => item !== model);

  let enableThinking: boolean | null = null;
  if (typeof raw.enableThinking === "boolean") enableThinking = raw.enableThinking;

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: { baseUrl, apiKey, model, fallbackModels, enableThinking },
  };
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
