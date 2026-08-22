import { createTelegramAdapter } from "../adapters.js";
import { loadLocalEnv } from "../env.js";

loadLocalEnv();

const telegram = createTelegramAdapter();
if (telegram.name === "stub") {
  console.error(
    "Telegram не настроен. Задайте RT_TELEGRAM_BOT_TOKEN и RT_TELEGRAM_CHAT_ID в chat-server/.env"
  );
  process.exitCode = 1;
} else {
  await telegram.sendNotification(
    "Тестовое сообщение. Связь чат-сервера RemTech с Telegram работает."
  );
  console.log("Тестовое сообщение успешно отправлено в Telegram.");
}
