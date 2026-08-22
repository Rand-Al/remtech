"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import AdminContacts from "@/components/AdminContacts";

const CHAT_SERVER_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

type Health = {
  state: "loading" | "up" | "down";
  llm?: string;
  telegram?: string;
};

function serviceName(value: string | undefined): string {
  if (!value || value === "stub") return "заглушка";
  if (value.startsWith("openai-compatible:")) return value.split(":")[1] ?? value;
  if (value === "bot-api") return "бот подключён";
  return value;
}

function isStub(value: string | undefined): boolean {
  return !value || value === "stub";
}

function prettyModel(value: string | undefined): string {
  if (!value || value === "stub") return "заглушка";
  if (value.startsWith("openai-compatible:")) {
    return value.slice("openai-compatible:".length);
  }
  return value;
}

export default function AdminShell() {
  const [authenticated, setAuthenticated] = useState(false);
  const [loginValue, setLoginValue] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [health, setHealth] = useState<Health>({ state: "loading" });
  const passwordRef = useRef("");

  const loadHealth = useCallback(async () => {
    try {
      const response = await fetch(`${CHAT_SERVER_URL}/health`, {
        cache: "no-store",
      });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as {
        ok?: boolean;
        llm?: string;
        telegram?: string;
      };
      setHealth({
        state: data.ok ? "up" : "down",
        llm: data.llm,
        telegram: data.telegram,
      });
    } catch {
      setHealth({ state: "down" });
    }
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    void loadHealth();
    const timer = window.setInterval(() => void loadHealth(), 60_000);
    return () => window.clearInterval(timer);
  }, [authenticated, loadHealth]);

  const handleAuthError = useCallback(() => {
    passwordRef.current = "";
    setAuthenticated(false);
    setLoginError("Пароль отклонён сервером. Введите ещё раз");
  }, []);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !loginValue) return;
    setSubmitting(true);
    setLoginError(null);
    try {
      const response = await fetch(`${CHAT_SERVER_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: loginValue }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (response.ok && data.ok) {
        passwordRef.current = loginValue;
        setLoginValue("");
        setAuthenticated(true);
      } else {
        setLoginError(data.error ?? "Неверный пароль");
      }
    } catch {
      setLoginError("Чат-сервер недоступен");
    } finally {
      setSubmitting(false);
    }
  };

  if (!authenticated) {
    return (
      <div className="admin-login">
        <form className="admin-login-box" onSubmit={login}>
          <span className="brand-mark" aria-hidden="true">R</span>
          <h1>Админка RemTech</h1>
          <label className="a-field">
            <span>Пароль администратора</span>
            <input
              type="password"
              value={loginValue}
              onChange={(event) => setLoginValue(event.target.value)}
              autoComplete="current-password"
              autoFocus
            />
          </label>
          {loginError && (
            <p className="a-error" role="alert">{loginError}</p>
          )}
          <button
            className="primary-button a-submit"
            type="submit"
            disabled={submitting || !loginValue}
          >
            {submitting ? "Вход..." : "Войти"}
          </button>
        </form>
      </div>
    );
  }

  const serverDown = health.state === "down";
  const services: Array<{ label: string; detail: string; stub: boolean }> = [
    {
      label: "Чат-сервер",
      detail: serverDown
        ? "недоступен"
        : health.state === "up"
          ? "онлайн"
          : "...",
      stub: false,
    },
    {
      label: "LLM",
      detail: serverDown ? "недоступен" : prettyModel(health.llm),
      stub: !serverDown && isStub(health.llm),
    },
    {
      label: "Telegram",
      detail: serverDown ? "недоступен" : serviceName(health.telegram),
      stub: !serverDown && isStub(health.telegram),
    },
  ];

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <span className="admin-brand">
          <span className="brand-mark" aria-hidden="true">R</span>
          RemTech · Админка
        </span>
        <a className="admin-exit-link" href="/">На сайт <span aria-hidden="true">&#8599;</span></a>
      </header>

      <div className="admin-layout">
        <nav className="admin-sidebar" aria-label="Разделы админки">
          <p className="admin-sidebar-title">Разделы</p>
          <button type="button" className="is-active">Контакты</button>
          <button type="button" disabled>Цены <em>скоро</em></button>
          <button type="button" disabled>FAQ <em>скоро</em></button>

          <div
            className={`admin-health${health.state === "down" ? " is-down" : ""}`}
            role="status"
          >
            {services.map((service) => {
              const dotClass =
                health.state === "loading"
                  ? ""
                  : service.stub
                    ? "is-stub"
                    : health.state === "up"
                      ? "is-up"
                      : "is-down";
              return (
                <p key={service.label}>
                  <i className={dotClass} aria-hidden="true"></i>
                  <span>{service.label}</span>
                  <strong>{health.state === "loading" ? "..." : service.detail}</strong>
                </p>
              );
            })}
          </div>
        </nav>

        <main className="admin-content">
          <p className="section-kicker">Настройки сайта</p>
          <h1>Контакты</h1>
          <p className="admin-lede">
            Значения применяются на всём сайте сразу после сохранения - без пересборки.
          </p>
          <AdminContacts password={passwordRef.current} onAuthError={handleAuthError} />
        </main>
      </div>
    </div>
  );
}
