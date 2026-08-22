"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  sender: "client" | "manager" | "system";
  text: string;
  attachments?: ChatAttachment[];
};

type ChatAttachment = {
  id: string;
  url: string;
  mimeType: string;
};

type PendingPhoto = ChatAttachment & {
  file: File;
};

type ChatState = "idle" | "connecting" | "online" | "completed";

const CHAT_SERVER_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

const BASE_TYPING_DELAY_MS = 650;
const PER_WORD_DELAY_MS = 120;
const MIN_TYPING_DELAY_MS = 1200;
const MAX_TYPING_DELAY_MS = 3800;
const MIN_THINKING_DELAY_MS = 800;
const MAX_THINKING_DELAY_MS = 1500;
const INITIAL_CONNECT_DELAY_MS = 2500;
const INITIAL_TYPING_DELAY_MS = 1600;
const MAX_PHOTOS_PER_MESSAGE = 3;
const MAX_PHOTO_SIZE = 10 * 1024 * 1024;
const ACCEPTED_PHOTO_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

const SERVICE_QUESTIONS: Record<string, string> = {
  "boiler-repair": "Вітаю! Розкажіть, будь ласка, що сталося з котлом?",
  "boiler-cleaning":
    "Вітаю! Підкажіть, будь ласка, коли востаннє проводили обслуговування котла?",
  "boiler-installation":
    "Вітаю! Котел потрібно встановити вперше чи замінити наявний?",
  washer: "Вітаю! Підкажіть, будь ласка, що сталося з пральною машиною?",
  dishwasher:
    "Вітаю! Підкажіть, будь ласка, що сталося з посудомийною машиною?",
  other: "Вітаю! Підкажіть, будь ласка, яка техніка потребує ремонту і що з нею сталося?",
};

const INITIAL_ASK_SERVICE =
  "Вітаю! Підкажіть, будь ласка, яка техніка потребує ремонту?";

const RU_SERVICE_QUESTIONS: Record<string, string> = {
  "boiler-repair": "Здравствуйте! Расскажите, пожалуйста, что случилось с котлом?",
  "boiler-cleaning":
    "Здравствуйте! Подскажите, пожалуйста, когда в последний раз проводили обслуживание котла?",
  "boiler-installation":
    "Здравствуйте! Котел нужно установить впервые или заменить имеющийся?",
  washer: "Здравствуйте! Подскажите, пожалуйста, что случилось со стиральной машиной?",
  dishwasher:
    "Здравствуйте! Подскажите, пожалуйста, что случилось с посудомоечной машиной?",
  other: "Здравствуйте! Подскажите, пожалуйста, какая техника нуждается в ремонте и что с ней случилось?",
};

const RU_INITIAL_ASK_SERVICE =
  "Здравствуйте! Подскажите, пожалуйста, какая техника нуждается в ремонте?";

type ChatLang = "uk" | "ru";

const CHAT_TEXTS = {
  uk: {
    openChatAria: "Відкрити чат з менеджером",
    title: "Менеджер RemTech",
    connecting: "підключення...",
    online: "онлайн",
    statusCompleted: "заявку оформлено",
    managerLeft: "Менеджер покинув чат",
    connectionMessage: "З’єднуємо з менеджером RemTech...",
    typingAria: "Менеджер друкує",
    placeholder: "Напишіть повідомлення...",
    messageLabel: "Повідомлення",
    sendAria: "Надіслати",
    sendTitle: "Надіслати",
    closeAria: "Згорнути чат",
    closeTitle: "Згорнути",
    addPhotoAria: "Додати фото",
    addPhotoTitle: "Додати фото",
    removePhotoAria: "Видалити фотографію",
    removePhotoTitle: "Видалити",
    selectedPhotosAria: "Вибрані фотографії",
    selectedPhotoAlt: "Вибране фото",
    clientPhotoAlt: "Фото від клієнта",
    openPhotoAria: "Відкрити фотографію",
    typeError: "Підтримуються фото JPEG, PNG, WebP, HEIC та HEIF.",
    sizeError: "Розмір одного фото не повинен перевищувати 10 МБ.",
    countError: "До одного повідомлення можна додати не більше трьох фото.",
    uploadError: "Не всі фотографії вдалося завантажити. Спробуйте ще раз.",
    fallback: "Дякуємо, повідомлення отримано. Менеджер відповість трохи пізніше.",
    photoSingle: "Клієнт додав фотографію.",
    photoPlural: "Клієнт додав фотографії.",
    serviceQuestions: SERVICE_QUESTIONS,
    initialAskService: INITIAL_ASK_SERVICE,
  },
  ru: {
    openChatAria: "Открыть чат с менеджером",
    title: "Менеджер RemTech",
    connecting: "подключение...",
    online: "онлайн",
    statusCompleted: "заявка оформлена",
    managerLeft: "Менеджер покинул чат",
    connectionMessage: "Соединяемся с менеджером RemTech...",
    typingAria: "Менеджер печатает",
    placeholder: "Напишите сообщение...",
    messageLabel: "Сообщение",
    sendAria: "Отправить",
    sendTitle: "Отправить",
    closeAria: "Свернуть чат",
    closeTitle: "Свернуть",
    addPhotoAria: "Добавить фото",
    addPhotoTitle: "Добавить фото",
    removePhotoAria: "Удалить фотографию",
    removePhotoTitle: "Удалить",
    selectedPhotosAria: "Выбранные фотографии",
    selectedPhotoAlt: "Выбранное фото",
    clientPhotoAlt: "Фото от клиента",
    openPhotoAria: "Открыть фотографию",
    typeError: "Поддерживаются фото JPEG, PNG, WebP, HEIC и HEIF.",
    sizeError: "Размер одного фото не должен превышать 10 МБ.",
    countError: "К одному сообщению можно добавить не более трех фото.",
    uploadError: "Не все фотографии удалось загрузить. Попробуйте еще раз.",
    fallback: "Спасибо, сообщение получили. Менеджер ответит немного позже.",
    photoSingle: "Клиент добавил фотографию.",
    photoPlural: "Клиент добавил фотографии.",
    serviceQuestions: RU_SERVICE_QUESTIONS,
    initialAskService: RU_INITIAL_ASK_SERVICE,
  },
} as const;

function getTypingDelay(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const calculated = BASE_TYPING_DELAY_MS + wordCount * PER_WORD_DELAY_MS;
  return Math.min(MAX_TYPING_DELAY_MS, Math.max(MIN_TYPING_DELAY_MS, calculated));
}

function getThinkingDelay(): number {
  return Math.round(
    MIN_THINKING_DELAY_MS +
      Math.random() * (MAX_THINKING_DELAY_MS - MIN_THINKING_DELAY_MS)
  );
}

function wait(delay: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delay));
}

export default function ChatPanel({
  defaultService = null,
  lang = "uk",
}: {
  defaultService?: string | null;
  lang?: ChatLang;
}) {
  const t = CHAT_TEXTS[lang];
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileModal, setIsMobileModal] = useState(false);
  const [state, setState] = useState<ChatState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(
    defaultService
  );
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [chatToken, setChatToken] = useState<string | null>(null);
  const [lastHumanMessageId, setLastHumanMessageId] = useState("0");
  const bodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const tokenRef = useRef<string | null>(null);
  const lastHumanMessageIdRef = useRef("0");
  const humanPollBusyRef = useRef(false);
  const greetingShownRef = useRef(false);
  const hydratedRef = useRef(false);
  const connectionStartedRef = useRef(false);
  const typingCountRef = useRef(0);
  const initialGreetingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => {
      setIsMobileModal(mq.matches);
      document.body.classList.toggle("chat-open", mq.matches);
    };
    update();
    mq.addEventListener("change", update);
    return () => {
      mq.removeEventListener("change", update);
      document.body.classList.remove("chat-open");
    };
  }, [isOpen]);

  useEffect(() => {
    const body = bodyRef.current;
    if (body) body.scrollTop = body.scrollHeight;
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (hydratedRef.current) return;
    hydratedRef.current = true;
    try {
      const raw = sessionStorage.getItem("remtech-chat-v1");
      if (!raw) return;
      const saved = JSON.parse(raw) as {
        messages?: ChatMessage[];
        token?: string | null;
        selectedService?: string | null;
        lastHumanMessageId?: string;
        chatState?: string;
      };
      if (Array.isArray(saved.messages)) {
        setMessages(saved.messages);
        if (saved.messages.length > 0) {
          greetingShownRef.current = true;
          initialGreetingRef.current =
            saved.messages.find((message) => message.sender === "manager")?.text ?? null;
        }
      }
      if (typeof saved.token === "string" && saved.token) {
        tokenRef.current = saved.token;
        setChatToken(saved.token);
      }
      if (typeof saved.lastHumanMessageId === "string" && /^\d+$/.test(saved.lastHumanMessageId)) {
        lastHumanMessageIdRef.current = saved.lastHumanMessageId;
        setLastHumanMessageId(saved.lastHumanMessageId);
      }
      if (typeof saved.selectedService === "string") {
        setSelectedService(saved.selectedService);
      }
      if (saved.chatState === "completed") {
        setState("completed");
      }
    } catch {
      // ignore corrupted storage
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        "remtech-chat-v1",
        JSON.stringify({
          messages,
          token: tokenRef.current,
          selectedService,
          lastHumanMessageId,
          chatState: state === "completed" ? "completed" : undefined,
        })
      );
    } catch {
      // storage unavailable
    }
  }, [messages, selectedService, lastHumanMessageId, state]);

  useEffect(() => {
    if (!chatToken) return;
    let stopped = false;

    const poll = async () => {
      if (humanPollBusyRef.current || stopped) return;
      humanPollBusyRef.current = true;
      try {
        const response = await fetch(
          `${CHAT_SERVER_URL}/api/messages?token=${encodeURIComponent(chatToken)}&after=${encodeURIComponent(lastHumanMessageIdRef.current)}`,
          { cache: "no-store" }
        );
        if (!response.ok) return;
        const data = (await response.json()) as {
          messages?: Array<{ id: string; sender: "manager"; text: string }>;
        };
        for (const message of data.messages ?? []) {
          if (stopped) return;
          await wait(getThinkingDelay());
          if (stopped) return;
          typingCountRef.current += 1;
          setIsTyping(true);
          try {
            await wait(getTypingDelay(message.text));
            if (stopped) return;
            setMessages((current) => {
              const id = `telegram-${message.id}`;
              if (current.some((item) => item.id === id)) return current;
              return [...current, { id, sender: "manager", text: message.text }];
            });
            lastHumanMessageIdRef.current = message.id;
            setLastHumanMessageId(message.id);
          } finally {
            typingCountRef.current = Math.max(0, typingCountRef.current - 1);
            setIsTyping(typingCountRef.current > 0);
          }
        }
      } catch {
        // Следующая проверка повторит запрос без вмешательства клиента.
      } finally {
        humanPollBusyRef.current = false;
      }
    };

    void poll();
    const interval = window.setInterval(() => void poll(), 2_000);
    return () => {
      stopped = true;
      window.clearInterval(interval);
      humanPollBusyRef.current = false;
    };
  }, [chatToken]);

  const open = useCallback((service?: string | null) => {
    if (service) setSelectedService(service);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const getManagerReply = useCallback(async (
    service: string,
    text: string,
    attachmentCount = 0
  ) => {
    const replyRequest = fetch(`${CHAT_SERVER_URL}/api/agent-reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenRef.current,
        text,
        service,
        attachmentCount,
      }),
    })
      .then(async (response) => {
        const data = (await response.json()) as {
          text?: string;
          waitingForHuman?: boolean;
          requestCompleted?: boolean;
        };
        if (!response.ok) {
          throw new Error("Manager reply unavailable");
        }
        if (data.waitingForHuman && !data.text) {
          return { kind: "waiting" as const };
        }
        if (typeof data.text !== "string" || !data.text) {
          throw new Error("Manager reply unavailable");
        }
        return {
          kind: "reply" as const,
          reply: data.text,
          requestCompleted: data.requestCompleted === true,
        };
      })
      .catch((error: unknown) => ({ kind: "error" as const, error }));

    await wait(getThinkingDelay());
    typingCountRef.current += 1;
    setIsTyping(true);

    try {
      const result = await replyRequest;
      if (result.kind === "waiting") return;
      if (result.kind === "error") throw result.error;
      await wait(getTypingDelay(result.reply));
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), sender: "manager", text: result.reply },
      ]);
      if (result.requestCompleted) {
        setState("completed");
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), sender: "system", text: t.managerLeft },
        ]);
      }
    } catch {
      const fallback =
        t.fallback;
      await wait(getTypingDelay(fallback));
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "manager",
          text: fallback,
        },
      ]);
    } finally {
      typingCountRef.current = Math.max(0, typingCountRef.current - 1);
      setIsTyping(typingCountRef.current > 0);
    }
  }, []);

  const selectPhotos = useCallback((files: FileList | null) => {
    if (!files?.length) return;
    const selectedFiles = Array.from(files);
    setUploadError("");
    setPendingPhotos((current) => {
      const available = MAX_PHOTOS_PER_MESSAGE - current.length;
      const selected = selectedFiles.slice(0, Math.max(0, available));
      const valid: PendingPhoto[] = [];

      for (const file of selected) {
        if (!ACCEPTED_PHOTO_TYPES.has(file.type)) {
          setUploadError(t.typeError);
          continue;
        }
        if (file.size > MAX_PHOTO_SIZE) {
          setUploadError(t.sizeError);
          continue;
        }
        valid.push({
          id: crypto.randomUUID(),
          file,
          url: URL.createObjectURL(file),
          mimeType: file.type,
        });
      }

      if (selectedFiles.length > available) {
        setUploadError(t.countError);
      }
      return [...current, ...valid];
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
  }, []);

  const removePendingPhoto = useCallback((id: string) => {
    setPendingPhotos((current) => {
      const photo = current.find((item) => item.id === id);
      if (photo) URL.revokeObjectURL(photo.url);
      return current.filter((item) => item.id !== id);
    });
    if (photoInputRef.current) photoInputRef.current.value = "";
    setUploadError("");
  }, []);

  const send = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      const text = draft.trim();
      const photos = pendingPhotos;
      if ((!text && photos.length === 0) || isSending) return;

      const serverText =
        text ||
        (photos.length === 1 ? t.photoSingle : t.photoPlural);
      const localMessageId = crypto.randomUUID();

      setMessages((prev) => [
        ...prev,
        {
          id: localMessageId,
          sender: "client",
          text,
          attachments: photos.map(({ id, url, mimeType }) => ({
            id,
            url,
            mimeType,
          })),
        },
      ]);
      setDraft("");
      setPendingPhotos([]);
      setUploadError("");
      setIsSending(true);
      greetingShownRef.current = true;
      requestAnimationFrame(() => {
        messageInputRef.current?.focus({ preventScroll: true });
      });

      try {
        const response = await fetch(`${CHAT_SERVER_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenRef.current,
            service: selectedService ?? undefined,
            text: serverText,
            lang,
            greeting: tokenRef.current ? undefined : initialGreetingRef.current ?? undefined,
          }),
        });
        const data = (await response.json()) as {
          token?: string;
          messageId?: string;
          error?: string;
        };
        if (!response.ok || data.error) {
          throw new Error(data.error ?? "Message unavailable");
        }
        if (data.token) {
          tokenRef.current = data.token;
          setChatToken(data.token);
        }
        const activeToken = tokenRef.current;
        if (!activeToken || !data.messageId) {
          throw new Error("Message identifiers unavailable");
        }

        const uploaded = (
          await Promise.all(
            photos.map(async (photo) => {
              try {
                const uploadResponse = await fetch(
                  `${CHAT_SERVER_URL}/api/attachments?token=${encodeURIComponent(activeToken)}&messageId=${encodeURIComponent(data.messageId ?? "")}`,
                  {
                    method: "POST",
                    headers: { "Content-Type": photo.mimeType },
                    body: photo.file,
                  }
                );
                const uploadData = (await uploadResponse.json()) as {
                  attachment?: ChatAttachment;
                  error?: string;
                };
                if (!uploadResponse.ok || !uploadData.attachment) {
                  throw new Error(uploadData.error ?? "Upload unavailable");
                }
                return {
                  ...uploadData.attachment,
                  url: CHAT_SERVER_URL + uploadData.attachment.url,
                };
              } catch {
                return null;
              }
            })
          )
        ).filter((attachment): attachment is ChatAttachment => attachment !== null);

        photos.forEach((photo) => URL.revokeObjectURL(photo.url));
        setMessages((current) =>
          current.map((message) =>
            message.id === localMessageId
              ? { ...message, attachments: uploaded }
              : message
          )
        );
        if (uploaded.length < photos.length) {
          setUploadError(t.uploadError);
        }

        await getManagerReply(
          selectedService ?? "",
          serverText,
          uploaded.length
        );
      } catch {
        photos.forEach((photo) => URL.revokeObjectURL(photo.url));
        setMessages((current) => {
          if (!text) {
            return current.filter((message) => message.id !== localMessageId);
          }
          return current.map((message) =>
            message.id === localMessageId
              ? { ...message, attachments: [] }
              : message
          );
        });
        const fallback =
          t.fallback;
        await wait(getThinkingDelay());
        typingCountRef.current += 1;
        setIsTyping(true);
        await wait(getTypingDelay(fallback));
        typingCountRef.current = Math.max(0, typingCountRef.current - 1);
        setIsTyping(typingCountRef.current > 0);
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "manager",
            text: fallback,
          },
        ]);
      } finally {
        setIsSending(false);
      }
    },
    [draft, pendingPhotos, isSending, selectedService, getManagerReply]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (greetingShownRef.current) {
      setState((current) => (current === "completed" ? "completed" : "online"));
      return;
    }
    if (connectionStartedRef.current) return;

    let cancelled = false;
    connectionStartedRef.current = true;
    setState("connecting");
    const connectTimer = setTimeout(async () => {
      setState("online");
      if (greetingShownRef.current) return;

      const fallback =
        (selectedService ? t.serviceQuestions[selectedService] : null) ??
        t.initialAskService;

      if (cancelled || greetingShownRef.current) return;

      typingCountRef.current += 1;
      setIsTyping(true);

      try {
        await wait(INITIAL_TYPING_DELAY_MS);
        if (!cancelled && !greetingShownRef.current) {
          greetingShownRef.current = true;
          initialGreetingRef.current = fallback;
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), sender: "manager", text: fallback },
          ]);
        }
      } finally {
        typingCountRef.current = Math.max(0, typingCountRef.current - 1);
        setIsTyping(typingCountRef.current > 0);
      }
    }, INITIAL_CONNECT_DELAY_MS);
    return () => {
      cancelled = true;
      connectionStartedRef.current = false;
      clearTimeout(connectTimer);
    };
  }, [isOpen, selectedService]);

  useEffect(() => {
    if (!isOpen || isMobileModal) return;
    const panel = panelRef.current;
    if (!panel) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      if (!panel.contains(target) && !target.closest("[data-open-chat]")) {
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen, isMobileModal, close]);

  useEffect(() => {
    const onClick = (event: Event) => {
      const target = event.target instanceof Element ? event.target : null;
      const button = target?.closest<HTMLButtonElement>("[data-open-chat]");
      if (!button) return;
      open(button.dataset.service || null);
    };
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [open]);

  return (
    <>
      <button
        className={`floating-chat${isOpen ? " is-hidden" : ""}`}
        type="button"
        onClick={() => open()}
        aria-label={t.openChatAria}
      >
        <span className="chat-dot" aria-hidden="true"></span>
        <span>Чат</span>
      </button>

      <section
        ref={panelRef}
        className={`chat-panel${isOpen ? " is-open" : ""}`}
        role="dialog"
        aria-modal={isMobileModal}
        aria-labelledby="chat-title"
        aria-hidden={!isOpen}
        inert={!isOpen}
      >
        <header className="chat-header">
          <div className="manager-avatar" aria-hidden="true">R</div>
          <div className="manager-details">
            <strong id="chat-title">{t.title}</strong>
            <span className={`manager-status${state === "online" ? " is-online" : ""}`}>
              <i></i>
              <span aria-live="polite">
                {state === "completed"
                  ? t.statusCompleted
                  : state === "online"
                    ? t.online
                    : t.connecting}
              </span>
            </span>
          </div>
          <button
            className="chat-close"
            type="button"
            aria-label={t.closeAria}
            title={t.closeTitle}
            onClick={close}
          >
            &#8722;
          </button>
        </header>

        <div className="chat-body" ref={bodyRef} role="log" aria-live="polite">
          {state === "idle" && (
            <p className="connection-message">{t.connectionMessage}</p>
          )}
          {messages.map((message) =>
            message.sender === "system" ? (
              <p key={message.id} className="connection-message">
                {message.text}
              </p>
            ) : (
            <div
              key={message.id}
              className={`message ${message.sender}${
                message.attachments?.length ? " has-attachments" : ""
              }`}
            >
              {message.attachments && message.attachments.length > 0 && (
                <div className="message-attachments">
                  {message.attachments.map((attachment) => (
                    <a
                      key={attachment.id}
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={t.openPhotoAria}
                    >
                      <img src={attachment.url} alt={t.clientPhotoAlt} />
                    </a>
                  ))}
                </div>
              )}
              {message.text && <span>{message.text}</span>}
            </div>
            )
          )}
          {isTyping && (
            <p className="message manager typing" aria-label={t.typingAria}>
              <span></span><span></span><span></span>
            </p>
          )}
        </div>

        <form className="chat-compose" onSubmit={send}>
          {pendingPhotos.length > 0 && (
            <div className="photo-preview-list" aria-label={t.selectedPhotosAria}>
              {pendingPhotos.map((photo) => (
                <div className="photo-preview" key={photo.id}>
                  <img src={photo.url} alt={t.selectedPhotoAlt} />
                  <button
                    type="button"
                    onClick={() => removePendingPhoto(photo.id)}
                    aria-label="Видалити фотографію"
                    title="Видалити"
                  >
                    &#215;
                  </button>
                </div>
              ))}
            </div>
          )}
          {uploadError && (
            <p className="photo-upload-error" role="status">{uploadError}</p>
          )}
          <label
            className={`attach-button${
              isSending || pendingPhotos.length >= MAX_PHOTOS_PER_MESSAGE
                ? " is-disabled"
                : ""
            }`}
            title={t.addPhotoTitle}
          >
            <span aria-hidden="true">&#43;</span>
            <span className="sr-only">{t.addPhotoAria}</span>
            <input
              id="chat-photo-input"
              ref={photoInputRef}
              className="attach-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
              multiple
              disabled={isSending || pendingPhotos.length >= MAX_PHOTOS_PER_MESSAGE}
              onClick={(event) => {
                event.currentTarget.value = "";
              }}
              onChange={(event) => selectPhotos(event.currentTarget.files)}
            />
          </label>
          <label className="sr-only" htmlFor="chat-message">{t.messageLabel}</label>
          <textarea
            id="chat-message"
            ref={messageInputRef}
            rows={1}
            placeholder={t.placeholder}
            value={draft}
            onChange={(event) => {
              const el = event.currentTarget;
              el.style.height = "auto";
              el.style.height = `${Math.min(el.scrollHeight, 110)}px`;
              setDraft(event.target.value);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send();
              }
            }}
          ></textarea>
          <button
            className="send-button"
            type="submit"
            disabled={isSending || (!draft.trim() && pendingPhotos.length === 0)}
            aria-label={t.sendAria}
            title={t.sendTitle}
          >
            &#8593;
          </button>
        </form>
      </section>
    </>
  );
}
