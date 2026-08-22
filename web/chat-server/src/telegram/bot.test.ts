import assert from "node:assert/strict";
import test from "node:test";
import {
  TelegramBotAdapter,
  formatRequestTopicName,
  formatTelegramRequest,
  parseManagerReply,
} from "./bot.js";
import type { TelegramRequest } from "./adapter.js";

const request: TelegramRequest = {
  number: "RT-TEST-1",
  createdAt: "2026-08-22T11:15:00.000Z",
  service: "dishwasher",
  device: "dishwasher",
  deviceDetails: "Bosch SMS46MI04E",
  symptom: "Не зливає воду",
  location: "Бровари, вул. Київська, 1",
  urgency: "сьогодні",
  name: "Олена",
  phone: "050 123 45 67",
  lang: "uk",
  attachmentCount: 2,
  termsAccepted: true,
  managerRequested: false,
};

test("formats a request for a Telegram manager", () => {
  const message = formatTelegramRequest(request);
  assert.match(message, /Новая заявка RemTech/);
  assert.match(message, /Ремонт посудомоечной машины/);
  assert.match(message, /Марка\/модель: Bosch SMS46MI04E/);
  assert.match(message, /Олена/);
  assert.match(message, /Фотографии: 2/);
  assert.match(message, /Готова к обработке/);
  assert.match(message, /Клиент согласился/);
});

test("sends requests and technical notifications to configured topics", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const adapter = new TelegramBotAdapter({
    token: "test-token",
    chatId: "-100123",
    requestsThreadId: 10,
    technicalThreadId: 20,
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            message_id: calls.length === 1 ? 101 : 102,
            message_thread_id: 10,
            chat: { id: -100123 },
          },
        }),
        { status: 200 }
      );
    },
  });

  const requestMessage = await adapter.sendRequest(request);
  await adapter.updateRequestCard(request, "-100123", 101);
  await adapter.sendClientMessage(request.number, "Котёл снова шумит", {
    chatId: "-100123",
    messageId: 101,
    threadId: 10,
  });
  await adapter.sendManagerNotice("LLM снова активна.", {
    chatId: "-100123",
    messageId: 501,
    threadId: 10,
  });
  await adapter.sendNotification("LLM недоступна");

  assert.equal(calls.length, 5);
  assert.equal(requestMessage.messageId, 101);
  assert.equal(calls[0].body.chat_id, "-100123");
  assert.equal(calls[0].body.message_thread_id, 10);
  assert.equal(calls[0].body.parse_mode, "HTML");
  assert.match(calls[1].url, /editMessageText$/);
  assert.equal(calls[1].body.chat_id, "-100123");
  assert.equal(calls[1].body.message_id, 101);
  assert.equal(calls[1].body.parse_mode, "HTML");
  assert.deepEqual(calls[2].body.reply_parameters, { message_id: 101 });
  assert.match(String(calls[2].body.text), /Котёл снова шумит/);
  assert.deepEqual(calls[3].body.reply_parameters, { message_id: 501 });
  assert.match(String(calls[3].body.text), /LLM снова активна/);
  assert.equal(calls[4].body.message_thread_id, 20);
  assert.match(String(calls[4].body.text), /LLM недоступна/);
});

test("creates a separate topic and keeps request messages inside it", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const adapter = new TelegramBotAdapter({
    token: "test-token",
    chatId: "-100123",
    requestsThreadId: 10,
    perRequestTopics: true,
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      if (url.endsWith("/createForumTopic")) {
        return new Response(
          JSON.stringify({ ok: true, result: { message_thread_id: 77 } }),
          { status: 200 }
        );
      }
      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            message_id: calls.length === 2 ? 201 : 202,
            message_thread_id: 77,
            chat: { id: -100123 },
          },
        }),
        { status: 200 }
      );
    },
  });

  const card = await adapter.sendRequest(request);
  await adapter.sendClientMessage(request.number, "Новое сообщение", card);

  assert.match(calls[0].url, /createForumTopic$/);
  assert.equal(calls[0].body.name, formatRequestTopicName(request));
  assert.equal(calls[1].body.message_thread_id, 77);
  assert.equal(calls[1].body.disable_notification, true);
  assert.equal(calls[2].body.message_thread_id, 77);
  assert.deepEqual(calls[2].body.reply_parameters, { message_id: 201 });
  assert.equal(calls[2].body.disable_notification, undefined);
  assert.equal(card.threadId, 77);
});

test("names the request topic by local date, time and equipment", () => {
  assert.equal(formatRequestTopicName(request), "22.08.2026-14:15-Посудомоечная машина");
  assert.equal(
    formatRequestTopicName({ ...request, service: "boiler-repair", createdAt: "2026-01-02T22:05:00.000Z" }),
    "03.01.2026-00:05-Котёл"
  );
  assert.equal(
    formatRequestTopicName({ ...request, createdAt: "не дата" }),
    "Посудомоечная машина"
  );
});

test("falls back to the common request topic when topic creation fails", async () => {
  const calls: Array<{ url: string; body: Record<string, unknown> }> = [];
  const adapter = new TelegramBotAdapter({
    token: "test-token",
    chatId: "-100123",
    requestsThreadId: 10,
    perRequestTopics: true,
    fetchImpl: async (url, init) => {
      calls.push({
        url,
        body: JSON.parse(String(init?.body)) as Record<string, unknown>,
      });
      if (url.endsWith("/createForumTopic")) {
        return new Response(
          JSON.stringify({ ok: false, description: "not enough rights" }),
          { status: 400 }
        );
      }
      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            message_id: 301,
            message_thread_id: 10,
            chat: { id: -100123 },
          },
        }),
        { status: 200 }
      );
    },
  });

  const card = await adapter.sendRequest(request);

  assert.equal(calls.length, 2);
  assert.equal(calls[1].body.message_thread_id, 10);
  assert.equal(calls[1].body.disable_notification, undefined);
  assert.equal(card.threadId, 10);
  assert.match(card.warning ?? "", /not enough rights/);
});

test("escapes client text in the Telegram HTML card", () => {
  const message = formatTelegramRequest({
    ...request,
    symptom: "Шумит <котёл> & пахнет гарью",
    managerRequested: true,
    termsAccepted: false,
  });

  assert.match(message, /Шумит &lt;котёл&gt; &amp; пахнет гарью/);
  assert.match(message, /Требуется подключение менеджера/);
  assert.match(message, /Условия оплаты ещё не согласованы/);
  assert.doesNotMatch(message, /Шумит <котёл>/);
});

test("recognizes a manager reply to a request card", () => {
  const reply = parseManagerReply(
    {
      update_id: 77,
      message: {
        message_id: 501,
        message_thread_id: 10,
        text: "Добрый день, смогу приехать после 15:00.",
        chat: { id: -100123 },
        from: { first_name: "Виталий", is_bot: false },
        reply_to_message: { message_id: 101 },
      },
    },
    "-100123",
    10
  );

  assert.deepEqual(reply, {
    chatId: "-100123",
    messageId: 501,
    threadId: 10,
    replyToMessageId: 101,
    text: "Добрый день, смогу приехать после 15:00.",
    managerName: "Виталий",
  });
});

test("ignores messages outside the request topic and without a reply", () => {
  const base = {
    update_id: 78,
    message: {
      message_id: 502,
      message_thread_id: 20,
      text: "Проверка",
      chat: { id: -100123 },
      from: { first_name: "Виталий", is_bot: false },
    },
  };

  assert.equal(parseManagerReply(base, "-100123", 10), null);
  assert.equal(
    parseManagerReply(
      { ...base, message: { ...base.message, message_thread_id: 10 } },
      "-100123",
      10
    ),
    null
  );
});

test("recognizes the command that returns LLM to a request", () => {
  const command = parseManagerReply(
    {
      update_id: 79,
      message: {
        message_id: 503,
        message_thread_id: 10,
        text: "/llm",
        chat: { id: -100123 },
        from: { first_name: "Виталий", is_bot: false },
        reply_to_message: { message_id: 501 },
      },
    },
    "-100123",
    10
  );

  assert.equal(command?.text, "/llm");
  assert.equal(command?.replyToMessageId, 501);
});

test("ignores unrelated Telegram commands", () => {
  const command = parseManagerReply(
    {
      update_id: 80,
      message: {
        message_id: 504,
        message_thread_id: 10,
        text: "/technical",
        chat: { id: -100123 },
        from: { first_name: "Виталий", is_bot: false },
        reply_to_message: { message_id: 501 },
      },
    },
    "-100123",
    10
  );

  assert.equal(command, null);
});

test("sends client photos into the request topic as photos and documents", async () => {
  const calls: Array<{ url: string; body: FormData }> = [];
  const adapter = new TelegramBotAdapter({
    token: "test-token",
    chatId: "-100123",
    fetchImpl: async (url, init) => {
      calls.push({ url, body: init?.body as FormData });
      return new Response(
        JSON.stringify({
          ok: true,
          result: {
            message_id: 300 + calls.length,
            message_thread_id: 77,
            chat: { id: -100123 },
          },
        }),
        { status: 200 }
      );
    },
  });

  const references = await adapter.sendClientPhotos(
    request.number,
    [
      { data: Buffer.from("jpeg-bytes"), mimeType: "image/jpeg", fileName: "a.jpg" },
      { data: Buffer.from("heic-bytes"), mimeType: "image/heic", fileName: "b.heic" },
      { data: Buffer.from("png-bytes"), mimeType: "image/png", fileName: "c.png" },
    ],
    { chatId: "-100123", messageId: 201, threadId: 77 }
  );

  assert.equal(calls.length, 3);
  assert.match(calls[0].url, /sendPhoto$/);
  assert.match(calls[1].url, /sendDocument$/);
  assert.match(calls[2].url, /sendPhoto$/);
  assert.equal(calls[0].body.get("chat_id"), "-100123");
  assert.equal(calls[0].body.get("message_thread_id"), "77");
  assert.equal(calls[0].body.get("reply_parameters"), '{"message_id":201}');
  assert.equal(calls[0].body.get("disable_notification"), "true");
  assert.equal(calls[0].body.get("caption"), `Фото клиента к заявке ${request.number}`);
  assert.equal(calls[1].body.get("caption"), null);
  const firstPhoto = calls[0].body.get("photo");
  assert.ok(firstPhoto instanceof File);
  assert.equal(firstPhoto.name, "a.jpg");
  assert.equal(references.length, 3);
  assert.equal(references[0]?.messageId, 301);
  assert.equal(references[1]?.messageId, 302);
});

test("returns null for a photo that Telegram rejected", async () => {
  let callIndex = 0;
  const adapter = new TelegramBotAdapter({
    token: "test-token",
    chatId: "-100123",
    fetchImpl: async (url) => {
      callIndex += 1;
      const ok = callIndex === 1;
      return new Response(
        JSON.stringify(
          ok
            ? { ok: true, result: { message_id: 401, message_thread_id: 77, chat: { id: -100123 } } }
            : { ok: false, description: "PHOTO_INVALID_DIMENSIONS" }
        ),
        { status: ok ? 200 : 400 }
      );
    },
  });

  const references = await adapter.sendClientPhotos(
    request.number,
    [
      { data: Buffer.from("good"), mimeType: "image/jpeg", fileName: "a.jpg" },
      { data: Buffer.from("bad"), mimeType: "image/jpeg", fileName: "b.jpg" },
    ],
    { chatId: "-100123", messageId: 201, threadId: 77 }
  );

  assert.equal(references[0]?.messageId, 401);
  assert.equal(references[1], null);
});

test("does not expose the bot token in Telegram API errors", async () => {
  const adapter = new TelegramBotAdapter({
    token: "secret-token",
    chatId: "-100123",
    fetchImpl: async () =>
      new Response(
        JSON.stringify({ ok: false, description: "chat not found" }),
        { status: 400 }
      ),
  });

  await assert.rejects(
    () => adapter.sendNotification("test"),
    (error: Error) => {
      assert.match(error.message, /chat not found/);
      assert.doesNotMatch(error.message, /secret-token/);
      return true;
    }
  );
});
