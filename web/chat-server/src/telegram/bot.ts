import type {
  TelegramAdapter,
  TelegramManagerReply,
  TelegramMessageReference,
  TelegramRequest,
} from "./adapter.js";

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export type TelegramBotOptions = {
  token: string;
  chatId: string;
  requestsThreadId?: number;
  technicalThreadId?: number;
  perRequestTopics?: boolean;
  timeoutMs?: number;
  fetchImpl?: FetchLike;
};

type TelegramApiResponse = {
  ok?: boolean;
  description?: string;
  result?: {
    message_id?: number;
    message_thread_id?: number;
    chat?: { id?: number };
  };
};

type TelegramUpdateResponse = {
  ok?: boolean;
  description?: string;
  result?: TelegramUpdate[];
};

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    message_thread_id?: number;
    text?: string;
    caption?: string;
    chat: { id: number };
    from?: {
      is_bot?: boolean;
      first_name?: string;
      last_name?: string;
      username?: string;
    };
    reply_to_message?: { message_id?: number };
  };
};

const SERVICE_LABELS: Record<string, string> = {
  "boiler-repair": "Ремонт котла",
  "boiler-cleaning": "Чистка и обслуживание котла",
  "boiler-installation": "Установка или замена котла",
  washer: "Ремонт стиральной машины",
  dishwasher: "Ремонт посудомоечной машины",
  other: "Другая бытовая техника",
};

const EQUIPMENT_TOPIC_LABELS: Record<string, string> = {
  "boiler-repair": "Котёл",
  "boiler-cleaning": "Котёл",
  "boiler-installation": "Котёл",
  washer: "Стиральная машина",
  dishwasher: "Посудомоечная машина",
  other: "Другая техника",
};

function valueOrDash(value: string, maxLength = 900): string {
  const trimmed = value.trim();
  const source = trimmed || "не указано";
  let escaped = "";
  for (const character of source) {
    const part = escapeTelegramHtml(character);
    if (escaped.length + part.length > maxLength - 3) return escaped + "...";
    escaped += part;
  }
  return escaped;
}

function escapeTelegramHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function formatTelegramRequest(request: TelegramRequest): string {
  const service = valueOrDash(SERVICE_LABELS[request.service] ?? request.service, 220);
  const status = request.managerRequested
    ? "Требуется подключение менеджера"
    : "Готова к обработке";
  const paymentTerms = request.termsAccepted
    ? "Клиент согласился с отдельной оплатой выезда и диагностики"
    : "Условия оплаты ещё не согласованы";
  const language = request.lang === "ru" ? "русский" : "украинский";
  return [
    "<b>Новая заявка RemTech</b>",
    `<code>${valueOrDash(request.number, 120)}</code> — <b>${status}</b>`,
    "",
    "<b>Клиент</b>",
    "<blockquote>" +
      `Имя: ${valueOrDash(request.name, 200)}\n` +
      `Телефон: <code>${valueOrDash(request.phone, 120)}</code>\n` +
      `Адрес: ${valueOrDash(request.location, 500)}` +
      "</blockquote>",
    "",
    "<b>Обращение</b>",
    "<blockquote>" +
      `Услуга: ${service}\n` +
      `Марка/модель: ${valueOrDash(request.deviceDetails, 300)}\n` +
      `Проблема: ${valueOrDash(request.symptom, 1200)}\n` +
      `Срочность: ${valueOrDash(request.urgency, 300)}` +
      "</blockquote>",
    "",
    "<b>Условия и материалы</b>",
    paymentTerms,
    `Язык: ${language} · Фотографии: ${request.attachmentCount}`,
    "",
    "<i>Ответ клиенту: используйте функцию «Ответить» на эту карточку.\n" +
      "Возврат автоматических ответов: отправьте <code>/llm</code> через «Ответить».</i>",
  ].join("\n");
}

export function formatRequestTopicName(request: TelegramRequest): string {
  const equipment = EQUIPMENT_TOPIC_LABELS[request.service] ?? "Техника";
  const stamp = formatTopicTimestamp(request.createdAt);
  return [stamp, equipment].filter(Boolean).join("-").replace(/\s+/g, " ").trim().slice(0, 128);
}

function formatTopicTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("uk-UA", {
    timeZone: "Europe/Kyiv",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes): string =>
    parts.find((part) => part.type === type)?.value ?? "";
  return `${get("day")}.${get("month")}.${get("year")}-${get("hour")}:${get("minute")}`;
}

export function parseManagerReply(
  update: TelegramUpdate,
  expectedChatId: string,
  expectedThreadId?: number
): TelegramManagerReply | null {
  const message = update.message;
  if (!message || message.from?.is_bot) return null;
  if (String(message.chat.id) !== expectedChatId) return null;
  if (expectedThreadId && message.message_thread_id !== expectedThreadId) return null;

  const replyToMessageId = message.reply_to_message?.message_id;
  const text = (message.text ?? message.caption ?? "").trim();
  if (!replyToMessageId || !text) return null;
  if (text.startsWith("/") && !/^\/llm(?:@\w+)?$/i.test(text)) return null;

  const fullName = [message.from?.first_name, message.from?.last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    chatId: String(message.chat.id),
    messageId: message.message_id,
    threadId: message.message_thread_id,
    replyToMessageId,
    text,
    managerName: fullName || message.from?.username || "Менеджер",
  };
}

export class TelegramBotAdapter implements TelegramAdapter {
  readonly name = "bot-api";

  private readonly token: string;
  private readonly chatId: string;
  private readonly requestsThreadId?: number;
  private readonly technicalThreadId?: number;
  private readonly perRequestTopics: boolean;
  private readonly timeoutMs: number;
  private readonly fetchImpl: FetchLike;

  constructor(options: TelegramBotOptions) {
    this.token = options.token;
    this.chatId = options.chatId;
    this.requestsThreadId = options.requestsThreadId;
    this.technicalThreadId = options.technicalThreadId;
    this.perRequestTopics = options.perRequestTopics ?? false;
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.fetchImpl = options.fetchImpl ?? fetch;
  }

  async sendRequest(request: TelegramRequest): Promise<TelegramMessageReference> {
    if (!this.perRequestTopics) {
      return this.sendMessage(
        formatTelegramRequest(request),
        this.requestsThreadId,
        undefined,
        "HTML"
      );
    }

    let threadId: number | undefined;
    try {
      threadId = await this.createForumTopic(formatRequestTopicName(request));
      // Служебное сообщение «Тема создана» нельзя отправить без уведомления,
      // поэтому карточка уходит без звука: одно уведомление на заявку — от создания темы
      return await this.sendMessage(
        formatTelegramRequest(request),
        threadId,
        undefined,
        "HTML",
        undefined,
        true
      );
    } catch (error) {
      if (threadId) await this.deleteForumTopic(threadId).catch(() => undefined);
      const fallback = await this.sendMessage(
        formatTelegramRequest(request),
        this.requestsThreadId,
        undefined,
        "HTML"
      );
      return {
        ...fallback,
        warning: `Не удалось создать отдельную тему: ${String(error).slice(0, 500)}`,
      };
    }
  }

  async updateRequestCard(
    request: TelegramRequest,
    chatId: string,
    messageId: number
  ): Promise<void> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(
        `https://api.telegram.org/bot${this.token}/editMessageText`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            message_id: messageId,
            text: formatTelegramRequest(request),
            parse_mode: "HTML",
            disable_web_page_preview: true,
          }),
          signal: controller.signal,
        }
      );
      const result = (await response.json().catch(() => ({}))) as TelegramApiResponse;
      if (!response.ok || result.ok !== true) {
        throw new Error(
          `Telegram API ${response.status}: ${result.description ?? "неизвестная ошибка"}`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Таймаут Telegram API через ${this.timeoutMs} мс`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  async sendClientMessage(
    requestNumber: string,
    text: string,
    target: TelegramMessageReference
  ): Promise<TelegramMessageReference> {
    const message = [
      `Сообщение клиента по заявке ${requestNumber}`,
      "",
      text.trim(),
    ].join("\n").slice(0, 4000);
    return this.sendMessage(
      message,
      target.threadId,
      target.messageId,
      undefined,
      target.chatId
    );
  }

  async sendManagerNotice(
    text: string,
    target: TelegramMessageReference
  ): Promise<TelegramMessageReference> {
    return this.sendMessage(
      text.trim().slice(0, 4000),
      target.threadId,
      target.messageId,
      undefined,
      target.chatId
    );
  }

  async sendNotification(message: string): Promise<void> {
    await this.sendMessage(`Техническое уведомление RemTech\n\n${message}`, this.technicalThreadId);
  }

  startManagerReplyPolling(
    onReply: (reply: TelegramManagerReply) => Promise<void>,
    onError: (error: unknown) => Promise<void>
  ): () => void {
    let stopped = false;
    let offset: number | undefined;
    let controller: AbortController | null = null;

    const poll = async () => {
      while (!stopped) {
        controller = new AbortController();
        const timeout = setTimeout(() => controller?.abort(), 35_000);
        try {
          const query = new URLSearchParams({
            timeout: "25",
            allowed_updates: JSON.stringify(["message"]),
          });
          if (offset !== undefined) query.set("offset", String(offset));
          const response = await this.fetchImpl(
            `https://api.telegram.org/bot${this.token}/getUpdates?${query}`,
            { signal: controller.signal }
          );
          const result = (await response.json().catch(() => ({}))) as TelegramUpdateResponse;
          if (!response.ok || result.ok !== true) {
            throw new Error(
              `Telegram API ${response.status}: ${result.description ?? "неизвестная ошибка"}`
            );
          }

          for (const update of result.result ?? []) {
            const reply = parseManagerReply(
              update,
              this.chatId,
              this.perRequestTopics ? undefined : this.requestsThreadId
            );
            if (reply) await onReply(reply);
            offset = update.update_id + 1;
          }
        } catch (error) {
          if (!stopped && !(error instanceof Error && error.name === "AbortError")) {
            try {
              await onError(error);
            } catch (loggingError) {
              console.error("Не удалось записать ошибку Telegram-поллинга:", loggingError);
            }
          }
          if (!stopped) {
            await new Promise((resolve) => setTimeout(resolve, 3_000));
          }
        } finally {
          clearTimeout(timeout);
          controller = null;
        }
      }
    };

    void poll();
    return () => {
      stopped = true;
      controller?.abort();
    };
  }

  private async sendMessage(
    text: string,
    threadId?: number,
    replyToMessageId?: number,
    parseMode?: "HTML",
    chatId = this.chatId,
    disableNotification = false
  ): Promise<TelegramMessageReference> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await this.fetchImpl(
        `https://api.telegram.org/bot${this.token}/sendMessage`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text,
            disable_web_page_preview: true,
            ...(parseMode ? { parse_mode: parseMode } : {}),
            ...(threadId ? { message_thread_id: threadId } : {}),
            ...(replyToMessageId
              ? { reply_parameters: { message_id: replyToMessageId } }
              : {}),
            ...(disableNotification ? { disable_notification: true } : {}),
          }),
          signal: controller.signal,
        }
      );
      const result = (await response.json().catch(() => ({}))) as TelegramApiResponse;
      if (!response.ok || result.ok !== true) {
        throw new Error(
          `Telegram API ${response.status}: ${result.description ?? "неизвестная ошибка"}`
        );
      }
      const messageId = result.result?.message_id;
      const resultChatId = result.result?.chat?.id;
      if (!messageId || resultChatId === undefined) {
        throw new Error("Telegram API не вернул идентификатор сообщения");
      }
      return {
        chatId: String(resultChatId),
        messageId,
        threadId: result.result?.message_thread_id ?? threadId,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Таймаут Telegram API через ${this.timeoutMs} мс`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async createForumTopic(name: string): Promise<number> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchImpl(
        `https://api.telegram.org/bot${this.token}/createForumTopic`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: this.chatId, name }),
          signal: controller.signal,
        }
      );
      const result = (await response.json().catch(() => ({}))) as TelegramApiResponse;
      const threadId = result.result?.message_thread_id;
      if (!response.ok || result.ok !== true || !threadId) {
        throw new Error(
          `Telegram API ${response.status}: ${result.description ?? "не удалось создать тему"}`
        );
      }
      return threadId;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(`Таймаут Telegram API через ${this.timeoutMs} мс`);
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }
  }

  private async deleteForumTopic(threadId: number): Promise<void> {
    const response = await this.fetchImpl(
      `https://api.telegram.org/bot${this.token}/deleteForumTopic`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: this.chatId, message_thread_id: threadId }),
      }
    );
    if (!response.ok) throw new Error("Не удалось удалить пустую тему Telegram");
  }
}
