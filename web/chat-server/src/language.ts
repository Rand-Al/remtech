export type ChatLanguage = "uk" | "ru";

const RUSSIAN_WORDS = new Set([
  "нужно", "нужна", "нужен", "нужны", "надо", "можно", "пожалуйста", "сегодня", "срочно", "желательно",
  "кто", "что", "где", "когда", "работает", "сломался", "сломалась",
  "поломался", "поломалась", "поламался", "поламалась", "почистить", "стиральная", "посудомоечная",
  "ошибка", "ошибку", "выдает", "выдаёт", "нет", "хорошо", "спасибо",
  "делаете", "собаку", "подстричь", "подстрич", "контора", "если", "вроде",
  "ремонтируете", "ремонтируешь", "тапки", "обувь",
  "машинка", "машинки", "включу", "осмотра", "мастера",
  "стиралка", "стиралки", "отжимает", "сливает", "набирает", "гремит",
  "шумит", "течет", "течёт", "протекает", "включается", "выключается",
  "приезжайте", "приедьте", "просто", "выключен", "выключена",
]);

const UKRAINIAN_WORDS = new Set([
  "потрібно", "треба", "можна", "будь ласка", "сьогодні", "терміново",
  "бажано", "хто", "що", "де", "коли", "працює", "зламався", "зламалася",
  "почистити", "пральна", "посудомийна", "помилка", "помилку", "видає",
  "немає", "добре", "дякую",
]);

function scoreMessageLanguage(text: string): { uk: number; ru: number } {
  const normalized = text.toLowerCase();
  const words = normalized.match(/[а-яёіїєґ]+/g) ?? [];

  // A single language-specific letter or word is enough for a short chat reply.
  let uk = (normalized.match(/[іїєґ]/g) ?? []).length * 3;
  let ru = (normalized.match(/[ыэёъ]/g) ?? []).length * 3;

  for (const word of words) {
    if (UKRAINIAN_WORDS.has(word) || word.startsWith("помил")) uk += 3;
    if (
      RUSSIAN_WORDS.has(word) ||
      word.startsWith("ошиб") ||
      /^пол[оа]мал/.test(word)
    ) ru += 3;
  }

  return { uk, ru };
}

export function detectMessageLanguage(text: string): ChatLanguage | null {
  const score = scoreMessageLanguage(text);
  if (score.ru >= 3 && score.ru > score.uk) return "ru";
  if (score.uk >= 3 && score.uk > score.ru) return "uk";
  return null;
}

export function detectConversationLanguage(
  messages: { sender: "client" | "manager"; text: string }[],
  initialLanguage: ChatLanguage = "uk"
): ChatLanguage {
  let language = initialLanguage;

  for (const message of messages) {
    if (message.sender !== "client") continue;
    const detected = detectMessageLanguage(message.text);
    if (detected) language = detected;
  }

  return language;
}
