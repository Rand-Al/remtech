"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatMessage = {
  id: string;
  sender: "client" | "manager";
  text: string;
};

type ChatState = "idle" | "connecting" | "online";

const CHAT_SERVER_URL = process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

const BASE_TYPING_DELAY_MS = 900;
const PER_WORD_DELAY_MS = 180;
const MIN_TYPING_DELAY_MS = 1600;
const MAX_TYPING_DELAY_MS = 6500;

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

function getTypingDelay(text: string): number {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const calculated = BASE_TYPING_DELAY_MS + wordCount * PER_WORD_DELAY_MS;
  return Math.min(MAX_TYPING_DELAY_MS, Math.max(MIN_TYPING_DELAY_MS, calculated));
}

export default function ChatPanel({
  defaultService = null,
}: {
  defaultService?: string | null;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileModal, setIsMobileModal] = useState(false);
  const [state, setState] = useState<ChatState>("idle");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [selectedService, setSelectedService] = useState<string | null>(
    defaultService
  );
  const [isTyping, setIsTyping] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const tokenRef = useRef<string | null>(null);
  const greetingShownRef = useRef(false);
  const hydratedRef = useRef(false);
  const connectionStartedRef = useRef(false);
  const typingCountRef = useRef(0);

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
      };
      if (Array.isArray(saved.messages)) setMessages(saved.messages);
      if (typeof saved.token === "string" && saved.token) {
        tokenRef.current = saved.token;
      }
      if (typeof saved.selectedService === "string") {
        setSelectedService(saved.selectedService);
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
        })
      );
    } catch {
      // storage unavailable
    }
  }, [messages, selectedService]);

  const open = useCallback((service?: string | null) => {
    if (service) setSelectedService(service);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => setIsOpen(false), []);

  const getManagerReply = useCallback(async (service: string, text: string) => {
    try {
      const response = await fetch(`${CHAT_SERVER_URL}/api/agent-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current, text, service }),
      });
      const data = (await response.json()) as { text?: string };
      const replyText = typeof data.text === "string" ? data.text : "";
      if (replyText) {
        typingCountRef.current += 1;
        setIsTyping(true);
        await new Promise((resolve) => setTimeout(resolve, getTypingDelay(replyText)));
        typingCountRef.current -= 1;
        setIsTyping(typingCountRef.current > 0);
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), sender: "manager", text: replyText },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          sender: "manager",
          text: "Дякуємо, повідомлення отримано. Менеджер відповість трохи пізніше.",
        },
      ]);
    }
  }, []);

  const send = useCallback(
    async (event?: React.FormEvent) => {
      event?.preventDefault();
      const text = draft.trim();
      if (!text) return;

      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), sender: "client", text },
      ]);
      setDraft("");
      greetingShownRef.current = true;

      try {
        const response = await fetch(`${CHAT_SERVER_URL}/api/chat`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: tokenRef.current,
            service: selectedService ?? undefined,
            text,
            lang: "uk",
          }),
        });
        const data = (await response.json()) as { token?: string; error?: string };
        if (data.token) tokenRef.current = data.token;
        await getManagerReply(selectedService ?? "", text);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            sender: "manager",
            text: "Дякуємо, повідомлення отримано. Менеджер відповість трохи пізніше.",
          },
        ]);
      }
    },
    [draft, selectedService, getManagerReply]
  );

  useEffect(() => {
    if (!isOpen || connectionStartedRef.current) return;
    connectionStartedRef.current = true;
    setState("connecting");
    const connectTimer = setTimeout(() => {
      setState("online");
      if (greetingShownRef.current) return;
      greetingShownRef.current = true;
      const greeting =
        (selectedService ? SERVICE_QUESTIONS[selectedService] : null) ??
        INITIAL_ASK_SERVICE;
      typingCountRef.current += 1;
      setIsTyping(true);
      const messageTimer = setTimeout(
        () => {
          typingCountRef.current -= 1;
          setIsTyping(typingCountRef.current > 0);
          setMessages((prev) => [
            ...prev,
            { id: crypto.randomUUID(), sender: "manager", text: greeting },
          ]);
        },
        getTypingDelay(greeting)
      );
      return () => {
        clearTimeout(messageTimer);
      };
    }, 3000);
    return () => clearTimeout(connectTimer);
  }, [isOpen]);

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
    const buttons = document.querySelectorAll<HTMLButtonElement>("[data-open-chat]");
    const onClick = (event: Event) => {
      const button = event.currentTarget as HTMLButtonElement;
      open(button.dataset.service || null);
    };
    buttons.forEach((button) => button.addEventListener("click", onClick));
    return () => buttons.forEach((button) => button.removeEventListener("click", onClick));
  }, [open]);

  return (
    <>
      <button
        className={`floating-chat${isOpen ? " is-hidden" : ""}`}
        type="button"
        onClick={() => open()}
        aria-label="Відкрити чат з менеджером"
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
            <strong id="chat-title">Менеджер RemTech</strong>
            <span className={`manager-status${state === "online" ? " is-online" : ""}`}>
              <i></i>
              <span aria-live="polite">
                {state === "online" ? "онлайн" : "підключення..."}
              </span>
            </span>
          </div>
          <button
            className="chat-close"
            type="button"
            aria-label="Згорнути чат"
            title="Згорнути"
            onClick={close}
          >
            &#8722;
          </button>
        </header>

        <div className="chat-body" ref={bodyRef} role="log" aria-live="polite">
          {state === "idle" && (
            <p className="connection-message">З’єднуємо з менеджером RemTech...</p>
          )}
          {messages.map((message) => (
            <p key={message.id} className={`message ${message.sender}`}>
              {message.text}
            </p>
          ))}
          {isTyping && (
            <p className="message manager typing" aria-label="Менеджер друкує">
              <span></span><span></span><span></span>
            </p>
          )}
        </div>

        <form className="chat-compose" onSubmit={send}>
          <label className="sr-only" htmlFor="chat-message">Повідомлення</label>
          <textarea
            id="chat-message"
            rows={1}
            placeholder="Напишіть повідомлення..."
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
          <button className="send-button" type="submit" aria-label="Надіслати" title="Надіслати">
            &#8593;
          </button>
        </form>
      </section>
    </>
  );
}