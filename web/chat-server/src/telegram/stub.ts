import type {
  TelegramAdapter,
  TelegramManagerReply,
  TelegramRequest,
} from "./adapter.js";

export class StubTelegramAdapter implements TelegramAdapter {
  readonly name = "stub";

  async sendRequest(request: TelegramRequest): Promise<null> {
    console.log(
      "[telegram:stub] Заявка #" + request.number + " отправлена (Telegram ещё не подключён):",
      JSON.stringify(request, null, 2)
    );
    return null;
  }

  async updateRequestCard(
    request: TelegramRequest,
    _chatId: string,
    messageId: number
  ): Promise<void> {
    console.log(
      `[telegram:stub] Карточка ${messageId} обновлена для заявки ${request.number}`
    );
  }

  async sendClientMessage(
    requestNumber: string,
    text: string,
    _target: import("./adapter.js").TelegramMessageReference
  ): Promise<null> {
    console.log(`[telegram:stub] Сообщение клиента по заявке ${requestNumber}:`, text);
    return null;
  }

  async sendManagerNotice(
    text: string,
    _target: import("./adapter.js").TelegramMessageReference
  ): Promise<null> {
    console.log("[telegram:stub] Сообщение менеджеру:", text);
    return null;
  }

  async sendNotification(message: string): Promise<void> {
    console.log("[telegram:stub] Уведомление:", message);
  }

  startManagerReplyPolling(
    _onReply: (reply: TelegramManagerReply) => Promise<void>,
    _onError: (error: unknown) => Promise<void>
  ): () => void {
    return () => undefined;
  }
}
