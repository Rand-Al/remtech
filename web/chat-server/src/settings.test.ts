import assert from "node:assert/strict";
import test from "node:test";
import { validateContacts } from "./settings.js";

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
