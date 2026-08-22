import assert from "node:assert/strict";
import test from "node:test";
import {
  asksAboutPrice,
  asksIfHumanManager,
  combineLocationWithAddress,
  detectServiceFromText,
  describesImmediateElectricalHazard,
  expressesCostConcern,
  expressesUrgency,
  explicitlyAcceptsTerms,
  extractContactAnswer,
  extractDeviceDetailsAnswer,
  extractExplicitLocation,
  extractInitialSymptom,
  getLocationAnswer,
  getTermsDecision,
  hasInvalidPhoneCandidate,
  hasExactAddress,
  hasLocationAnswer,
  isAwaitingLocation,
  isSymptomAnswerExpected,
  isValidUkrainianPhone,
  mergeRequestSymptom,
  normalizeManagerReply,
  requestsHumanManager,
  requestsTechnicianVisit,
  shouldAskExactAddress,
} from "./conversation.js";

test("normalizes accidental spacing in manager replies", () => {
  assert.equal(
    normalizeManagerReply("С собаками не поможем.  У вас что-то сломалось ? "),
    "С собаками не поможем. У вас что-то сломалось?"
  );
});

test("adds a symptom detail after a diagnostic question", () => {
  const question = "Что именно происходит с машинкой — она не включается или не запускает стирку?";
  assert.equal(isSymptomAnswerExpected(question), true);
  assert.equal(
    mergeRequestSymptom(
      "не работает стиральная машинка",
      "не запускает стирку, просто гудит и всё"
    ),
    "не работает стиральная машинка. не запускает стирку, просто гудит и всё"
  );
});

test("stores a brand answer without inventing a model", () => {
  assert.equal(
    extractDeviceDetailsAnswer(
      "самсунг",
      "Подскажите марку стиральной машины, если знаете?"
    ),
    "самсунг"
  );
  assert.equal(
    extractDeviceDetailsAnswer("модель не знаю", "Какая марка и модель?"),
    null
  );
});

const COMPLETE_FIRST_MESSAGE =
  "Стиральная машина Samsung не сливает воду. Нахожусь в Броварах, улица Киевская 34. Меня зовут Андрей, телефон 050 123 45 67. С платным выездом и диагностикой согласен.";

test("extracts a complete request from the first client message", () => {
  assert.equal(detectServiceFromText(COMPLETE_FIRST_MESSAGE), "washer");
  assert.equal(
    extractExplicitLocation(COMPLETE_FIRST_MESSAGE),
    "Бровари, улица Киевская 34"
  );
  assert.equal(hasExactAddress(COMPLETE_FIRST_MESSAGE), true);
  assert.deepEqual(extractContactAnswer(COMPLETE_FIRST_MESSAGE, ""), {
    name: "Андрей",
    phone: "050 123 45 67",
  });
  assert.equal(explicitlyAcceptsTerms(COMPLETE_FIRST_MESSAGE), true);
});

test("keeps street, building and apartment when the first message has a full address", () => {
  assert.equal(
    extractExplicitLocation(
      "Я у Броварах, вулиця Київська, будинок 15, квартира 3. Пральна машина Bosch."
    ),
    "Бровари, вулиця Київська, будинок 15, квартира 3"
  );
  assert.equal(
    extractExplicitLocation("Нахожусь в Броварах, улица Ленина, дом 12, кв. 5"),
    "Бровари, улица Ленина, дом 12, кв. 5"
  );
});

test("stores only the malfunction in the symptom field", () => {
  assert.equal(
    extractInitialSymptom(
      "Добрий день! Кіл Беретта не запалюється, помилка A01. Я у Броварах, вулиця Гали, будинок 45, квартира 12. Згоден на платний виїзд і діагностику. Мене звати Тарас, телефон 0671112233."
    ),
    "Кіл Беретта не запалюється, помилка A01."
  );
  assert.equal(
    extractInitialSymptom(COMPLETE_FIRST_MESSAGE),
    "Стиральная машина Samsung не сливает воду."
  );
  assert.equal(extractInitialSymptom("Привіт! Пральна машина не гріє воду."), "Пральна машина не гріє воду.");
  assert.equal(extractInitialSymptom("Котёл шумит, но дом ещё не остыл"), "Котёл шумит, но дом ещё не остыл");
});

test("does not treat a refusal as voluntary acceptance of payment terms", () => {
  assert.equal(
    explicitlyAcceptsTerms("С платным выездом и диагностикой не согласен"),
    false
  );
});

test("updates the requested service when the client names different equipment", () => {
  assert.equal(detectServiceFromText("дымит посудомойка"), "dishwasher");
  assert.equal(detectServiceFromText("нужна чистка котла"), "boiler-cleaning");
  assert.equal(detectServiceFromText("она выключена"), null);
});

test("accepts only complete Ukrainian phone numbers", () => {
  assert.equal(isValidUkrainianPhone("050 123 45 67"), true);
  assert.equal(isValidUkrainianPhone("+380 50 123 45 67"), true);
  assert.equal(isValidUkrainianPhone("045958568"), false);
  assert.equal(hasInvalidPhoneCandidate("Наталья 045958568"), true);
  assert.deepEqual(
    extractContactAnswer("Наталья 045958568", "Как к вам обращаться? И номер телефона?"),
    { name: "Наталья", phone: undefined }
  );
});

test("recognizes questions about diagnostic price", () => {
  assert.equal(asksAboutPrice("а сколько стоит диагностика?"), true);
  assert.equal(asksAboutPrice("Яка вартість діагностики?"), true);
  assert.equal(asksAboutPrice("а сколько стоить будет?"), true);
  assert.equal(asksAboutPrice("диагностика оплачивается отдельно?"), false);
});

test("recognizes repeated urgency without treating it as consent", () => {
  assert.equal(expressesUrgency("срочно ехать"), true);
  assert.equal(expressesUrgency("потрібно якомога швидше"), true);
  assert.equal(expressesUrgency("да, подходит"), false);
});

test("recognizes a client's concern about affording the repair", () => {
  assert.equal(expressesCostConcern("не знаю даже, а вдруг у меня денег не хватит"), true);
  assert.equal(expressesCostConcern("боюсь, что будет дорого"), true);
  assert.equal(expressesCostConcern("да, подходит"), false);
});

test("recognizes a direct request for a technician visit", () => {
  assert.equal(requestsTechnicianVisit("не работает, просто приедьте"), true);
  assert.equal(requestsTechnicianVisit("вызовите мастера"), true);
  assert.equal(requestsTechnicianVisit("не приезжайте"), false);
});

test("recognizes a request to continue with a human manager", () => {
  assert.equal(requestsHumanManager("мне нужен человек"), true);
  assert.equal(requestsHumanManager("надо человек"), true);
  assert.equal(requestsHumanManager("я знаю что на русском. Надо человек"), true);
  assert.equal(requestsHumanManager("человек нужен"), true);
  assert.equal(requestsHumanManager("позови человека"), true);
  assert.equal(requestsHumanManager("пригласи живого менеджера"), true);
  assert.equal(requestsHumanManager("покличте живого менеджера"), true);
  assert.equal(requestsHumanManager("вызовите мастера"), false);
});

test("recognizes direct questions about whether the manager is human", () => {
  assert.equal(asksIfHumanManager("ты человек?"), true);
  assert.equal(asksIfHumanManager("ты разве человек?"), true);
  assert.equal(asksIfHumanManager("это бот?"), true);
  assert.equal(asksIfHumanManager("пиздишь, я знаю что ты робот"), true);
  assert.equal(asksIfHumanManager("я говорю с человеком?"), true);
  assert.equal(asksIfHumanManager("мне нужен мастер"), false);
});

test("extracts a name after the manager asks for contact details", () => {
  assert.deepEqual(
    extractContactAnswer(
      "Андрей",
      "Как к вам обращаться? И оставьте, пожалуйста, номер телефона для связи."
    ),
    { name: "Андрей", phone: undefined }
  );
});

test("extracts a name and phone from one contact answer", () => {
  assert.deepEqual(
    extractContactAnswer("Меня зовут Андрей, 050 123 45 67", "Как к вам обращаться?"),
    { name: "Андрей", phone: "050 123 45 67" }
  );
});

test("does not mistake an ordinary answer for a client name", () => {
  assert.deepEqual(extractContactAnswer("самсунг", "Какая марка?"), {
    phone: undefined,
  });
});

test("detects smoke, sparking, and burning smell without treating an indicator light as a hazard", () => {
  assert.equal(describesImmediateElectricalHazard("дымит посудомойка"), true);
  assert.equal(describesImmediateElectricalHazard("пахне горілим"), true);
  assert.equal(describesImmediateElectricalHazard("из корпуса искры"), true);
  assert.equal(describesImmediateElectricalHazard("горит лампочка ошибки"), false);
});

test("recognizes that the client answered the settlement question", () => {
  assert.equal(
    hasLocationAnswer([
      { sender: "manager", text: "В каком вы населённом пункте?" },
      { sender: "client", text: "Скибин" },
    ]),
    true
  );
});

test("does not mistake an appliance status for a settlement", () => {
  const messages = [
    { sender: "manager" as const, text: "В каком вы населённом пункте?" },
    { sender: "client" as const, text: "я ее выключил" },
  ];
  assert.equal(hasLocationAnswer(messages), false);
  assert.equal(getLocationAnswer(messages), null);
  assert.equal(isAwaitingLocation(messages), true);
});

test("asks for an exact address after the client names only the city", () => {
  assert.equal(
    shouldAskExactAddress([
      { sender: "manager", text: "Який населений пункт?" },
      { sender: "client", text: "Бровари" },
    ]),
    true
  );
});

test("does not ask again when street and building number are present", () => {
  assert.equal(hasExactAddress("вул. Київська, 12"), true);
  assert.equal(
    shouldAskExactAddress([
      { sender: "manager", text: "Який населений пункт?" },
      { sender: "client", text: "Бровари, вул. Київська, 12" },
    ]),
    false
  );
});

test("does not mistake an error code or phone for an address", () => {
  assert.equal(hasExactAddress("помилка E43"), false);
  assert.equal(hasExactAddress("Віталій 0453338577"), false);
});

test("combines a saved settlement with the exact address", () => {
  assert.equal(
    combineLocationWithAddress("Бровары", "Запорожская 5"),
    "Бровары, Запорожская 5"
  );
  assert.equal(
    combineLocationWithAddress("Бровары", "Бровары, ул. Киевская 18"),
    "Бровары, ул. Киевская 18"
  );
});

test("does not repeat the exact address question after the client answered it", () => {
  assert.equal(
    shouldAskExactAddress([
      { sender: "manager", text: "Який населений пункт?" },
      { sender: "client", text: "Бровари" },
      { sender: "manager", text: "Підкажіть, будь ласка, точну адресу: вулицю та номер будинку." },
      { sender: "client", text: "номер будинку поки не знаю" },
    ]),
    false
  );
});

test("asks for the exact address again after a price-question detour", () => {
  assert.equal(
    shouldAskExactAddress([
      { sender: "manager", text: "В каком вы населённом пункте?" },
      { sender: "client", text: "Бровары" },
      { sender: "manager", text: "Напишите улицу и номер дома." },
      { sender: "client", text: "а сколько стоит диагностика?" },
      { sender: "manager", text: "Стоимость диагностики уточняется индивидуально." },
      { sender: "client", text: "ок" },
    ]),
    true
  );
});

test("requires an explicit answer after payment terms are shown", () => {
  assert.equal(
    getTermsDecision([
      {
        sender: "manager",
        text: "Выезд и диагностика оплачиваются отдельно. Вам подходит такой формат?",
      },
      { sender: "client", text: "а сколько будет стоить ремонт?" },
    ]),
    "unclear"
  );
});

test("recognizes explicit acceptance of payment terms", () => {
  assert.equal(
    getTermsDecision([
      {
        sender: "manager",
        text: "Виїзд і діагностика оплачуються окремо. Вам підходить такий формат?",
      },
      { sender: "client", text: "так, підходить" },
    ]),
    "accepted"
  );
});

test("recognizes explicit refusal of payment terms before positive words", () => {
  assert.equal(
    getTermsDecision([
      {
        sender: "manager",
        text: "Выезд и диагностика оплачиваются отдельно. Вам подходит такой формат?",
      },
      { sender: "client", text: "нет, мне не подходит" },
    ]),
    "declined"
  );
});

test("does not infer consent before the terms question", () => {
  assert.equal(
    getTermsDecision([{ sender: "client", text: "хорошо" }]),
    "not-asked"
  );
});
