import {
  contactsWithDefaults,
  type SiteContacts,
} from "../../shared/settings.js";
import {
  pricingCatalog,
  type PriceId,
  type PriceOverrides,
  type PriceValue,
} from "../../shared/pricing.js";

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

export function validateContacts(input: unknown): ContactsValidation {  const errors: string[] = [];
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

// Настройки цен: карта «id позиции -> значение» поверх каталога-дефолта.
// Подписи и набор позиций из админки не меняются — только стоимость.
export type PricesValidation =
  | { ok: true; value: PriceOverrides }
  | { ok: false; errors: string[] };

const MAX_PRICE_AMOUNT = 10_000_000;

function parsePriceAmount(value: unknown, field: string, errors: string[]): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    errors.push(`${field}: укажите число`);
    return null;
  }
  const rounded = Math.round(value);
  if (rounded < 0 || rounded > MAX_PRICE_AMOUNT) {
    errors.push(`${field}: число от 0 до ${MAX_PRICE_AMOUNT.toLocaleString("ru-RU")}`);
    return null;
  }
  return rounded;
}

function parsePriceValue(input: unknown, errors: string[]): PriceValue | null {
  if (typeof input !== "object" || input === null) {
    errors.push("Значение цены передано неверно");
    return null;
  }
  const raw = input as Record<string, unknown>;
  switch (raw.kind) {
    case "fixed": {
      const amount = parsePriceAmount(raw.amount, "Сумма", errors);
      return amount === null ? null : { kind: "fixed", amount };
    }
    case "from": {
      const amount = parsePriceAmount(raw.amount, "Сумма", errors);
      return amount === null ? null : { kind: "from", amount };
    }
    case "range": {
      const min = parsePriceAmount(raw.min, "Минимум", errors);
      const max = parsePriceAmount(raw.max, "Максимум", errors);
      if (min === null || max === null) return null;
      if (min > max) {
        errors.push("Диапазон: минимум не больше максимума");
        return null;
      }
      return { kind: "range", min, max };
    }
    case "after-inspection":
      return { kind: "after-inspection" };
    case "individual":
      return { kind: "individual" };
    default:
      errors.push("Неизвестный тип цены");
      return null;
  }
}

export function validatePriceOverrides(input: unknown): PricesValidation {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Цены переданы неверно"] };
  }
  const raw = input as Record<string, unknown>;
  const knownIds = Object.keys(pricingCatalog.items) as PriceId[];
  const unknownIds = Object.keys(raw).filter((key) => !knownIds.includes(key as PriceId));
  if (unknownIds.length > 0) {
    return { ok: false, errors: ["Неизвестная позиция цены"] };
  }

  const value: PriceOverrides = {};
  for (const id of knownIds) {
    // Отсутствующий ключ означает «оставить значение каталога».
    if (raw[id] === undefined) continue;
    const parsed = parsePriceValue(raw[id], errors);
    if (parsed) value[id] = parsed;
  }

  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, value };
}

// Настройки Telegram-бота из админки. Пустой ID группы означает возврат
// к заглушке; пустой токен при сохранении означает «оставить прежний».
export interface TelegramSettings {
  botToken: string;
  chatId: string;
  requestsThreadId: string | null;
  technicalThreadId: string | null;
  perRequestTopics: boolean;
}

export type TelegramValidation =
  | { ok: true; value: TelegramSettings }
  | { ok: false; errors: string[] };

export const EMPTY_TELEGRAM_SETTINGS: TelegramSettings = {
  botToken: "",
  chatId: "",
  requestsThreadId: null,
  technicalThreadId: null,
  perRequestTopics: false,
};

const TELEGRAM_TOKEN_PATTERN = /^[^:\s]+:[^:\s]+$/;
const TELEGRAM_CHAT_ID_PATTERN = /^(-?\d{5,25}|@[A-Za-z0-9_]{4,64})$/;
const THREAD_ID_PATTERN = /^-?\d{1,20}$/;

function parseThreadIdInput(
  value: unknown,
  field: string,
  errors: string[]
): string | null {
  if (value === undefined || value === null) return null;
  const text = String(value).trim();
  if (!text) return null;
  if (!THREAD_ID_PATTERN.test(text)) {
    errors.push(`${field}: целое число или пусто`);
    return null;
  }
  return text;
}

export function validateTelegramSettings(input: unknown): TelegramValidation {
  const errors: string[] = [];
  if (typeof input !== "object" || input === null) {
    return { ok: false, errors: ["Настройки Telegram переданы неверно"] };
  }
  const raw = input as Record<string, unknown>;

  const chatId = typeof raw.chatId === "string" ? raw.chatId.trim() : "";
  if (!chatId) {
    // Осознанная очистка конфигурации — работа на заглушке.
    if (errors.length > 0) return { ok: false, errors };
    return { ok: true, value: { ...EMPTY_TELEGRAM_SETTINGS } };
  }
  if (!TELEGRAM_CHAT_ID_PATTERN.test(chatId)) {
    errors.push("ID группы: число вроде -1001234567890 или @имя_канала");
  }

  const botToken = typeof raw.botToken === "string" ? raw.botToken.trim() : "";
  if (botToken && !TELEGRAM_TOKEN_PATTERN.test(botToken)) {
    errors.push("Токен бота: строка вида 123456789:AAE...");
  }

  const requestsThreadId = parseThreadIdInput(
    raw.requestsThreadId,
    "Тема заявок",
    errors
  );
  const technicalThreadId = parseThreadIdInput(
    raw.technicalThreadId,
    "Техническая тема",
    errors
  );

  if (errors.length > 0) return { ok: false, errors };

  return {
    ok: true,
    value: {
      botToken,
      chatId,
      requestsThreadId,
      technicalThreadId,
      perRequestTopics: raw.perRequestTopics === true,
    },
  };
}
