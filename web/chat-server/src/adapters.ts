import type { LlmAdapter } from "./llm/adapter.js";
import { StubLlmAdapter } from "./llm/stub.js";
import { OpenAiCompatibleLlmAdapter } from "./llm/openai.js";
import type { TelegramAdapter } from "./telegram/adapter.js";
import { TelegramBotAdapter } from "./telegram/bot.js";
import { StubTelegramAdapter } from "./telegram/stub.js";

const DEFAULT_OPENROUTER_FALLBACKS = [
  "google/gemma-4-31b-it:free",
  "z-ai/glm-5.2:free",
  "openai/gpt-oss-20b:free",
  "openrouter/free",
];

const DEFAULT_ZEN_FALLBACKS = [
  "nemotron-3.5-lightning-free",
  "nemotron-3-ultra-free",
  "hy3-free",
  "laguna-s-2.1-free",
];

function parseModelList(value: string | undefined): string[] {
  if (value === undefined) return [];
  return value
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function parseOptionalBoolean(value: string | undefined): boolean | undefined {
  if (value === undefined || value.trim() === "") return undefined;
  return ["1", "true", "yes", "on"].includes(value.trim().toLowerCase());
}

export interface LlmAdapterConfig {
  baseUrl?: string;
  apiKey?: string;
  model?: string;
  fallbackModels?: string[];
  enableThinking?: boolean | null;
  timeoutMs?: number;
  attemptTimeoutMs?: number;
}

// Единая точка сборки LLM-адаптера: используется и для env-переменных,
// и для настроек из базы (раздел "LLM" админки).
export function createLlmAdapterFromConfig(config: LlmAdapterConfig): LlmAdapter {
  const baseUrl = config.baseUrl?.trim();
  if (!baseUrl) return new StubLlmAdapter();

  const isOpenRouter = baseUrl.includes("openrouter.ai");
  const isOpenCodeZen = baseUrl.includes("opencode.ai/zen");
  const configuredFallbacks = config.fallbackModels?.filter(Boolean) ?? [];
  const fallbackModels = configuredFallbacks.length
    ? [...new Set(configuredFallbacks)]
    : isOpenRouter
      ? DEFAULT_OPENROUTER_FALLBACKS
      : isOpenCodeZen
        ? DEFAULT_ZEN_FALLBACKS
        : [];

  return new OpenAiCompatibleLlmAdapter({
    baseUrl,
    apiKey: config.apiKey?.trim() || undefined,
    model: config.model ?? "local-model",
    fallbackModels,
    useNativeModelFallbacks: isOpenRouter,
    enableThinking: config.enableThinking ?? undefined,
    timeoutMs:
      config.timeoutMs ?? Number(process.env.RT_LLM_TIMEOUT_MS ?? 120_000),
    attemptTimeoutMs:
      config.attemptTimeoutMs ??
      Number(process.env.RT_LLM_ATTEMPT_TIMEOUT_MS ?? 20_000),
  });
}

export function createLlmAdapter(): LlmAdapter {
  return createLlmAdapterFromConfig({
    baseUrl: process.env.RT_LLM_BASE_URL,
    apiKey: process.env.RT_LLM_API_KEY,
    model: process.env.RT_LLM_MODEL ?? "local-model",
    fallbackModels: parseModelList(process.env.RT_LLM_FALLBACK_MODELS),
    enableThinking: parseOptionalBoolean(process.env.RT_LLM_ENABLE_THINKING) ?? null,
  });
}

export function createTelegramAdapter(): TelegramAdapter {
  return createTelegramAdapterFromConfig({
    botToken: process.env.RT_TELEGRAM_BOT_TOKEN,
    chatId: process.env.RT_TELEGRAM_CHAT_ID,
    requestsThreadId: process.env.RT_TELEGRAM_REQUESTS_THREAD_ID,
    technicalThreadId: process.env.RT_TELEGRAM_TECHNICAL_THREAD_ID,
    perRequestTopics:
      process.env.RT_TELEGRAM_PER_REQUEST_TOPICS?.trim().toLowerCase() === "true",
    timeoutMs: Number(process.env.RT_TELEGRAM_TIMEOUT_MS ?? 10_000),
  });
}

export interface TelegramAdapterConfig {
  botToken?: string;
  chatId?: string;
  requestsThreadId?: string | number | null;
  technicalThreadId?: string | number | null;
  perRequestTopics?: boolean | null;
  timeoutMs?: number;
}

function parseOptionalThreadId(
  value: string | number | null | undefined
): number | undefined {
  if (value === null || value === undefined || String(value).trim() === "") {
    return undefined;
  }
  const parsed = Number(String(value).trim());
  return Number.isInteger(parsed) && parsed !== 0 ? parsed : undefined;
}

// Единая точка сборки Telegram-адаптера: из env или из базы (админка).
export function createTelegramAdapterFromConfig(
  config: TelegramAdapterConfig
): TelegramAdapter {
  const token = config.botToken?.trim();
  const chatId = config.chatId?.trim();
  if (token && chatId) {
    return new TelegramBotAdapter({
      token,
      chatId,
      requestsThreadId: parseOptionalThreadId(config.requestsThreadId),
      technicalThreadId: parseOptionalThreadId(config.technicalThreadId),
      perRequestTopics: config.perRequestTopics === true,
      timeoutMs: config.timeoutMs ?? Number(process.env.RT_TELEGRAM_TIMEOUT_MS ?? 10_000),
    });
  }

  if (token || chatId) {
    console.warn(
      "Адаптер Telegram отключён: нужны токен бота и ID группы одновременно"
    );
  }
  return new StubTelegramAdapter();
}
