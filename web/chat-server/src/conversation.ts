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
const HUMAN_MANAGER_REQUEST =
  /(?:(?:нужен|нужна|надо|нужно|хочу|хотим|потрібен|потрібна|треба|хочу)\s+(?:мне\s+|нам\s+|мені\s+|нам\s+)?(?:жив(?:ой|ого|у)?\s+|реальн(?:ый|ого|у)?\s+|справжн(?:ій|ього|ю)?\s+)?(?:человек|оператор|менеджер|людина|людину)|(?:человек|оператор|менеджер|людина)\s+(?:нужен|нужна|надо|нужно|потрібен|потрібна|треба)|(?:позов(?:и|ите|іть)|приглас(?:и|ите)|переключ(?:и|ите)|соедин(?:и|ите)|да(?:й|йте)|поклич(?:те)?|запрос(?:и|іть)|перемкн(?:и|іть)|з['’]?єднай(?:те)?)\s+(?:меня\s+|мне\s+|нас\s+|зі?\s+|с\s+)?(?:жив(?:ой|ого|у)?\s+|реальн(?:ый|ого|у)?\s+|справжн(?:ій|ього|ю)?\s+)?(?:человек|оператор|менеджер|людина|людину)|(?:с\s+человеком|з\s+людиною)\s+(?:поговорить|поговорити)|(?:позов(?:и|ите|іть)|поклич(?:те)?)\s+(?:кого-нибудь|когось))/iu;
const HUMAN_IDENTITY_QUESTION =
  /(?:(?:ты|вы|ти|ви)\s+(?:(?:разве|точно|вообще|дійсно|справді|не)\s+)*(?:живой\s+|жива\s+|справжн(?:ій|я)\s+)?(?:человек|людина|бот|робот)|(?:это|це)\s+(?:бот|робот|человек|людина)|(?:я\s+)?(?:говорю|розмовляю)\s+(?:с\s+человеком|з\s+людиною))/iu;
const NON_LOCATION_ANSWER =
  /(?:выключ|вимк|отключ|відключ|включ|увімк|дым|дим|іскр|искр|работ|прац|кот[её]л|котел|стирал|прал|посудом|машин|техник|сроч|термінов|не\s+знаю|не\s+знаем|не\s+знаємо|^(?:да|нет|так|ні|ок|окей|хорошо|добре)$)/iu;
const VOLUNTARY_TERMS_ACCEPTANCE =
  /(?=.*(?:виїзд|выезд))(?=.*(?:діагност|диагност))(?=.*(?:згод|соглас|підход|подход))/iu;
const SYMPTOM_QUESTION =
  /(?:що\s+саме|что\s+именно|що\s+відбувається|что\s+происходит|як\s+поводиться|как\s+вед[её]т\s+себя|не\s+вмикається|не\s+включается|не\s+запуска|что\s+случилось|що\s+сталося)/iu;
const DEVICE_DETAILS_QUESTION = /(?:марк|бренд|модел)/iu;
const UNKNOWN_DEVICE_DETAILS =
  /^(?:(?:марку|марка|модель|моделі|бренд)\s+)?(?:не\s+знаю|не\s+пам['’]?ятаю|не\s+помню|невідомо|неизвестно)[.!]?$/iu;

export type DetectedService =
  | "boiler-repair"
  | "boiler-cleaning"
  | "boiler-installation"
  | "washer"
  | "dishwasher";

export function detectServiceFromText(text: string): DetectedService | null {
  if (/(посудом|посудомий|dishwasher)/i.test(text)) return "dishwasher";
  // «стир» покрывает и «стиралка/стиральная», и «для стирки»;
  // «отжим» — симптом только стиральной машины.
  if (/(стир|прал|отжим|віджим|washer)/i.test(text)) return "washer";
  if (!/(кот(?:[её]л|ел|л(?:а|у|ом|и|ів)?)|boiler)/i.test(text)) return null;
  if (/(чист|обслуж|обслугов)/i.test(text)) return "boiler-cleaning";
  if (/(установ|встанов|замен|замін)/i.test(text)) return "boiler-installation";
  return "boiler-repair";
}

const SERVICE_SLUGS: Record<string, DetectedService | "other"> = {
  "boiler-repair": "boiler-repair",
  "boiler-cleaning": "boiler-cleaning",
  "boiler-installation": "boiler-installation",
  washer: "washer",
  dishwasher: "dishwasher",
  other: "other",
  kotly: "boiler-repair",
  "pralni-mashyny": "washer",
  "posudomyini-mashyny": "dishwasher",
  "posudomyiny-mashyny": "dishwasher",
};

export function normalizeService(
  service: string | null | undefined
): DetectedService | "other" {
  if (!service) return "other";
  return SERVICE_SLUGS[service.toLowerCase()] ?? "other";
}

const KNOWN_BRANDS = [
  "AEG", "Ariston", "Arderia", "Atlantic", "Beko", "Beretta", "Bosch",
  "Buderus", "Candy", "Daewoo", "Danko", "Electrolux", "Fagor", "Ferroli",
  "Gorenje", "Greta", "Hansa", "Hyundai", "Immergas", "Indesit", "Kaiser",
  "LG", "Miele", "Navien", "Protherm", "Roda", "Samsung", "Sharp", "Siemens",
  "Sitherm", "Termet", "Thermia", "Toshiba", "Vaillant", "Viessmann",
  "Whirlpool", "Zanussi",
];

const BRAND_LOOKUP = new Map(KNOWN_BRANDS.map((brand) => [brand.toLowerCase(), brand]));

export function extractBrandFromText(
  text: string
): { brand: string; model?: string } | null {
  const tokens = text.split(/[^\p{L}\d-]+/u).filter(Boolean);
  for (const [index, token] of tokens.entries()) {
    const brand = BRAND_LOOKUP.get(token.toLowerCase());
    if (!brand) continue;
    const next = tokens[index + 1];
    const model =
      next && /^[\dA-Za-z-]{3,}$/u.test(next) && /\d/.test(next) ? next : undefined;
    return model ? { brand, model } : { brand };
  }
  return null;
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

const PLACE_NOMINATIVE: Record<string, string> = {
  "бровари": "Бровари",
  "броварах": "Бровари",
  "броварів": "Бровари",
  "бровары": "Бровари",
  "київ": "Київ",
  "києві": "Київ",
  "киев": "Київ",
  "киеве": "Київ",
};

export function normalizePlaceName(place: string): string {
  const stripped = place.trim().replace(/^[.,;:\s]+|[.,;:\s]+$/g, "");
  return PLACE_NOMINATIVE[stripped.toLowerCase()] ?? place.trim();
}

export function extractExplicitLocation(text: string): string | null {
  const placeMatch = text.match(
    /(?:(?:нахожусь|находимся|знаходжусь|знаходимось)\s+(?:в|у)|(?:я|мы|ми)\s+(?:в|у))\s+([\p{L}'’-]+(?:\s+[\p{L}'’-]+){0,2})/iu
  );
  if (!placeMatch) return null;

  const place = normalizePlaceName(placeMatch[1]);
  const addressMatch = text.match(
    /((?:вул(?:иця|иці|\.)?|улиц(?:а|е|ы)?|ул\.)\s*[\p{L}'’-]+(?:\s+[\p{L}'’-]+){0,2}\s*,?\s*(?:буд(?:инок|\.)?|дом|д\.)?\s*,?\s*\d{1,4}(?:[\p{L}]|[/-]\d+)?(?:\s*,?\s*кв(?:артира|\.)?\s*\d{1,4})?)/iu
  );
  return addressMatch ? `${place}, ${addressMatch[1].trim()}` : place;
}

const GREETING_SENTENCE =
  /^(?:добрий\s+(?:день|ранок|вечір)|доброго\s+дня|добрый\s+(?:день|вечер)|доброе\s+утро|здрастуйте|здравствуйте|вітаю|привіт|привет|хай)(?![\p{L}])/iu;
const CONTACT_SENTENCE =
  /(?:мене\s+звати|меня\s+зовут|моє\s+ім['’]?я|мо[её]\s+имя|номер\s+телефону|номер\s+телефона|телефон)/iu;
const PLACE_SENTENCE =
  /(?:(?:я|мы|ми)\s+(?:в|у)\s+[\p{L}'’-]|(?:нахожусь|находимся|знаходжусь|знаходимось)\s+(?:в|у)\b)/iu;

export function extractInitialSymptom(text: string): string {
  const sentences = text.match(/[^.!?]+[.!?]?/g) ?? [text];
  const kept = sentences.filter((sentence) => {
    const trimmed = sentence.trim();
    if (!trimmed) return false;
    if (GREETING_SENTENCE.test(trimmed) && !trimmed.replace(GREETING_SENTENCE, "").replace(/[\s,!:;.'’-]/g, "")) {
      return false;
    }
    if (VOLUNTARY_TERMS_ACCEPTANCE.test(trimmed)) return false;
    if (hasExactAddress(trimmed) || (PLACE_SENTENCE.test(trimmed) && ADDRESS_MARKER.test(trimmed))) {
      return false;
    }
    if (CONTACT_SENTENCE.test(trimmed) || PHONE_PATTERN.test(trimmed)) return false;
    return true;
  });
  const symptom = kept.map((sentence) => sentence.trim()).join(" ").replace(/\s+/g, " ").trim();
  // Если всё отфильтровалось (например, сообщение было только приветствием),
  // симптом пустой — он дополнится позже по ходу разговора.
  return symptom;
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

export function isSymptomAnswerExpected(previousManagerMessage: string): boolean {
  return SYMPTOM_QUESTION.test(previousManagerMessage) &&
    !DEVICE_DETAILS_QUESTION.test(previousManagerMessage);
}

export function extractDeviceDetailsAnswer(
  text: string,
  previousManagerMessage: string
): string | null {
  if (!DEVICE_DETAILS_QUESTION.test(previousManagerMessage)) return null;
  const value = text.trim().replace(/\s+/g, " ");
  if (!value || UNKNOWN_DEVICE_DETAILS.test(value)) return null;
  return value.slice(0, 300);
}

export function mergeRequestSymptom(
  current: string | null | undefined,
  detail: string
): string {
  const existing = current?.trim() ?? "";
  const addition = detail.trim();
  if (!existing) return addition.slice(0, 1500);
  if (!addition || existing.toLocaleLowerCase().includes(addition.toLocaleLowerCase())) {
    return existing;
  }
  return `${existing}. ${addition}`.replace(/\.{2,}/g, ".").slice(0, 1500);
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

export function requestsHumanManager(text: string): boolean {
  return HUMAN_MANAGER_REQUEST.test(text);
}

export function asksIfHumanManager(text: string): boolean {
  return HUMAN_IDENTITY_QUESTION.test(text);
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

export function combineLocationWithAddress(
  currentLocation: string | null | undefined,
  addressText: string
): string {
  const address = addressText.trim();
  const current = currentLocation?.trim() ?? "";
  if (!current || hasExactAddress(current)) return address;
  if (address.toLocaleLowerCase().includes(current.toLocaleLowerCase())) return address;
  return `${current}, ${address}`;
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
  const explicit = extractExplicitLocation(messages[index].text);
  if (explicit) return explicit;
  const answer = messages[index].text
    .trim()
    .replace(/^(?:(?:я|мы|ми)\s+)?(?:нахожусь|находимся|знаходжусь|знаходимось)\s+(?:в|у)\s+/iu, "")
    .replace(/^(?:в|у)\s+/iu, "")
    .replace(/^(?:м(?:істо|\.)?|с(?:ело|\.)?|смт)\s+/iu, "")
    .replace(/[.,]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return normalizePlaceName(answer);
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
