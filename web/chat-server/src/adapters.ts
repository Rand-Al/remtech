import type { LlmAdapter } from "./llm/adapter.js";
import { StubLlmAdapter } from "./llm/stub.js";
import { OpenAiCompatibleLlmAdapter } from "./llm/openai.js";
import type { TelegramAdapter } from "./telegram/adapter.js";
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

export function createLlmAdapter(): LlmAdapter {
  const baseUrl = process.env.RT_LLM_BASE_URL;
  if (baseUrl) {
    const configuredFallbacks = process.env.RT_LLM_FALLBACK_MODELS?.trim();
    const isOpenRouter = baseUrl.includes("openrouter.ai");
    const isOpenCodeZen = baseUrl.includes("opencode.ai/zen");
    const fallbackModels = configuredFallbacks
      ? parseModelList(configuredFallbacks)
      : isOpenRouter
        ? DEFAULT_OPENROUTER_FALLBACKS
        : isOpenCodeZen
          ? DEFAULT_ZEN_FALLBACKS
          : [];

    return new OpenAiCompatibleLlmAdapter({
      baseUrl,
      apiKey: process.env.RT_LLM_API_KEY,
      model: process.env.RT_LLM_MODEL ?? "local-model",
      fallbackModels,
      useNativeModelFallbacks: isOpenRouter,
      enableThinking: parseOptionalBoolean(process.env.RT_LLM_ENABLE_THINKING),
      timeoutMs: Number(process.env.RT_LLM_TIMEOUT_MS ?? 120_000),
      attemptTimeoutMs: Number(process.env.RT_LLM_ATTEMPT_TIMEOUT_MS ?? 20_000),
    });
  }
  return new StubLlmAdapter();
}

export function createTelegramAdapter(): TelegramAdapter {
  return new StubTelegramAdapter();
}
