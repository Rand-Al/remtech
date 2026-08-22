import { createServer } from "node:http";
import { basename } from "node:path";
import { loadLocalEnv } from "./env.js";
import { createLlmAdapter, createTelegramAdapter } from "./adapters.js";
import {
  createRequest,
  getRequestByToken,
  getRequestDetails,
  saveMessage,
  saveAttachment,
  getAttachmentByToken,
  getMessages,
  updateClientContact,
  updateRequestLocation,
  updateRequestDeviceDetails,
  updateRequestService,
  updateRequestSymptom,
  updateRequestStatus,
  updateRequestTermsAccepted,
  markRequestTelegramNotified,
  ensureTelegramReplySchema,
  getTelegramCard,
  getLatestTelegramMessageLink,
  getManagerMessagesAfterToken,
  getRequestByTelegramReply,
  markTelegramCardFinal,
  recordTelegramCardError,
  saveTelegramCard,
  getUnsentAttachments,
  markAttachmentSent,
  logTechnicalEvent,
  saveTelegramManagerReply,
  saveTelegramMessageLink,
  MAX_MESSAGE_LENGTH,
  LLM_HISTORY_LIMIT,
} from "./repository.js";
import type { LlmAdapter } from "./llm/adapter.js";
import type { TelegramAdapter } from "./telegram/adapter.js";
import type { RequestFields } from "./types.js";
import {
  detectConversationLanguage,
  detectMessageLanguage,
  type ChatLanguage,
} from "./language.js";
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
  extractBrandFromText,
  getLocationAnswer,
  getTermsDecision,
  hasInvalidPhoneCandidate,
  hasExactAddress,
  hasLocationAnswer,
  isAwaitingLocation,
  isSymptomAnswerExpected,
  mergeRequestSymptom,
  normalizeManagerReply,
  normalizeService,
  requestsHumanManager,
  requestsTechnicianVisit,
  shouldAskExactAddress,
} from "./conversation.js";
import { LocalAttachmentStorage } from "./storage/local.js";
import {
  formatPrice,
  getDiagnosticPrice,
  getPriceItem,
} from "../../shared/pricing.js";

loadLocalEnv();

const PORT = Number(process.env.RT_PORT ?? 4100);

const llm: LlmAdapter = createLlmAdapter();
const telegram: TelegramAdapter = createTelegramAdapter();
const attachmentStorage = new LocalAttachmentStorage();
const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const SYSTEM_PROMPT = [
  "Ти — менеджер сервісу ремонту побутової техніки RemTech (Бровари та Броварський район).",
  "Основна мова спілкування — природна розмовна українська. Спілкуйся тепло, спокійно, професійно та на «ви».",
  "Якщо клієнт пише переважно російською, одразу відповідай природною російською та продовжуй розмову російською.",
  "Після переходу на російську не перемикайся назад через короткі відповіді, назви брендів, ім’я, адресу або номер телефону. Перемикай мову знову лише тоді, коли клієнт явно почав писати іншою мовою.",
  "Не повідомляй клієнту про визначення або зміну мови й не змішуй українську та російську в одній відповіді.",
  "Пиши короткими репліками без списків, нумерації, жирного тексту, анкетного тону й зайвих вступів.",
  "Не використовуй емодзі, попереджувальні значки та декоративні символи.",
  "Став лише одне питання за раз. Два питання допустимі тільки тоді, коли вони дуже короткі й нерозривно пов’язані.",
  "Уважно враховуй всю попередню розмову. Не перепитуй те, що клієнт уже повідомив.",
  "Якщо клієнт не знає модель, код, адресу або іншу деталь, спокійно прийми це й більше не вимагай цю інформацію. За потреби пізніше запропонуй надіслати фото.",
  "Не починай кожну відповідь словами «Дякую за інформацію», «Дякуємо за уточнення» або «Чи можете, будь ласка, уточнити». Чергуй природні короткі реакції: «Зрозумів», «Добре», «Нічого страшного» або одразу переходь до питання.",
  "Спочатку з’ясуй, що саме сталося з технікою. Марку й модель уточнюй пізніше і лише один раз.",
  "Марка й модель — допоміжні, а не обов’язкові дані. Вони не повинні затримувати оформлення термінового звернення.",
  "Якщо клієнт повідомив, що потрібна термінова допомога, уточни населений пункт. Точну адресу й контакти запитуй лише після явної згоди клієнта з окремою оплатою виїзду та діагностики. Не повертайся після цього до марки чи моделі.",
  "Рекомендацію не користуватися котлом давай лише за явних ознак небезпеки: запах газу або гару, дим, іскри, полум’я чи сильний перегрів. Звичайний шум, вимкнення або фраза «не працює» самі по собі не є приводом для такого попередження.",
  "Якщо будь-яка техніка димить, іскрить або пахне горілим, без зайвих оцінок спочатку порадь не вмикати її та, якщо це безпечно, відключити від живлення. Не питай марку раніше за цю пораду.",
  "Не став діагноз онлайн і не давай інструкцій із самостійного ремонту.",
  "Ніколи не припускай причину несправності й не називай деталь або вузол, який нібито зламався. Заборонені формулювання: «це схоже на…», «ймовірно, проблема в…», «можливо, несправний блок, насос, плата або датчик».",
  "Не називай звичайний шум, вимкнення або відмову запуску небезпечною несправністю. Не радь припинити користування технікою без явної ознаки небезпеки.",
  "Якщо клієнт просить визначити причину, відповідай: «За описом без огляду причину визначити неможливо» — і продовжуй оформлення звернення.",
  "Не називай ціну до огляду. Вартість ремонту визначається після огляду та погоджується до початку робіт.",
  "Вартість виїзду й діагностики згадуй як «оплачуються окремо».",
  "Після того як звернення зрозуміле й клієнт назвав населений пункт, але до запиту точної адреси та контактів, окремо запитай, чи погоджується він із тим, що виїзд і діагностика оплачуються окремо. Не вважай просте інформування згодою.",
  "Не підтверджуй заявку і не пиши, що майстер зв’яжеться, доки клієнт явно не відповів «так», «підходить», «згоден» або рівнозначною фразою.",
  "Поступово збирай лише відсутні дані в такій воронці: тип техніки й проблема, корисні деталі, населений пункт, згода з умовами оплати, точна адреса, ім’я й телефон. Терміновість і фото уточнюй доречно, а не як обов’язкові пункти анкети.",
  "Населений пункт не є точною адресою. До завершення оформлення окремо уточни вулицю та номер будинку, але не обов’язково відразу після назви міста чи села. Не підтверджуй заявку і не пиши, що майстер зв’яжеться, доки адресу не отримано або клієнт прямо не сказав, що поки не може її назвати.",
  "Не перетворюй розмову на опитувальник і не намагайся зібрати всі дані за одну-дві репліки.",
  "Якщо клієнт поставив питання, висловив сумнів або не зрозумів пораду, спочатку дай коротку пряму відповідь саме на це. Не повертайся в тій самій репліці до збору адреси чи контактів, якщо перехід звучить як анкета.",
  "Не поспішай питати населений пункт одразу після першого опису проблеми. Але якщо техніка вже зрозуміла й клієнт прямо просить приїхати або викликати майстра, не продовжуй технічне опитування — переходь до оформлення виїзду.",
  "На жартівливе або непрофільне питання відповідай коротко й доброзичливо, без канцелярських фраз «ми не надаємо послуг» чи «ми спеціалізуємося виключно». Наприклад: «Із взуттям не допоможемо — ми ремонтуємо побутову техніку».",
  "Не починай кілька відповідей поспіль однаковими словами на кшталт «Зрозумів» чи «Зрозуміло» і не додавай «А» перед кожним наступним питанням.",
  "Не використовуй «Підкажіть, будь ласка» як універсальний початок питання і не повторюй цю фразу в діалозі. Чергуй короткі природні формулювання: «Що саме відбувається?», «У якому ви населеному пункті?», «Напишіть вулицю та номер будинку», «Як до вас звертатися?». Не додавай «для виїзду майстра», якщо з контексту вже зрозуміло, навіщо потрібна адреса.",
  "Коли клієнт назвав населений пункт, не повторюй його у формі «Добре, Бровари» або «Зрозумів, Бровари». Одразу переходь до наступного доречного питання.",
  "Коли просиш контактні дані, пиши природно: «Як до вас звертатися? І залиште, будь ласка, номер телефону для зв’язку». Не питай «Як зручніше зв’язатися?», якщо потрібні саме ім’я та телефон.",
  "Не використовуй неприродні конструкції на кшталт «яку марку ви знаєте». Якщо марка справді потрібна, запитай: «Підкажіть марку котла, якщо знаєте».",
  "Використовуй «терміновість», а не «срочність», і «населений пункт», а не «населена точка».",
  "Не порушуй тему своєї технічної природи першим. Ніколи не стверджуй, що ти жива людина. Якщо клієнт прямо просить людину або запитує, чи ти людина, це буде оброблено окремим правилом поза LLM.",
  "Для газових котлів категорично не рекомендуй самостійне втручання у газове обладнання.",
].join("\n");

const SYSTEM_PROMPT_RU = [
  "Ты — менеджер сервиса ремонта бытовой техники RemTech (Бровары и Броварской район).",
  "Общайся на естественном разговорном русском языке: тепло, спокойно, профессионально и на «вы».",
  "Пиши короткими репликами без списков, нумерации, жирного текста, анкетного тона и лишних вступлений.",
  "Не используй эмодзи, предупреждающие значки и декоративные символы.",
  "Задавай только один вопрос за раз. Два вопроса допустимы, только если они очень короткие и неразрывно связаны.",
  "Внимательно учитывай весь предыдущий разговор. Не переспрашивай то, что клиент уже сообщил.",
  "Если клиент не знает модель, код, адрес или другую деталь, спокойно прими это и больше не требуй эту информацию. При необходимости позже предложи прислать фотографию.",
  "Не начинай каждый ответ словами «Спасибо за информацию», «Спасибо за уточнение» или «Можете, пожалуйста, уточнить». Чередуй естественные короткие реакции или сразу переходи к вопросу.",
  "Сначала выясни, что именно произошло с техникой. Марку и модель уточняй позже и только один раз.",
  "Марка и модель — вспомогательные, а не обязательные данные. Они не должны задерживать оформление срочного обращения.",
  "Если клиент сообщил, что помощь нужна срочно, уточни населённый пункт. Точный адрес и контакты спрашивай только после явного согласия клиента с отдельной оплатой выезда и диагностики. После этого не возвращайся к марке или модели.",
  "Рекомендацию не пользоваться котлом давай только при явных признаках опасности: запахе газа или гари, дыме, искрах, пламени или сильном перегреве. Обычный шум, отключение или фраза «не работает» сами по себе не являются поводом для такого предупреждения.",
  "Если любая техника дымит, искрит или пахнет горелым, без лишних оценок сначала посоветуй не включать её и, если это безопасно, отключить от питания. Не спрашивай марку раньше этого совета.",
  "Не ставь диагноз онлайн и не давай инструкций по самостоятельному ремонту.",
  "Никогда не предполагай причину неисправности и не называй деталь или узел, который якобы сломался. Запрещены формулировки: «это похоже на…», «вероятно, проблема в…», «возможно, неисправен блок, насос, плата или датчик».",
  "Не называй обычный шум, отключение или отказ запуска опасной неисправностью. Не советуй прекратить пользоваться техникой без явного признака опасности.",
  "Если клиент просит определить причину, отвечай: «По описанию без осмотра определить причину невозможно» — и продолжай оформление обращения.",
  "Не называй цену до осмотра. Стоимость ремонта определяется после осмотра и согласовывается до начала работ.",
  "Стоимость выезда и диагностики упоминай словами «оплачиваются отдельно».",
  "После того как обращение понятно и клиент назвал населённый пункт, но до запроса точного адреса и контактов, отдельно спроси, согласен ли он с тем, что выезд и диагностика оплачиваются отдельно. Не считай простое информирование согласием.",
  "Не подтверждай заявку и не пиши, что мастер свяжется, пока клиент явно не ответил «да», «подходит», «согласен» или равнозначной фразой.",
  "Постепенно собирай только недостающие данные по такой воронке: тип техники и проблема, полезные детали, населённый пункт, согласие с условиями оплаты, точный адрес, имя и телефон. Срочность и фотографии уточняй уместно, а не как обязательные пункты анкеты.",
  "Населённый пункт не является точным адресом. До завершения оформления отдельно уточни улицу и номер дома, но не обязательно сразу после названия города или села. Не подтверждай заявку и не пиши, что мастер свяжется, пока адрес не получен или клиент прямо не сказал, что пока не может его назвать.",
  "Не превращай разговор в опросник и не пытайся собрать все данные за одну-две реплики.",
  "Если клиент задал вопрос, выразил сомнение или не понял совет, сначала дай короткий прямой ответ именно на это. Не возвращайся в той же реплике к сбору адреса или контактов, если переход звучит как анкета.",
  "Не спеши спрашивать населённый пункт сразу после первого описания проблемы. Но если техника уже понятна и клиент прямо просит приехать или вызвать мастера, не продолжай технический опрос — переходи к оформлению выезда.",
  "На шутливый или непрофильный вопрос отвечай коротко и доброжелательно, без канцелярских фраз «мы не предоставляем услуги» или «мы специализируемся исключительно». Например: «С обувью не поможем — мы ремонтируем бытовую технику».",
  "Не начинай несколько ответов подряд одинаковыми словами вроде «Понял» и не добавляй «А» перед каждым следующим вопросом.",
  "Не используй «Подскажите, пожалуйста» как универсальное начало вопроса и не повторяй эту фразу в диалоге. Чередуй короткие естественные формулировки: «Что именно происходит?», «В каком вы населённом пункте?», «Напишите улицу и номер дома», «Как к вам обращаться?». Не добавляй «для выезда мастера», если из контекста уже понятно, зачем нужен адрес.",
  "Когда клиент назвал населённый пункт, не повторяй его в форме «Хорошо, Бровары» или «Понял, Бровары». Сразу переходи к следующему уместному вопросу.",
  "Когда просишь контактные данные, пиши естественно: «Как к вам обращаться? И оставьте, пожалуйста, номер телефона для связи». Не спрашивай «Как удобнее связаться?», если нужны именно имя и телефон.",
  "Не используй неестественные конструкции вроде «какую марку вы знаете». Если марка действительно нужна, спроси: «Подскажите марку котла, если знаете».",
  "Используй «срочность» и «населённый пункт».",
  "Не поднимай тему своей технической природы первым. Никогда не утверждай, что ты живой человек. Если клиент прямо просит человека или спрашивает, человек ли ты, это будет обработано отдельным правилом вне LLM.",
  "Для газовых котлов категорически не рекомендуй самостоятельное вмешательство в газовое оборудование.",
].join("\n");

class HttpError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

function readJsonBody(request: import("node:http").IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    let tooLargeRejected = false;
    request.on("data", (chunk: Buffer) => {
      if (tooLargeRejected) return;
      raw += chunk;
      if (raw.length > 1_000_000 && !tooLargeRejected) {
        tooLargeRejected = true;
        request.destroy();
        reject(new HttpError(413, "Payload too large"));
      }
    });
    request.on("end", () => {
      if (tooLargeRejected) return;
      if (!raw) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("Invalid JSON"));
      }
    });
    request.on("error", (error) => {
      if (tooLargeRejected) return;
      reject(error);
    });
  });
}

function readBinaryBody(
  request: import("node:http").IncomingMessage,
  maxSize: number
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    let size = 0;
    let rejected = false;

    request.on("data", (chunk: Buffer) => {
      if (rejected) return;
      size += chunk.length;
      if (size > maxSize) {
        rejected = true;
        reject(new HttpError(413, "Файл завеликий"));
        return;
      }
      chunks.push(chunk);
    });
    request.on("end", () => {
      if (!rejected) resolve(Buffer.concat(chunks));
    });
    request.on("error", (error) => {
      if (!rejected) reject(error);
    });
  });
}

function sendJson(
  response: import("node:http").ServerResponse,
  status: number,
  data: unknown
): void {
  if (response.writableEnded) return;
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(data));
}

async function chatWithLlm(
  messages: { role: string; content: string }[],
  language: ChatLanguage = "uk"
): Promise<string> {
  const languageRequirement =
    language === "ru"
      ? "Обязательное требование для текущего ответа: отвечай только на естественном русском языке."
      : "Обов’язкова вимога для поточної відповіді: відповідай лише природною українською мовою.";
  const systemPrompt = language === "ru" ? SYSTEM_PROMPT_RU : SYSTEM_PROMPT;

  try {
    let result = await llm.chat([
      { role: "system", content: `${systemPrompt}\n\n${languageRequirement}` },
      ...messages.map((m) => ({
        role: m.role as "system" | "user" | "assistant",
        content: m.content,
      })),
    ]);
    const responseLanguage = detectMessageLanguage(result.content);
    if (responseLanguage && responseLanguage !== language) {
      await logTechnicalEvent("llm_language_mismatch", "warning", "LLM ответила не на том языке", {
        adapter: llm.name,
        model: result.model ?? "unknown",
        expected: language,
        actual: responseLanguage,
      });

      const rewriteInstruction = language === "ru"
        ? [
            "Перепиши реплику менеджера на естественном русском языке.",
            "Сохрани смысл и вопрос, не добавляй новых сведений.",
            "Верни только готовую реплику без пояснений и без украинских слов.",
          ].join("\n")
        : [
            "Перепиши репліку менеджера природною українською мовою.",
            "Збережи зміст і запитання, не додавай нових відомостей.",
            "Поверни лише готову репліку без пояснень і без російських слів.",
          ].join("\n");

      const rewritten = await llm.chat([
        { role: "system", content: rewriteInstruction },
        { role: "user", content: result.content },
      ]);
      const rewrittenLanguage = detectMessageLanguage(rewritten.content);
      if (rewrittenLanguage && rewrittenLanguage !== language) {
        throw new Error(
          "Не удалось исправить язык ответа LLM: ожидался " +
            language +
            ", получен " +
            rewrittenLanguage
        );
      }
      result = rewritten;
    }

    await logTechnicalEvent("llm_response", "info", "Ответ LLM получен", {
      adapter: llm.name,
      model: result.model ?? "unknown",
      language,
    });
    return result.content;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    await logTechnicalEvent("llm_error", "error", "Ошибка запроса к LLM", {
      adapter: llm.name,
      error: errorMessage,
    });
    await logTechnicalEvent("llm_failure", "error", "Все модели в резервной цепочке LLM недоступны", {
      adapter: llm.name,
      error: errorMessage,
    });
    await telegram.sendNotification(
      `Ошибка LLM (${llm.name}): ${errorMessage.slice(0, 240)}`
    );
    throw error;
  }
}

async function handleSendMessage(
  body: {
    token?: string;
    service?: string;
    text?: string;
    greeting?: string;
  }
): Promise<unknown> {
  const text = typeof body.text === "string" ? body.text.trim() : "";
  if (!text) {
    return { error: "Порожнє повідомлення" };
  }
  if (text.length > MAX_MESSAGE_LENGTH) {
    return { error: "Повідомлення занадто довге" };
  }

  const token = typeof body.token === "string" ? body.token : "";

  if (!token) {
    const detectedService = detectServiceFromText(text);
    const service = detectedService ?? normalizeService(body.service);
    const contact = extractContactAnswer(text, "");
    const location = extractExplicitLocation(text);
    const fields: RequestFields = {
      service,
      symptom: extractInitialSymptom(text),
      deviceType: service,
      location: location ?? undefined,
      name: contact.name,
      phone: contact.phone,
      lang: detectMessageLanguage(text) ?? "uk",
      termsAccepted: explicitlyAcceptsTerms(text),
    };
    const request = await createRequest(fields);
    const greeting = typeof body.greeting === "string" ? body.greeting.trim() : "";
    if (greeting && greeting.length <= MAX_MESSAGE_LENGTH) {
      await saveMessage(request.id, "manager", greeting);
    }
    const brandInfo = extractBrandFromText(text);
    if (brandInfo) {
      await updateRequestDeviceDetails(
        request.id,
        service,
        [brandInfo.brand, brandInfo.model].filter(Boolean).join(" ")
      );
    }
    const saved = await saveMessage(request.id, "client", text);
    return { token: request.token, messageId: saved.id };
  }

  const request = await getRequestByToken(token);
  if (!request) {
    return { error: "Заявку не знайдено" };
  }

  const history = await getMessages(request.id, 3);
  const previousManagerMessage = [...history]
    .reverse()
    .find((message) => message.sender === "manager")?.text ?? "";
  const saved = await saveMessage(request.id, "client", text);

  const details = await getRequestDetails(token);
  const contact = extractContactAnswer(text, previousManagerMessage);
  const deviceDetails = extractDeviceDetailsAnswer(text, previousManagerMessage);
  const detectedService = detectServiceFromText(text);
  const location = hasExactAddress(text)
    ? combineLocationWithAddress(details?.location, text)
    : extractExplicitLocation(text) ?? getLocationAnswer([
        ...history,
        { sender: "client" as const, text },
      ]);
  if (details && (contact.phone || contact.name)) {
    await updateClientContact(details.clientId, contact.name, contact.phone);
  }
  if (detectedService && detectedService !== details?.service) {
    await updateRequestService(request.id, detectedService);
  }
  if (location && location !== details?.location) {
    await updateRequestLocation(request.id, location);
  }
  if (details && isSymptomAnswerExpected(previousManagerMessage)) {
    const symptom = mergeRequestSymptom(details.symptom, text);
    if (symptom !== details.symptom) {
      await updateRequestSymptom(request.id, symptom);
    }
  }
  if (deviceDetails) {
    await updateRequestDeviceDetails(
      request.id,
      detectedService ?? details?.service ?? "other",
      deviceDetails
    );
  }

  if (details?.status === "waiting_for_manager") {
    const relayed = await relayClientMessageToTelegram(
      request.id,
      details.number,
      text
    );
    if (relayed) {
      await sendUnsentAttachmentsToTelegram(
        request.id,
        details.number,
        relayed,
        saved.id
      );
    }
  }

  return { messageId: saved.id };
}

async function handleAgentReply(body: {
  token?: string;
  text?: string;
  service?: string;
  attachmentCount?: number;
}): Promise<unknown> {
  const token = typeof body.token === "string" ? body.token : "";
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const service = typeof body.service === "string" ? body.service : "";
  const attachmentCount = Number.isInteger(body.attachmentCount)
    ? Math.max(0, Math.min(3, Number(body.attachmentCount)))
    : 0;
  if (!token || !text) {
    return { error: "Не вистачає даних" };
  }

  const request = await getRequestByToken(token);
  if (!request) {
    return { error: "Заявку не знайдено" };
  }

  const history = await getMessages(request.id, LLM_HISTORY_LIMIT);
  const language = detectConversationLanguage(history);
  const details = await getRequestDetails(token);
  const activeService = normalizeService(details?.service ?? service);
  const termsDecision = getTermsDecision(history);
  const locationAnswered = Boolean(details?.location) || hasLocationAnswer(history);
  const exactAddressProvided = history.some(
    (message) => message.sender === "client" && hasExactAddress(message.text)
  );
  const requestAlreadyConfirmed = history.some(
    (message) =>
      message.sender === "manager" &&
      /(заявк[ауи]?\s+оформ|звернення\s+оформ)/i.test(message.text)
  );
  const messages: { role: "system" | "user" | "assistant"; content: string }[] = history.map((m) => ({
    role: m.sender === "client" ? "user" : "assistant",
    content: m.text,
  }));
  const clientTurnCount = history.filter((message) => message.sender === "client").length;
  const safetyReply = getImmediateSafetyReply(activeService, text, history, language);
  const visitRequested = requestsTechnicianVisit(text) && hasApplianceContext(activeService, history);

  if (requestsHumanManager(text)) {
    if (details?.status !== "waiting_for_manager") {
      await updateRequestStatus(request.id, "waiting_for_manager", "client");
      await logTechnicalEvent(
        "human_requested",
        "info",
        "Клиент запросил подключение менеджера",
        { requestNumber: details?.number ?? request.id }
      );
      await maybeNotifyTelegram(token, true);
      await telegram.sendNotification(
        `Клиент просит подключить менеджера к заявке ${details?.number ?? request.id}.`
      );
    }

    const reply = language === "ru"
      ? "Хорошо, приглашу коллегу в чат. Ответ может занять немного времени."
      : "Добре, запрошу колегу до чату. Відповідь може зайняти трохи часу.";
    await saveMessage(request.id, "manager", reply);
    return { text: reply, waitingForHuman: true };
  }

  if (details?.status === "waiting_for_manager") {
    return { waitingForHuman: true };
  }

  if (asksIfHumanManager(text)) {
    const reply = language === "ru"
      ? "Я онлайн-помощник RemTech. Могу оформить обращение или пригласить сотрудника в чат."
      : "Я онлайн-помічник RemTech. Можу оформити звернення або запросити співробітника до чату.";
    await saveMessage(request.id, "manager", reply);
    return { text: reply };
  }

  if (clientTurnCount <= 2) {
    messages.unshift({
      role: "system",
      content: language === "ru"
        ? "Текущий разговор только начался. В этом ответе не спрашивай населённый пункт, адрес, имя, телефон, срочность или согласие с оплатой. Сначала ответь на вопрос клиента либо задай один естественный вопрос о самой технике или услуге, который покажет внимание к ситуации. Если жалоба уже понятна и это уместно, спроси, есть ли у клиента фото техники или дисплея с ошибкой — фото можно прикрепить прямо в этот чат."
        : "Поточна розмова лише почалася. У цій відповіді не питай населений пункт, адресу, ім’я, телефон, терміновість або згоду з оплатою. Спочатку дай відповідь на питання клієнта або постав одне природне питання про саму техніку чи послугу, яке покаже увагу до ситуації. Якщо скарга вже зрозуміла і це доречно, запитай, чи є у клієнта фото техніки або дисплея з помилкою — фото можна прикріпити просто в цей чат.",
    });
  }

  if (activeService) {
    const context = serviceToContext[activeService]?.[language];
    if (context) {
      messages.unshift({ role: "system" as const, content: context });
    }
  }

  if (attachmentCount > 0) {
    messages.push({
      role: "system",
      content: language === "ru"
        ? "Клиент прикрепил фотографии к последнему сообщению. Файлы сохранены для мастера. Не утверждай, что рассмотрел детали на фото."
        : "Клієнт прикріпив фотографії до останнього повідомлення. Файли збережено для майстра. Не стверджуй, що роздивився деталі на фото.",
    });
  }

  let reply: string;
  if (safetyReply) {
    reply = safetyReply;
  } else if (asksAboutPrice(text)) {
    reply = getPriceReply(
      text,
      activeService,
      history,
      language,
      !details?.termsAccepted
    );
  } else if (visitRequested && !locationAnswered) {
    reply = language === "ru"
      ? "Хорошо. В каком вы населённом пункте?"
      : "Добре. У якому ви населеному пункті?";
  } else if (!locationAnswered && isAwaitingLocation(history)) {
    reply = language === "ru"
      ? "Хорошо. Теперь напишите, в каком вы населённом пункте."
      : "Добре. Тепер напишіть, у якому ви населеному пункті.";
  } else if (locationAnswered && !details?.termsAccepted && termsDecision === "not-asked") {
    reply = language === "ru"
      ? "Сразу уточню условия: выезд и диагностика оплачиваются отдельно. Стоимость ремонта мастер назовёт после осмотра и согласует с вами до начала работ. Такой формат вам подходит?"
      : "Одразу уточню умови: виїзд і діагностика оплачуються окремо. Вартість ремонту майстер назве після огляду та погодить з вами до початку робіт. Такий формат вам підходить?";
  } else if (
    locationAnswered &&
    !details?.termsAccepted &&
    termsDecision === "unclear" &&
    expressesUrgency(text)
  ) {
    reply = language === "ru"
      ? "Понимаю, что срочно. Перед выездом нужно подтвердить: выезд и диагностика оплачиваются отдельно. Вам подходят эти условия?"
      : "Розумію, що терміново. Перед виїздом потрібно підтвердити: виїзд і діагностика оплачуються окремо. Вам підходять ці умови?";
  } else if (
    locationAnswered &&
    !details?.termsAccepted &&
    termsDecision === "unclear" &&
    expressesCostConcern(text)
  ) {
    reply = language === "ru"
      ? "Понимаю ваше сомнение. Ремонт без вашего согласия не начнём: мастер сначала назовёт стоимость, и вы решите, продолжать ли. Отдельно оплачиваются только заранее согласованные выезд и диагностика; их стоимость можно уточнить до оформления выезда."
      : "Розумію ваші сумніви. Ремонт без вашої згоди не почнемо: майстер спочатку назве вартість, і ви вирішите, чи продовжувати. Окремо оплачуються лише заздалегідь погоджені виїзд і діагностика; їхню вартість можна уточнити до оформлення виїзду.";
  } else if (locationAnswered && !details?.termsAccepted && termsDecision === "unclear") {
    reply = language === "ru"
      ? "Вам подходят эти условия: выезд и диагностика оплачиваются отдельно?"
      : "Вам підходять ці умови: виїзд і діагностика оплачуються окремо?";
  } else if (locationAnswered && !details?.termsAccepted && termsDecision === "declined") {
    reply = language === "ru"
      ? "Понял. Тогда выезд пока не оформляем. Если решите продолжить, напишите нам."
      : "Зрозумів. Тоді виїзд поки не оформлюємо. Якщо вирішите продовжити, напишіть нам.";
  } else if (locationAnswered && !details?.termsAccepted && termsDecision === "accepted") {
    await updateRequestTermsAccepted(request.id, true);
    if (shouldAskExactAddress(history)) {
      reply = language === "ru"
        ? "Хорошо. Тогда напишите улицу и номер дома."
        : "Добре. Тоді напишіть вулицю та номер будинку.";
    } else if (!details?.name || !details?.phone) {
      reply = getMissingContactQuestion(details?.name, details?.phone, language);
    } else {
      reply = language === "ru"
        ? "Спасибо, договорились. Заявка оформлена. Мастер свяжется с вами в ближайшее время, чтобы согласовать время выезда."
        : "Дякую, домовилися. Заявку оформлено. Майстер зв’яжеться з вами найближчим часом, щоб узгодити час виїзду.";
    }
  } else if (details?.termsAccepted && shouldAskExactAddress(history)) {
    reply = language === "ru"
      ? "Напишите улицу и номер дома."
      : "Напишіть вулицю та номер будинку.";
  } else if (
    details?.termsAccepted &&
    exactAddressProvided &&
    !details.phone &&
    hasInvalidPhoneCandidate(text)
  ) {
    reply = language === "ru"
      ? "Похоже, в номере не хватает цифр. Проверьте и отправьте его ещё раз, например: 050 123 45 67."
      : "Схоже, у номері не вистачає цифр. Перевірте й надішліть його ще раз, наприклад: 050 123 45 67.";
  } else if (
    details?.termsAccepted &&
    exactAddressProvided &&
    (!details.name || !details.phone)
  ) {
    reply = getMissingContactQuestion(details.name, details.phone, language);
  } else if (
    details?.termsAccepted &&
    exactAddressProvided &&
    details.name &&
    details.phone &&
    !requestAlreadyConfirmed
  ) {
    reply = language === "ru"
      ? "Спасибо, заявка оформлена. Мастер свяжется с вами в ближайшее время, чтобы согласовать время выезда."
      : "Дякую, заявку оформлено. Майстер зв’яжеться з вами найближчим часом, щоб узгодити час виїзду.";
  } else {
    try {
      reply = await chatWithLlm(messages, language);
      if (clientTurnCount <= 2 && INTAKE_QUESTION_PATTERN.test(reply)) {
        reply = getEarlyServiceFollowUp(activeService, language, history);
      } else if (CLIENT_QUESTION_PATTERN.test(text)) {
        const directAnswer = removeIntakeQuestions(reply);
        if (directAnswer) reply = directAnswer;
      }
    } catch {
      reply = language === "ru"
        ? "Спасибо, сообщение получили. Менеджер ответит немного позже."
        : "Дякуємо, повідомлення отримано. Менеджер відповість трохи пізніше.";
    }
  }

  reply = normalizeManagerReply(reply);
  await saveMessage(request.id, "manager", reply);

  await maybeNotifyTelegram(token);

  return { text: reply };
}

async function maybeNotifyTelegram(token: string, force = false): Promise<void> {
  const details = await getRequestDetails(token);
  if (!details) return;

  const hasContact = Boolean(details.phone && details.name);
  const isComplete = hasContact && details.termsAccepted;
  if (!force && !isComplete) return;

  const telegramRequest = {
    number: details.number,
    createdAt: details.createdAt,
    service: normalizeService(details.service),
    device: details.service,
    deviceDetails: details.deviceDetails ?? "",
    symptom: details.symptom ?? "",
    location: details.location ?? "",
    urgency: details.urgency ?? "",
    name: details.name ?? "",
    phone: details.phone ?? "",
    lang: details.lang,
    attachmentCount: details.attachmentCount,
    termsAccepted: details.termsAccepted,
    managerRequested: force,
  };
  const card = await getTelegramCard(details.id);

  if (card?.state === "final") return;
  if (force && card?.messageId) return;

  if (card?.chatId && card.messageId && isComplete) {
    try {
      await telegram.updateRequestCard(
        { ...telegramRequest, managerRequested: false },
        card.chatId,
        card.messageId
      );
      await markTelegramCardFinal(details.id);
      await markRequestTelegramNotified(details.id, true);
      await sendUnsentAttachmentsToTelegram(
        details.id,
        details.number,
        { chatId: card.chatId, messageId: card.messageId, threadId: card.threadId ?? undefined }
      );
      return;
    } catch (error) {
      await recordTelegramCardError(details.id, String(error));
      await logTechnicalEvent(
        "telegram_card_update_failed",
        "error",
        "Не удалось обновить карточку заявки в Telegram",
        { requestNumber: details.number, error: String(error) }
      );
      throw error;
    }
  }

  try {
    const sent = await telegram.sendRequest(telegramRequest);
    if (sent) {
      await saveTelegramCard(
        details.id,
        sent.chatId,
        sent.messageId,
        sent.threadId,
        force ? "preliminary" : "final"
      );
      if (sent.warning) {
        await logTechnicalEvent(
          "telegram_request_topic_failed",
          "warning",
          "Карточка отправлена в общую тему: отдельную тему создать не удалось",
          { requestNumber: details.number, error: sent.warning }
        );
        try {
          await telegram.sendNotification(
            `Заявка ${details.number} отправлена в общую тему. ${sent.warning}`
          );
        } catch (notificationError) {
          await logTechnicalEvent(
            "telegram_topic_warning_failed",
            "error",
            "Не удалось отправить техническое уведомление об ошибке темы",
            { requestNumber: details.number, error: String(notificationError) }
          );
        }
      }
      await sendUnsentAttachmentsToTelegram(details.id, details.number, sent);
    }
    await markRequestTelegramNotified(details.id, !force && isComplete);
  } catch (error) {
    await recordTelegramCardError(details.id, String(error));
    await logTechnicalEvent(
      "telegram_card_send_failed",
      "error",
      "Не удалось отправить карточку заявки в Telegram",
      { requestNumber: details.number, error: String(error) }
    );
    throw error;
  }
}

async function relayClientMessageToTelegram(
  requestId: string,
  requestNumber: string,
  text: string
): Promise<import("./telegram/adapter.js").TelegramMessageReference | null> {
  try {
    const anchor = await getLatestTelegramMessageLink(requestId);
    if (!anchor) {
      await logTechnicalEvent(
        "telegram_reply_link_missing",
        "warning",
        "Не найдена карточка Telegram для сообщения клиента",
        { requestNumber }
      );
      return null;
    }

    const sent = await telegram.sendClientMessage(
      requestNumber,
      text,
      anchor
    );
    if (sent) {
      await saveTelegramMessageLink(
        requestId,
        sent.chatId,
        sent.messageId,
        "client"
      );
    }
    return sent ?? null;
  } catch (error) {
    await logTechnicalEvent(
      "telegram_client_relay_failed",
      "error",
      "Не удалось передать сообщение клиента в Telegram",
      { requestNumber, error: String(error) }
    );
    return null;
  }
}

async function sendUnsentAttachmentsToTelegram(
  requestId: string,
  requestNumber: string,
  target: import("./telegram/adapter.js").TelegramMessageReference,
  messageId?: string
): Promise<void> {
  const attachments = await getUnsentAttachments(requestId, messageId);
  if (!attachments.length) return;

  const photos: Array<{
    attachmentId: string;
    data: Buffer;
    mimeType: string;
    fileName: string;
  }> = [];
  for (const attachment of attachments) {
    try {
      const data = await attachmentStorage.read(attachment.filePath);
      photos.push({
        attachmentId: attachment.id,
        data,
        mimeType: attachment.mimeType,
        fileName: basename(attachment.filePath),
      });
    } catch (error) {
      await logTechnicalEvent(
        "telegram_photo_read_failed",
        "warning",
        "Не удалось прочитать фото клиента для отправки в Telegram",
        { requestNumber, filePath: attachment.filePath, error: String(error) }
      );
    }
  }
  if (!photos.length) return;

  let references: Array<import("./telegram/adapter.js").TelegramMessageReference | null>;
  try {
    references = await telegram.sendClientPhotos(
      requestNumber,
      photos.map((photo) => ({
        data: photo.data,
        mimeType: photo.mimeType,
        fileName: photo.fileName,
      })),
      target
    );
  } catch (error) {
    await logTechnicalEvent(
      "telegram_photo_send_failed",
      "error",
      "Не удалось отправить фото клиента в Telegram",
      { requestNumber, error: String(error) }
    );
    return;
  }

  for (const [index, photo] of photos.entries()) {
    const reference = references[index];
    if (!reference) continue;
    try {
      await markAttachmentSent(
        photo.attachmentId,
        reference.chatId,
        reference.messageId
      );
      await saveTelegramMessageLink(
        requestId,
        reference.chatId,
        reference.messageId,
        "client"
      );
    } catch (error) {
      await logTechnicalEvent(
        "telegram_photo_link_failed",
        "warning",
        "Не удалось записать факт отправки фото клиента",
        { requestNumber, error: String(error) }
      );
    }
  }
}

async function handleTelegramManagerReply(
  reply: import("./telegram/adapter.js").TelegramManagerReply
): Promise<void> {
  const request = await getRequestByTelegramReply(
    reply.chatId,
    reply.replyToMessageId
  );
  if (!request) return;

  if (/^\/llm(?:@\w+)?$/i.test(reply.text)) {
    const wasWaitingForManager = request.status === "waiting_for_manager";
    if (wasWaitingForManager) {
      await updateRequestStatus(
        request.id,
        "llm_active",
        `telegram:${reply.managerName}`
      );
      await logTechnicalEvent(
        "llm_resumed_by_manager",
        "info",
        "Менеджер вернул LLM в диалог",
        { requestNumber: request.number, manager: reply.managerName }
      );
    }

    await saveTelegramMessageLink(
      request.id,
      reply.chatId,
      reply.messageId,
      "manager"
    );
    const confirmation = await telegram.sendManagerNotice(
      wasWaitingForManager
        ? `LLM снова отвечает клиенту по заявке ${request.number}.`
        : `LLM уже активна в заявке ${request.number}.`,
      reply
    );
    if (confirmation) {
      await saveTelegramMessageLink(
        request.id,
        confirmation.chatId,
        confirmation.messageId,
        "request"
      );
    }
    return;
  }

  const saved = await saveTelegramManagerReply(
    request.id,
    reply.chatId,
    reply.messageId,
    reply.text,
    reply.managerName
  );
  if (!saved) return;

  await logTechnicalEvent(
    "telegram_manager_reply",
    "info",
    "Ответ менеджера из Telegram передан в чат клиента",
    {
      requestNumber: request.number,
      manager: reply.managerName,
      messageId: reply.messageId,
    }
  );
}

const serviceToContext: Record<string, Record<ChatLanguage, string>> = {
  "boiler-repair": {
    uk: "Контекст звернення: клієнт звернувся за ремонтом газового котла. Не надавай інструкцій щодо самостійного втручання в газове обладнання.",
    ru: "Контекст обращения: клиент обратился по поводу ремонта газового котла. Не давай инструкций по самостоятельному вмешательству в газовое оборудование.",
  },
  "boiler-cleaning": {
    uk: "Контекст звернення: клієнт звернувся за чисткою або обслуговуванням газового котла.",
    ru: "Контекст обращения: клиенту нужна чистка или обслуживание газового котла.",
  },
  "boiler-installation": {
    uk: "Контекст звернення: клієнт звернувся за встановленням або заміною газового котла.",
    ru: "Контекст обращения: клиенту нужна установка или замена газового котла.",
  },
  washer: {
    uk: "Контекст звернення: клієнт звернувся за ремонтом пральної машини.",
    ru: "Контекст обращения: клиент обратился по поводу ремонта стиральной машины.",
  },
  dishwasher: {
    uk: "Контекст звернення: клієнт звернувся за ремонтом посудомийної машини.",
    ru: "Контекст обращения: клиент обратился по поводу ремонта посудомоечной машины.",
  },
  other: {
    uk: "Контекст звернення: клієнт звернувся щодо іншої побутової техніки.",
    ru: "Контекст обращения: клиент обратился по поводу другой бытовой техники.",
  },
};

const INTAKE_QUESTION_PATTERN =
  /(населен(?:ий|ный)\s+пункт|де\s+ви\s+знаходитеся|где\s+вы\s+находитесь|точн(?:а|у|ый)\s+адрес|вулиц(?:я|ю)|улиц(?:а|у)|номер\s+(?:будинку|дома)|ім['’]?я|имя|номер\s+телефону|номер\s+телефона|терміновість|срочность)/i;
const CLIENT_QUESTION_PATTERN =
  /\?|^(?:а\s+)?(?:що|чому|навіщо|як|чи|можна|что|почему|зачем|как|можно)\b/i;
const SAFETY_ADVICE_PATTERN =
  /(?:не\s+(?:вмикайте|включайте|користуйтеся|пользуйтесь)|(?:відключіть|отключите).*(?:розет|живлен|питан))/iu;

function getImmediateSafetyReply(
  service: string,
  text: string,
  history: { sender: "client" | "manager"; text: string }[],
  language: ChatLanguage
): string | null {
  if (!describesImmediateElectricalHazard(text)) return null;

  const safetyAdviceAlreadyGiven = history.some(
    (message) => message.sender === "manager" && SAFETY_ADVICE_PATTERN.test(message.text)
  );
  if (safetyAdviceAlreadyGiven) return null;

  const device = getSafetyDeviceName(service, text, language);
  return language === "ru"
    ? `Не включайте ${device}. Если это можно сделать безопасно, отключите питание. Дым сейчас ещё идёт?`
    : `Не вмикайте ${device}. Якщо це можна зробити безпечно, відключіть живлення. Дим зараз ще йде?`;
}

function getSafetyDeviceName(service: string, text: string, language: ChatLanguage): string {
  const combined = `${service} ${text}`;
  if (/(dishwasher|посудом|посудомий)/i.test(combined)) {
    return language === "ru" ? "посудомойку" : "посудомийну машину";
  }
  if (/(washer|стирал|прал)/i.test(combined)) {
    return language === "ru" ? "стиральную машину" : "пральну машину";
  }
  if (/(boiler|кот[её]л|котел)/i.test(combined)) {
    return language === "ru" ? "котёл" : "котел";
  }
  return language === "ru" ? "технику" : "техніку";
}

function getMissingContactQuestion(
  name: string | null | undefined,
  phone: string | null | undefined,
  language: ChatLanguage
): string {
  if (name && !phone) {
    return language === "ru"
      ? "Оставьте номер телефона для связи."
      : "Залиште номер телефону для зв’язку.";
  }
  if (!name && phone) {
    return language === "ru"
      ? "Как к вам обращаться?"
      : "Як до вас звертатися?";
  }
  return language === "ru"
    ? "Как к вам обращаться? И оставьте, пожалуйста, номер телефона для связи."
    : "Як до вас звертатися? І залиште, будь ласка, номер телефону для зв’язку.";
}

function getDiagnosticPriceReply(
  service: string,
  language: ChatLanguage,
  askForAcceptance: boolean
): string {
  const diagnostics = getDiagnosticPrice(service);
  const visit = getPriceItem("visit-brovary");
  const acceptance = askForAcceptance
    ? language === "ru" ? " Такой формат вам подходит?" : " Такий формат вам підходить?"
    : "";
  if (!diagnostics) {
    return language === "ru"
      ? `Для этой техники стоимость диагностики уточняется индивидуально. Выезд в Броварах — ${formatPrice(visit.value, "ru")}, для других населённых пунктов стоимость согласуем заранее.${acceptance}`
      : `Для цієї техніки вартість діагностики уточнюється індивідуально. Виїзд у Броварах — ${formatPrice(visit.value, "uk")}, для інших населених пунктів вартість погодимо заздалегідь.${acceptance}`;
  }

  return language === "ru"
    ? `${diagnostics.label.ru} — ${formatPrice(diagnostics.value, "ru")}. Выезд оплачивается отдельно: в Броварах — ${formatPrice(visit.value, "ru")}, для других населённых пунктов стоимость согласуем заранее.${acceptance}`
    : `${diagnostics.label.uk} — ${formatPrice(diagnostics.value, "uk")}. Виїзд оплачується окремо: у Броварах — ${formatPrice(visit.value, "uk")}, для інших населених пунктів вартість погодимо заздалегідь.${acceptance}`;
}

type PriceTopic = "diagnostics" | "visit" | "repair" | "general";

function getPriceReply(
  text: string,
  service: string,
  history: { sender: "client" | "manager"; text: string }[],
  language: ChatLanguage,
  askForAcceptance: boolean
): string {
  const directTopic = detectPriceTopic(text);
  const topic = directTopic ?? getPreviousPriceTopic(history) ?? "general";
  const pricingService = inferPricingService(service, history);
  if (topic === "diagnostics") {
    if (!directTopic && !getDiagnosticPrice(pricingService)) {
      const acceptance = askForAcceptance
        ? language === "ru" ? " Такой формат вам подходит?" : " Такий формат вам підходить?"
        : "";
      return language === "ru"
        ? `Точного диапазона для диагностики этой техники пока нет. Сумму обязательно согласуем до выезда.${acceptance}`
        : `Точного діапазону для діагностики цієї техніки поки немає. Суму обов’язково погодимо до виїзду.${acceptance}`;
    }
    return getDiagnosticPriceReply(pricingService, language, askForAcceptance);
  }

  const visit = getPriceItem("visit-brovary");
  const acceptance = askForAcceptance
    ? language === "ru" ? " Такой формат вам подходит?" : " Такий формат вам підходить?"
    : "";
  if (topic === "visit") {
    return language === "ru"
      ? `Выезд в Броварах — ${formatPrice(visit.value, "ru")}. Для других населённых пунктов стоимость согласуем заранее.${acceptance}`
      : `Виїзд у Броварах — ${formatPrice(visit.value, "uk")}. Для інших населених пунктів вартість погодимо заздалегідь.${acceptance}`;
  }
  if (topic === "repair") {
    return language === "ru"
      ? `Стоимость ремонта мастер назовёт после осмотра и согласует с вами до начала работ. Выезд и диагностика оплачиваются отдельно.${acceptance}`
      : `Вартість ремонту майстер назве після огляду та погодить з вами до початку робіт. Виїзд і діагностика оплачуються окремо.${acceptance}`;
  }

  return getDiagnosticPriceReply(pricingService, language, askForAcceptance);
}

function detectPriceTopic(text: string): PriceTopic | null {
  if (/(діагност|диагност)/i.test(text)) return "diagnostics";
  if (/(виїзд|выезд|приїзд|приезд)/i.test(text)) return "visit";
  if (/(ремонт|почин|работ|робіт|запчаст)/i.test(text)) return "repair";
  return null;
}

function getPreviousPriceTopic(
  history: { sender: "client" | "manager"; text: string }[]
): PriceTopic | null {
  for (let index = history.length - 2; index >= 0; index -= 1) {
    const message = history[index];
    if (message.sender !== "client" || !asksAboutPrice(message.text)) continue;
    return detectPriceTopic(message.text);
  }
  return null;
}

function inferPricingService(
  service: string,
  history: { sender: "client" | "manager"; text: string }[]
): string {
  if (service && service !== "other") return service;

  const conversation = history.map((message) => message.text).join(" ");
  const detectedService = detectServiceFromText(conversation);
  if (detectedService) return detectedService;
  if (/(стирал|прал|washer)/i.test(conversation)) return "washer";
  if (/(посудом|посудомий|dishwasher)/i.test(conversation)) return "dishwasher";
  return service || "other";
}

function hasApplianceContext(
  service: string,
  history: { sender: "client" | "manager"; text: string }[]
): boolean {
  if (service && service !== "other") return true;

  const clientText = history
    .filter((message) => message.sender === "client")
    .map((message) => message.text)
    .join(" ");
  return Boolean(detectServiceFromText(clientText)) || /(машинк|техник)/i.test(clientText);
}

function getEarlyServiceFollowUp(
  service: string,
  language: ChatLanguage,
  history: { sender: "client" | "manager"; text: string }[]
): string {
  const managerText = history
    .filter((message) => message.sender === "manager")
    .map((message) => message.text)
    .join(" ");
  const brandAlreadyAsked = /(марк|модел)/i.test(managerText);
  const maintenanceAlreadyAsked = /(востаннє.*обслугов|коли.*обслугов|последн.*обслуж)/i.test(managerText);
  const photoAlreadyAsked = /(фото|фотограф)/i.test(managerText);

  if (service === "boiler-cleaning" && !maintenanceAlreadyAsked) {
    return language === "ru"
      ? "Когда котёл обслуживали в последний раз?"
      : "Коли котел востаннє обслуговували?";
  }
  if (!brandAlreadyAsked && service !== "other") {
    return language === "ru"
      ? "Какая марка и модель техники, если знаете?"
      : "Яка марка й модель техніки, якщо знаєте?";
  }
  if (service === "boiler-installation") {
    return language === "ru"
      ? "Это новая установка или нужно заменить старый котёл?"
      : "Це нове встановлення чи потрібно замінити старий котел?";
  }
  if (!photoAlreadyAsked) {
    return language === "ru"
      ? "Есть возможность прикрепить фото техники или дисплея с ошибкой? Фото можно отправить прямо в этот чат."
      : "Чи є можливість прикріпити фото техніки чи дисплея з помилкою? Фото можна надіслати просто в цей чат.";
  }
  return language === "ru"
    ? "Что ещё заметили в работе техники?"
    : "Що ще помітили в роботі техніки?";
}

function removeIntakeQuestions(reply: string): string {
  const sentences = reply.match(/[^.!?]+[.!?]?/g) ?? [reply];
  return sentences
    .filter((sentence) => !INTAKE_QUESTION_PATTERN.test(sentence))
    .join(" ")
    .trim();
}

async function handleAttachmentUpload(
  request: import("node:http").IncomingMessage,
  url: URL
): Promise<unknown> {
  const token = url.searchParams.get("token") ?? "";
  const messageId = url.searchParams.get("messageId") ?? "";
  if (!token || !messageId) {
    throw new HttpError(400, "Не вистачає даних для завантаження");
  }

  const requestRecord = await getRequestByToken(token);
  if (!requestRecord) throw new HttpError(404, "Заявку не знайдено");

  const contentTypeHeader = request.headers["content-type"];
  const mimeType = (Array.isArray(contentTypeHeader)
    ? contentTypeHeader[0]
    : contentTypeHeader ?? "")
    .split(";")[0]
    .trim()
    .toLowerCase();
  if (!ALLOWED_ATTACHMENT_TYPES.has(mimeType)) {
    throw new HttpError(415, "Підтримуються лише фотографії JPEG, PNG, WebP, HEIC та HEIF");
  }

  const declaredSize = Number(request.headers["content-length"] ?? 0);
  if (declaredSize > MAX_ATTACHMENT_SIZE) {
    throw new HttpError(413, "Файл завеликий");
  }

  const content = await readBinaryBody(request, MAX_ATTACHMENT_SIZE);
  if (content.length === 0) throw new HttpError(400, "Порожній файл");

  const filePath = await attachmentStorage.save(requestRecord.id, mimeType, content);
  let attachment: { id: string };
  try {
    attachment = await saveAttachment(
      requestRecord.id,
      messageId,
      filePath,
      mimeType,
      content.length
    );
  } catch (error) {
    await attachmentStorage.remove(filePath);
    if (error instanceof Error && error.message.includes("Attachment limit")) {
      throw new HttpError(400, "До одного повідомлення можна додати не більше трьох фото");
    }
    throw error;
  }

  // В ручном режиме фото приходят после пересылки текста сообщения,
  // поэтому каждое загруженное фото уходит в тему сразу само
  const details = await getRequestDetails(token);
  if (details?.status === "waiting_for_manager") {
    const anchor = await getLatestTelegramMessageLink(details.id);
    if (anchor) {
      await sendUnsentAttachmentsToTelegram(
        details.id,
        details.number,
        anchor,
        messageId
      );
    }
  }

  return {
    attachment: {
      id: attachment.id,
      mimeType,
      url:
        "/api/attachments/" +
        attachment.id +
        "?token=" +
        encodeURIComponent(token),
    },
  };
}

async function handleAttachmentDownload(
  response: import("node:http").ServerResponse,
  url: URL
): Promise<void> {
  const match = url.pathname.match(/^\/api\/attachments\/(\d+)$/);
  const token = url.searchParams.get("token") ?? "";
  if (!match || !token) throw new HttpError(400, "Некоректне посилання");

  const attachment = await getAttachmentByToken(match[1], token);
  if (!attachment) throw new HttpError(404, "Файл не знайдено");

  const content = await attachmentStorage.read(attachment.filePath);
  response.writeHead(200, {
    "Content-Type": attachment.mimeType,
    "Content-Length": String(content.length),
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(content);
}

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host ?? "localhost"}`);

  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  try {
    if (request.method === "POST" && url.pathname === "/api/attachments") {
      const result = await handleAttachmentUpload(request, url);
      sendJson(response, 201, result);
      return;
    }

    if (request.method === "GET" && /^\/api\/attachments\/\d+$/.test(url.pathname)) {
      await handleAttachmentDownload(response, url);
      return;
    }

    if (request.method === "POST" && (url.pathname === "/api/chat" || url.pathname === "/api/chat/")) {
      const body = (await readJsonBody(request)) as {
        token?: string;
        service?: string;
        text?: string;
        greeting?: string;
      };
      const result = await handleSendMessage(body);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/agent-reply") {
      const body = (await readJsonBody(request)) as {
        token?: string;
        text?: string;
        service?: string;
        attachmentCount?: number;
      };
      const result = await handleAgentReply(body);
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/messages") {
      const token = url.searchParams.get("token") ?? "";
      const after = url.searchParams.get("after") ?? "0";
      if (!token || !/^\d+$/.test(after)) {
        throw new HttpError(400, "Некорректные параметры запроса сообщений");
      }
      const messages = await getManagerMessagesAfterToken(token, after);
      sendJson(response, 200, { messages });
      return;
    }

    if (request.method === "GET" && url.pathname === "/health") {
      sendJson(response, 200, { ok: true, llm: llm.name, telegram: telegram.name });
      return;
    }

    sendJson(response, 404, { error: "Не знайдено" });
  } catch (error) {
    if (error instanceof HttpError) {
      sendJson(response, error.statusCode, { error: error.message });
      return;
    }
    await logTechnicalEvent("server_error", "error", "Ошибка сервера", {
      error: String(error),
    });
    sendJson(response, 500, { error: "Помилка сервера" });
  }
});

await ensureTelegramReplySchema();

let lastTelegramPollingErrorAt = 0;
const stopTelegramPolling = telegram.startManagerReplyPolling(
  handleTelegramManagerReply,
  async (error) => {
    const now = Date.now();
    if (now - lastTelegramPollingErrorAt < 60_000) return;
    lastTelegramPollingErrorAt = now;
    await logTechnicalEvent(
      "telegram_polling_error",
      "error",
      "Ошибка получения ответов менеджера из Telegram",
      { error: String(error) }
    );
  }
);

server.listen(PORT, () => {
  console.log(`Чат-сервер запущен: http://localhost:${PORT}`);
  console.log(`Адаптер LLM: ${llm.name}, адаптер Telegram: ${telegram.name}`);
});

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => {
    stopTelegramPolling();
    server.close(() => process.exit(0));
  });
}
