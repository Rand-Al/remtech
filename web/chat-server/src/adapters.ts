import type { LlmAdapter } from "./llm/adapter.js";
import { StubLlmAdapter } from "./llm/stub.js";
import type { TelegramAdapter } from "./telegram/adapter.js";
import { StubTelegramAdapter } from "./telegram/stub.js";

export function createLlmAdapter(): LlmAdapter {
  return new StubLlmAdapter();
}

export function createTelegramAdapter(): TelegramAdapter {
  return new StubTelegramAdapter();
}