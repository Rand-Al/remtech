import type { TelegramAdapter, TelegramRequest } from "./adapter.js";

export class StubTelegramAdapter implements TelegramAdapter {
  readonly name = "stub";

  async sendRequest(request: TelegramRequest): Promise<void> {
    console.log(
      "[telegram:stub] Заявка #" + request.number + " відправлена (Telegram ще не підключено):",
      JSON.stringify(request, null, 2)
    );
  }

  async sendNotification(message: string): Promise<void> {
    console.log("[telegram:stub] Сповіщення:", message);
  }
}