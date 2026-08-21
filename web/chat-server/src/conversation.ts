type ConversationMessage = {
  sender: "client" | "manager";
  text: string;
};

export type TermsDecision = "not-asked" | "accepted" | "declined" | "unclear";

const LOCATION_QUESTION =
  /(насел[её]н[\p{L}]*\s+пункт[\p{L}]*|де\s+ви\s+знаходитеся|где\s+вы\s+находитесь|адрес(?:у|а)?\s+або\s+населен|адрес(?:а)?\s+или\s+населён)/iu;
const EXACT_ADDRESS_QUESTION =
  /(точн(?:у|ый|ого)\s+адрес|вулиц(?:ю|я).*(?:номер|будин)|улиц(?:у|а).*(?:номер|дом))/i;
const ADDRESS_UNAVAILABLE =
  /(?:адрес|вулиц|улиц|номер\s+(?:будинку|дома)).*(?:не\s+знаю|не\s+пам['’]?ятаю|не\s+помню|не\s+могу|не\s+можу)|(?:не\s+знаю|не\s+пам['’]?ятаю|не\s+помню|не\s+могу|не\s+можу).*(?:адрес|вулиц|улиц|номер\s+(?:будинку|дома))/iu;
const PHONE_PATTERN = /(?:\+?\d[\d\s\-()]{7,}\d)/;
const ADDRESS_MARKER =
  /\b(?:вул(?:иця|ицю|\.)?|просп(?:ект|\.)?|пров(?:улок|\.)?|буд(?:инок|\.)?|улиц(?:а|у|ы)?|ул\.|пер(?:еулок|\.)?|дом|д\.|шосе|шоссе|площа|площадь)\b/i;
const STREET_AND_NUMBER = /[а-яёіїєґ]{4,}[\s,.-]+\d{1,4}(?:\b|[/-])/i;
const TERMS_QUESTION =
  /(?:(?:виїзд|выезд).*діагностик|(?:виїзд|выезд).*диагностик)/i;
const TERMS_NEGATIVE =
  /(?:^|[^\p{L}])(?:ні|нет|не\s+підходить|не\s+подходит|не\s+згоден|не\s+згодна|не\s+согласен|не\s+согласна|відмовляюсь|отказываюсь)(?=$|[^\p{L}])/iu;
const TERMS_POSITIVE =
  /(?:^|[^\p{L}])(?:так|да|підходить|подходит|згоден|згодна|согласен|согласна|домовились|договорились|гаразд|хорошо|окей|ок)(?=$|[^\p{L}])/iu;
const NAME_QUESTION = /(?:як\s+до\s+вас\s+звертатися|как\s+к\s+вам\s+обращаться|(?:ім['’]?я|имя))/iu;
const NAME_INTRODUCTION =
  /(?:меня\s+зовут|мо[её]\s+имя|мене\s+звати|моє\s+ім['’]?я)\s+([\p{L}'’-]{2,50})/iu;
const IMMEDIATE_ELECTRICAL_HAZARD =
  /(?:\b(?:дым|дим)\b|дым(?:ит|ится|ок)|дим(?:ить|иться)|задим|задым|іскр|искр|запах\s+(?:гарі|гари)|пахне\s+горіл|пахнет\s+горел)/iu;
const PRICE_QUESTION =
  /(?:скільки|сколько|поч[её]м|вартіст|сто(?:ит(?:ь)?|имость)|кошту|цін|цен)/iu;
const URGENCY_MESSAGE =
  /(?:сроч|термінов|как\s+можно\s+быстр|якомога\s+швидш|прямо\s+сейчас|прямо\s+зараз)/iu;
const COST_CONCERN =
  /(?:денег\s+не\s+хват|грошей\s+не\s+вистач|не\s+(?:потяну|потягну|смогу\s+оплатить|зможу\s+оплатити)|боюсь.*(?:цен|цін|стоим|вартіст)|дорого|задорого|бюджет)/iu;
const TECHNICIAN_VISIT_REQUEST =
  /(?:при(?:ед|їд|езж)|вызов(?:ите|и|у|ем)?\s+мастер|виклич(?:те|емо)?\s+майстр|оформ(?:ите|ить|имо)?\s+(?:выезд|виїзд)|нужен\s+мастер|потрібен\s+майстер)/iu;
const CANCEL_VISIT_REQUEST =
  /(?:не\s+при(?:ед|їд|езж)|не\s+(?:нужен|потрібен)\s+(?:мастер|майстер)|не\s+(?:оформляйте|оформлюйте)\s+(?:выезд|виїзд))/iu;
const NON_LOCATION_ANSWER =
  /(?:выключ|вимк|отключ|відключ|включ|увімк|дым|дим|іскр|искр|работ|прац|кот[её]л|котел|стирал|прал|посудом|машин|техник|сроч|термінов|не\s+знаю|не\s+знаем|не\s+знаємо|^(?:да|нет|так|ні|ок|окей|хорошо|добре)$)/iu;
const VOLUNTARY_TERMS_ACCEPTANCE =
  /(?=.*(?:виїзд|выезд))(?=.*(?:діагност|диагност))(?=.*(?:згод|соглас|підход|подход))/iu;

export type DetectedService =
  | "boiler-repair"
  | "boiler-cleaning"
  | "boiler-installation"
  | "washer"
  | "dishwasher";

export function detectServiceFromText(text: string): DetectedService | null {
  if (/(посудом|посудомий|dishwasher)/i.test(text)) return "dishwasher";
  if (/(стирал|прал|washer)/i.test(text)) return "washer";
  if (!/(кот(?:[её]л|ел|л(?:а|у|ом|и|ів)?)|boiler)/i.test(text)) return null;
  if (/(чист|обслуж|обслугов)/i.test(text)) return "boiler-cleaning";
  if (/(установ|встанов|замен|замін)/i.test(text)) return "boiler-installation";
  return "boiler-repair";
}

export function isValidUkrainianPhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return (digits.length === 10 && digits.startsWith("0")) ||
    (digits.length === 12 && digits.startsWith("380"));
}

export function hasInvalidPhoneCandidate(text: string): boolean {
  const candidate = text.match(PHONE_PATTERN)?.[0];
  return Boolean(candidate && !isValidUkrainianPhone(candidate));
}

export function explicitlyAcceptsTerms(text: string): boolean {
  return VOLUNTARY_TERMS_ACCEPTANCE.test(text) && !TERMS_NEGATIVE.test(text);
}

export function extractExplicitLocation(text: string): string | null {
  const placeMatch = text.match(
    /(?:(?:нахожусь|находимся|знаходжусь|знаходимось)\s+(?:в|у)|(?:я|мы|ми)\s+(?:в|у))\s+([\p{L}'’-]+(?:\s+[\p{L}'’-]+){0,2})/iu
  );
  if (!placeMatch) return null;

  const place = placeMatch[1].trim();
  const addressMatch = text.match(
    /((?:вул(?:иця|иці|\.)?|улиц(?:а|е|ы)?|ул\.)\s*[\p{L}'’-]+(?:\s+[\p{L}'’-]+){0,2}\s*,?\s*\d{1,4}(?:[\p{L}]|[/-]\d+)?)/iu
  );
  return addressMatch ? `${place}, ${addressMatch[1].trim()}` : place;
}

export function extractContactAnswer(
  text: string,
  previousManagerMessage: string
): { name?: string; phone?: string } {
  const phoneMatch = text.match(PHONE_PATTERN);
  const phoneCandidate = phoneMatch?.[0].trim();
  const phone = phoneCandidate && isValidUkrainianPhone(phoneCandidate)
    ? phoneCandidate
    : undefined;
  const introducedName = text.match(NAME_INTRODUCTION)?.[1];
  if (introducedName) return { name: introducedName, phone };
  if (!NAME_QUESTION.test(previousManagerMessage)) return { phone };

  const possibleName = text
    .replace(PHONE_PATTERN, " ")
    .replace(/^(?:меня\s+зовут|мо[её]\s+имя|мене\s+звати|моє\s+ім['’]?я|я)\s+/iu, "")
    .replace(/^[\s,;:.-]+|[\s,;:.-]+$/g, "")
    .trim();
  const name = /^[\p{L}][\p{L}'’ -]{0,49}$/u.test(possibleName)
    ? possibleName
    : undefined;

  return { name, phone };
}

export function describesImmediateElectricalHazard(text: string): boolean {
  return IMMEDIATE_ELECTRICAL_HAZARD.test(text);
}

export function asksAboutPrice(text: string): boolean {
  return PRICE_QUESTION.test(text);
}

export function expressesUrgency(text: string): boolean {
  return URGENCY_MESSAGE.test(text);
}

export function expressesCostConcern(text: string): boolean {
  return COST_CONCERN.test(text);
}

export function requestsTechnicianVisit(text: string): boolean {
  return TECHNICIAN_VISIT_REQUEST.test(text) && !CANCEL_VISIT_REQUEST.test(text);
}

export function normalizeManagerReply(text: string): string {
  return text
    .replace(/[ \t]{2,}/g, " ")
    .replace(/[ \t]+([,.!?;:])/g, "$1")
    .trim();
}

export function hasExactAddress(text: string): boolean {
  const withoutPhone = text.replace(PHONE_PATTERN, " ");
  const hasBuildingNumber = /\b\d{1,4}(?:\b|[/-])/.test(withoutPhone);
  return (ADDRESS_MARKER.test(withoutPhone) && hasBuildingNumber) ||
    STREET_AND_NUMBER.test(withoutPhone);
}

export function looksLikeLocationAnswer(text: string): boolean {
  const normalized = text.trim();
  if (!normalized || normalized.length > 80 || NON_LOCATION_ANSWER.test(normalized)) return false;
  if (hasExactAddress(normalized)) return true;
  if (/\d/.test(normalized)) return false;

  const place = normalized
    .replace(/^(?:(?:я|мы|ми)\s+)?(?:нахожусь|находимся|знаходжусь|знаходимось)\s+(?:в|у)\s+/iu, "")
    .replace(/^(?:м(?:істо|\.)?|с(?:ело|\.)?|смт)\s+/iu, "")
    .replace(/[.,]/g, " ")
    .trim();
  const words = place.match(/[\p{L}'’-]+/gu) ?? [];
  return words.length >= 1 && words.length <= 4 && words.join(" ").length >= 3;
}

function getLocationAnswerIndex(messages: ConversationMessage[]): number {
  for (let index = 0; index < messages.length - 1; index += 1) {
    const message = messages[index];
    const answer = messages[index + 1];
    if (
      message.sender === "manager" &&
      LOCATION_QUESTION.test(message.text) &&
      answer.sender === "client" &&
      looksLikeLocationAnswer(answer.text)
    ) {
      return index + 1;
    }
  }

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.sender === "client" && extractExplicitLocation(message.text)) return index;
  }

  return -1;
}

export function hasLocationAnswer(messages: ConversationMessage[]): boolean {
  return getLocationAnswerIndex(messages) >= 0;
}

export function getLocationAnswer(messages: ConversationMessage[]): string | null {
  const index = getLocationAnswerIndex(messages);
  if (index < 0) return null;
  return extractExplicitLocation(messages[index].text) ?? messages[index].text.trim();
}

export function isAwaitingLocation(messages: ConversationMessage[]): boolean {
  let lastManagerIndex = -1;
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    if (messages[index].sender === "manager") {
      lastManagerIndex = index;
      break;
    }
  }
  if (lastManagerIndex < 0 || !LOCATION_QUESTION.test(messages[lastManagerIndex].text)) return false;
  const laterClientAnswer = messages.slice(lastManagerIndex + 1).find(
    (message) => message.sender === "client"
  );
  return Boolean(laterClientAnswer && !looksLikeLocationAnswer(laterClientAnswer.text));
}

export function shouldAskExactAddress(messages: ConversationMessage[]): boolean {
  const locationAnswerIndex = getLocationAnswerIndex(messages);

  if (locationAnswerIndex < 0) return false;

  const laterMessages = messages.slice(locationAnswerIndex);
  if (laterMessages.some((message) => message.sender === "client" && hasExactAddress(message.text))) {
    return false;
  }

  let addressQuestionIndex = -1;
  for (let index = laterMessages.length - 1; index >= 0; index -= 1) {
    if (
      laterMessages[index].sender === "manager" &&
      EXACT_ADDRESS_QUESTION.test(laterMessages[index].text)
    ) {
      addressQuestionIndex = index;
      break;
    }
  }

  if (addressQuestionIndex < 0) return true;
  const answer = laterMessages.slice(addressQuestionIndex + 1).find(
    (message) => message.sender === "client"
  );
  if (!answer) return true;
  if (ADDRESS_UNAVAILABLE.test(answer.text)) return false;

  return true;
}

export function getTermsDecision(messages: ConversationMessage[]): TermsDecision {
  let questionIndex = -1;

  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (message.sender === "manager" && TERMS_QUESTION.test(message.text)) {
      questionIndex = index;
    }
  }

  if (questionIndex < 0) return "not-asked";

  const answers = messages
    .slice(questionIndex + 1)
    .filter((message) => message.sender === "client");
  const answer = answers.at(-1);
  if (!answer) return "unclear";

  if (TERMS_NEGATIVE.test(answer.text)) return "declined";
  if (TERMS_POSITIVE.test(answer.text)) return "accepted";
  return "unclear";
}
