import { loadLocalEnv } from "../env.js";

loadLocalEnv();

const token = process.env.RT_TELEGRAM_BOT_TOKEN?.trim();
if (!token) {
  console.error("RT_TELEGRAM_BOT_TOKEN не задан в chat-server/.env");
  process.exitCode = 1;
} else {
  const response = await fetch(
    `https://api.telegram.org/bot${token}/getUpdates?limit=100&timeout=0`
  );
  const payload = (await response.json()) as {
    ok?: boolean;
    description?: string;
    result?: Array<{
      message?: TelegramMessage;
      edited_message?: TelegramMessage;
      channel_post?: TelegramMessage;
    }>;
  };

  if (!response.ok || payload.ok !== true) {
    console.error(
      `Telegram API ${response.status}: ${payload.description ?? "неизвестная ошибка"}`
    );
    process.exitCode = 1;
  } else {
    const chats = new Map<string, {
      id: string;
      title: string;
      type: string;
      threads: Map<number, string>;
    }>();
    for (const update of payload.result ?? []) {
      const message = update.message ?? update.edited_message ?? update.channel_post;
      if (!message?.chat) continue;
      const id = String(message.chat.id);
      const entry = chats.get(id) ?? {
        id,
        title: message.chat.title ?? message.chat.username ?? "личный чат",
        type: message.chat.type,
        threads: new Map<number, string>(),
      };
      if (message.message_thread_id) {
        const label = message.forum_topic_created?.name ?? message.text ?? "тема";
        entry.threads.set(message.message_thread_id, label.slice(0, 80));
      }
      chats.set(id, entry);
    }

    if (chats.size === 0) {
      console.log("Чаты не найдены. Отправьте боту /start или другую команду в группе и повторите команду.");
    } else {
      for (const chat of chats.values()) {
        console.log(`Чат: ${chat.title}`);
        console.log(`  RT_TELEGRAM_CHAT_ID=${chat.id}`);
        console.log(`  Тип: ${chat.type}`);
        if (chat.threads.size > 0) {
          console.log("  Темы:");
          for (const [threadId, label] of chat.threads) {
            console.log(`    ${threadId}: ${label}`);
          }
        }
      }
    }
  }
}

type TelegramMessage = {
  message_thread_id?: number;
  text?: string;
  forum_topic_created?: { name?: string };
  chat?: {
    id: number;
    type: string;
    title?: string;
    username?: string;
  };
};
