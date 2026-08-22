import assert from "node:assert/strict";
import test from "node:test";
import { validateContacts, validateLlmSettings } from "./settings.js";

const VALID = {
  phone: "+38 050 123 45 67",
  telegramUrl: "https://t.me/remtech",
  telegramLabel: "@remtech",
  schedule: { uk: "Щодня, 10:00–18:00", ru: "Ежедневно, 10:00–18:00" },
  area: { uk: "Бровари", ru: "Бровары" },
};

test("accepts a complete contacts object", () => {
  const result = validateContacts(VALID);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.phone, "+38 050 123 45 67");
    assert.equal(result.value.schedule.ru, "Ежедневно, 10:00–18:00");
  }
});

test("rejects a broken phone and telegram link", () => {
  const result = validateContacts({
    ...VALID,
    phone: "123",
    telegramUrl: "t.me/remtech",
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.equal(result.errors.length, 2);
  }
});

test("requires both languages for schedule and area", () => {
  const result = validateContacts({
    ...VALID,
    schedule: { uk: "Щодня" },
    area: null,
  });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some((error) => error.includes("График")));
    assert.ok(result.errors.some((error) => error.includes("Зона")));
  }
});

test("rejects non-object input", () => {
  assert.equal(validateContacts("нет").ok, false);
  assert.equal(validateContacts(null).ok, false);
});

const VALID_LLM = {
  baseUrl: "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
  apiKey: "sk-test",
  model: "qwen3.8-max",
  fallbackModels: "backup-a, backup-b",
  enableThinking: false,
};

test("accepts a complete LLM config", () => {
  const result = validateLlmSettings(VALID_LLM);
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.model, "qwen3.8-max");
    assert.deepEqual(result.value.fallbackModels, ["backup-a", "backup-b"]);
    assert.equal(result.value.enableThinking, false);
  }
});

test("empty base URL means stub and clears the rest", () => {
  const result = validateLlmSettings({ ...VALID_LLM, baseUrl: "  " });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.baseUrl, "");
    assert.equal(result.value.apiKey, "");
    assert.equal(result.value.fallbackModels.length, 0);
  }
});

test("requires a model when base URL is set", () => {
  const result = validateLlmSettings({ ...VALID_LLM, model: "" });
  assert.equal(result.ok, false);
  if (!result.ok) {
    assert.ok(result.errors.some((error) => error.includes("Модель")));
  }
});

test("rejects a non-http base URL", () => {
  const result = validateLlmSettings({ ...VALID_LLM, baseUrl: "ftp://example.com" });
  assert.equal(result.ok, false);
});

test("deduplicates fallbacks and removes the main model", () => {
  const result = validateLlmSettings({
    ...VALID_LLM,
    fallbackModels: ["backup-a", "backup-a", "qwen3.8-max"],
  });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.deepEqual(result.value.fallbackModels, ["backup-a"]);
  }
});

test("unknown enableThinking values fall back to default", () => {
  const result = validateLlmSettings({ ...VALID_LLM, enableThinking: "да" });
  assert.equal(result.ok, true);
  if (result.ok) {
    assert.equal(result.value.enableThinking, null);
  }
});
