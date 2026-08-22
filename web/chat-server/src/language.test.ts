import assert from "node:assert/strict";
import test from "node:test";
import { detectConversationLanguage, detectMessageLanguage } from "./language.js";

test("switches to Russian on a short Russian message with a typo", () => {
  const language = detectConversationLanguage([
    { sender: "manager", text: "Доброго дня. Що саме сталося з газовим котлом?" },
    { sender: "client", text: "выдает ошибук А01" },
  ]);

  assert.equal(language, "ru");
});

test("switches to Russian on a short request without Russian-specific letters", () => {
  assert.equal(detectMessageLanguage("тапки делаете?"), "ru");
  assert.equal(detectMessageLanguage("нужна чистка перед сезоном"), "ru");
  assert.equal(detectMessageLanguage("стиралка не отжимает воду"), "ru");
  assert.equal(detectMessageLanguage("поламался котел"), "ru");
  assert.equal(detectMessageLanguage("тапки ремонтируете?"), "ru");
});

test("detects an ordinary Russian appliance description", () => {
  assert.equal(detectMessageLanguage("посудомойка гудит и не моет"), "ru");
});

test("keeps Russian for neutral location and contact messages", () => {
  const language = detectConversationLanguage([
    { sender: "client", text: "выдает ошибук А01" },
    { sender: "client", text: "бровары" },
    { sender: "client", text: "Виталий 0502241612" },
  ]);

  assert.equal(language, "ru");
});

test("does not switch Russian conversation back on an ambiguous short answer", () => {
  const language = detectConversationLanguage(
    [{ sender: "client", text: "так" }],
    "ru"
  );

  assert.equal(language, "ru");
});

test("switches back when the client clearly writes in Ukrainian", () => {
  const language = detectConversationLanguage(
    [{ sender: "client", text: "котел не працює" }],
    "ru"
  );

  assert.equal(language, "uk");
});

test("detects a generated Ukrainian reply when Russian was requested", () => {
  assert.equal(
    detectMessageLanguage(
      "Дякую. Підкажіть, будь ласка, точну адресу: вулицю та номер будинку."
    ),
    "uk"
  );
});

test("detects a generated Russian reply", () => {
  assert.equal(
    detectMessageLanguage(
      "Спасибо. Подскажите, пожалуйста, точный адрес: улицу и номер дома."
    ),
    "ru"
  );
});

test("does not switch a Russian conversation because of a photo marker", () => {
  const language = detectConversationLanguage([
    { sender: "client", text: "мне нужен человек" },
    { sender: "manager", text: "Хорошо, приглашу коллегу в чат." },
    { sender: "client", text: "Клієнт додав фотографію." },
  ]);

  assert.equal(language, "ru");
});
