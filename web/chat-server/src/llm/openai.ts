import type { ChatMessage, LlmAdapter, LlmResponse } from "./adapter.js";

export interface OpenAiCompatibleOptions {
  baseUrl: string;
  apiKey?: string;
  model: string;
  fallbackModels?: string[];
  useNativeModelFallbacks?: boolean;
  enableThinking?: boolean;
  timeoutMs?: number;
  attemptTimeoutMs?: number;
  fetchImpl?: (input: string, init?: RequestInit) => Promise<Response>;
}

export class OpenAiCompatibleLlmAdapter implements LlmAdapter {
  readonly name: string;

  private readonly baseUrl: string;
  private readonly apiKey?: string;
  private readonly model: string;
  private readonly fallbackModels: string[];
  private readonly useNativeModelFallbacks: boolean;
  private readonly enableThinking?: boolean;
  private readonly timeoutMs: number;
  private readonly attemptTimeoutMs: number;
  private readonly fetchImpl: (input: string, init?: RequestInit) => Promise<Response>;
  private readonly unavailableUntil = new Map<string, number>();

  constructor(options: OpenAiCompatibleOptions) {
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.apiKey = options.apiKey;
    this.model = options.model;
    this.fallbackModels = (options.fallbackModels ?? []).filter(
      (model, index, models) => model !== this.model && models.indexOf(model) === index
    );
    this.useNativeModelFallbacks = options.useNativeModelFallbacks ?? false;
    this.enableThinking = options.enableThinking;
    this.timeoutMs = options.timeoutMs ?? 120_000;
    this.attemptTimeoutMs = options.attemptTimeoutMs ?? 20_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
    const fallbackLabel = this.fallbackModels.length
      ? ` (+${this.fallbackModels.length} fallback)`
      : "";
    this.name = `openai-compatible:${this.model}${fallbackLabel}`;
  }

  async chat(messages: ChatMessage[]): Promise<LlmResponse> {
    const configuredModels = [this.model, ...this.fallbackModels];
    const now = Date.now();
    let remainingModels = this.useNativeModelFallbacks
      ? configuredModels
      : configuredModels.filter(
          (model) => (this.unavailableUntil.get(model) ?? 0) <= now
        );
    if (remainingModels.length === 0) remainingModels = configuredModels;

    const deadline = Date.now() + this.timeoutMs;
    let lastEmptyModel = this.model;

    while (remainingModels.length > 0) {
      const currentModel = remainingModels[0];
      const remainingTime = deadline - Date.now();
      if (remainingTime <= 0) {
        throw new Error("Истекло время ожидания резервной цепочки LLM");
      }

      let result: Awaited<ReturnType<typeof this.requestCompletion>>;
      const startedAt = Date.now();
      try {
        result = await this.requestCompletion(
          messages,
          currentModel,
          this.useNativeModelFallbacks ? remainingModels.slice(1) : [],
          this.useNativeModelFallbacks
            ? remainingTime
            : Math.min(this.attemptTimeoutMs, remainingTime)
        );
      } catch (error) {
        if (this.useNativeModelFallbacks || remainingModels.length === 1) {
          throw error;
        }
        this.unavailableUntil.set(currentModel, Date.now() + 5 * 60_000);
        console.warn(
          "[llm] " +
            currentModel +
            " завершилась ошибкой через " +
            (Date.now() - startedAt) +
            " мс; используется резервная модель"
        );
        remainingModels = remainingModels.slice(1);
        continue;
      }
      const content = extractTextContent(result.content);

      if (content) {
        console.info(
          "[llm] " +
            (result.model ?? currentModel) +
            " ответила за " +
            (Date.now() - startedAt) +
            " мс"
        );
        return { content, model: result.model };
      }

      lastEmptyModel = result.model ?? currentModel;
      if (!this.useNativeModelFallbacks) {
        this.unavailableUntil.set(currentModel, Date.now() + 5 * 60_000);
      }
      if (this.useNativeModelFallbacks) {
        const usedModelIndex = remainingModels.indexOf(lastEmptyModel);
        remainingModels =
          usedModelIndex >= 0 ? remainingModels.slice(usedModelIndex + 1) : [];
      } else {
        remainingModels = remainingModels.slice(1);
      }
    }

    throw new Error(`LLM API ${lastEmptyModel} вернул пустой ответ`);
  }

  private async requestCompletion(
    messages: ChatMessage[],
    model: string,
    fallbackModels: string[],
    timeoutMs: number
  ): Promise<{
    model?: string;
    content?: string | { type?: string; text?: string }[];
  }> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await this.fetchImpl(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          ...(fallbackModels.length > 0 ? { models: fallbackModels } : {}),
          messages,
          temperature: 0.6,
          ...(this.enableThinking === undefined
            ? {}
            : { enable_thinking: this.enableThinking }),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        throw new Error(`LLM API ${response.status}: ${detail.slice(0, 300)}`);
      }

      const data = (await response.json()) as {
        model?: string;
        choices?: {
          message?: { content?: string | { type?: string; text?: string }[] };
        }[];
      };

      return { content: data.choices?.[0]?.message?.content, model: data.model };
    } finally {
      clearTimeout(timer);
    }
  }
}

function extractTextContent(
  content: string | { type?: string; text?: string }[] | undefined
): string {
  if (typeof content === "string") return content.trim();
  if (!Array.isArray(content)) return "";
  return content
    .filter((part) => part.type === "text" && typeof part.text === "string")
    .map((part) => part.text?.trim() ?? "")
    .filter(Boolean)
    .join("\n");
}
