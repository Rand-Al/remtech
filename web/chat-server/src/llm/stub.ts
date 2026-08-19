import type { ChatMessage, LlmAdapter, LlmResponse } from "./adapter.js";

export class StubLlmAdapter implements LlmAdapter {
  readonly name = "stub";

  async chat(messages: ChatMessage[]): Promise<LlmResponse> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user");

    if (!lastUserMessage) {
      return {
        content:
          "Вітаю! Розкажіть, будь ласка, яка техніка потребує ремонту і що з нею сталося?",
      };
    }

    const text = lastUserMessage.content.toLowerCase();

    if (text.includes("котел") || text.includes("газ")) {
      return {
        content:
          "Вітаю! Розкажіть, будь ласка, що сталося з котлом? Якщо є код помилки — вкажіть його.",
      };
    }

    if (text.includes("ціна") || text.includes("вартість")) {
      return {
        content:
          "Вартість ремонту визначається після огляду обладнання. Виїзд і діагностика оплачуються окремо — менеджер уточнить умови перед виїздом майстра.",
      };
    }

    if (text.includes("дома") || text.includes("сам") || text.includes("розібра")) {
      return {
        content:
          "Не рекомендую виконувати самостійне втручання в газове обладнання. Опишіть несправність менеджеру — він передасть звернення майстру.",
      };
    }

    return {
      content:
        "Дякую за інформацію. Підкажіть, будь ласка, марку та модель техніки, якщо знаєте, і населений пункт, куди потрібен виїзд.",
    };
  }
}