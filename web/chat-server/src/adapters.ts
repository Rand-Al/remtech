import type { LlmAdapter } from "./llm/adapter.js";
import { StubLlmAdapter } from "./llm/stub.js";
import { OpenAiCompatibleLlmAdapter } from "./llm/openai.js";
import type { TelegramAdapter } from "./telegram/adapter.js";
import { StubTelegramAdapter } from "./telegram/stub.js";

export function createLlmAdapter(): LlmAdapter {
  const baseUrl = process.env.RT_LLM_BASE_URL;
  if (baseUrl) {
    return new OpenAiCompatibleLlmAdapter({
      baseUrl,
      apiKey: process.env.RT_LLM_API_KEY,
      model: process.env.RT_LLM_MODEL ?? "local-model",
      timeoutMs: Number(process.env.RT_LLM_TIMEOUT_MS ?? 120_000),
    });
  }
  return new StubLlmAdapter();
}

export function createTelegramAdapter(): TelegramAdapter {
  return new StubTelegramAdapter();
}