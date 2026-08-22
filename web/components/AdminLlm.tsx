"use client";

import { useCallback, useEffect, useState } from "react";

const CHAT_SERVER_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

type ThinkingChoice = "default" | "on" | "off";

type FormState = {
  baseUrl: string;
  model: string;
  fallback: string;
  apiKey: string;
  thinking: ThinkingChoice;
};

const EMPTY_FORM: FormState = {
  baseUrl: "",
  model: "",
  fallback: "",
  apiKey: "",
  thinking: "default",
};

function thinkingFromValue(value: boolean | null): ThinkingChoice {
  if (value === true) return "on";
  if (value === false) return "off";
  return "default";
}

function valueFromThinking(choice: ThinkingChoice): boolean | null {
  if (choice === "on") return true;
  if (choice === "off") return false;
  return null;
}

export default function AdminLlm({
  password,
  onAuthError,
  onSaved,
}: {
  password: string;
  onAuthError: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${CHAT_SERVER_URL}/api/admin/read-settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) {
          onAuthError();
          return null;
        }
        return (await response.json()) as {
          llm?: {
            baseUrl?: string;
            model?: string;
            fallbackModels?: string[];
            enableThinking?: boolean | null;
            hasApiKey?: boolean;
          };
        };
      })
      .then((data) => {
        if (cancelled || !data?.llm) return;
        setForm({
          baseUrl: data.llm.baseUrl ?? "",
          model: data.llm.model ?? "",
          fallback: (data.llm.fallbackModels ?? []).join(", "),
          apiKey: "",
          thinking: thinkingFromValue(data.llm.enableThinking ?? null),
        });
        setHasApiKey(Boolean(data.llm.hasApiKey));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setErrors(["Не удалось загрузить настройки с чат-сервера"]);
      });
    return () => {
      cancelled = true;
    };
    // Пароль вводится один раз на сессию и не меняется, пока открыт экран.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = useCallback(
    (field: keyof FormState) =>
      (
        event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
      ) => {
        const value = event.target.value as FormState[typeof field];
        setForm((current) => ({ ...current, [field]: value }));
        setSavedAt(null);
      },
    []
  );

  const save = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (saving) return;
      setSaving(true);
      setErrors([]);
      try {
        const response = await fetch(`${CHAT_SERVER_URL}/api/admin/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password,
            key: "llm",
            value: {
              baseUrl: form.baseUrl,
              model: form.model,
              fallbackModels: form.fallback,
              apiKey: form.apiKey.trim(),
              enableThinking: valueFromThinking(form.thinking),
            },
          }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          errors?: string[];
          error?: string;
        };
        if (response.ok && data.ok) {
          setForm((current) => ({ ...current, apiKey: "" }));
          setHasApiKey((current) => current || Boolean(form.apiKey.trim()));
          setSavedAt(new Date().toLocaleTimeString("ru-RU"));
          onSaved();
          return;
        }
        if (response.status === 401 || response.status === 403) {
          onAuthError();
          return;
        }
        if (Array.isArray(data.errors) && data.errors.length > 0) {
          setErrors(data.errors);
          return;
        }
        setErrors([data.error ?? "Не удалось сохранить настройки"]);
      } catch {
        setErrors(["Чат-сервер недоступен"]);
      } finally {
        setSaving(false);
      }
    },
    [form, password, saving, onAuthError, onSaved]
  );

  return (
    <form className="admin-form" onSubmit={save}>
      <fieldset className="admin-fieldset" disabled={!loaded}>
        <legend>LLM-провайдер</legend>

        <label className="admin-field">
          <span>Адрес API (OpenAI-совместимый)</span>
          <input
            type="text"
            value={form.baseUrl}
            onChange={update("baseUrl")}
            placeholder="https://dashscope-intl.aliyuncs.com/compatible-mode/v1"
            autoComplete="off"
          />
          <small className="admin-hint">
            Пустой адрес — чат работает на заглушке без реальных ответов.
          </small>
        </label>

        <div className="admin-two-columns">
          <label className="admin-field">
            <span>Модель</span>
            <input
              type="text"
              value={form.model}
              onChange={update("model")}
              placeholder="qwen3.8-max"
              autoComplete="off"
            />
          </label>
          <label className="admin-field">
            <span>Thinking-режим</span>
            <select value={form.thinking} onChange={update("thinking")}>
              <option value="default">По умолчанию провайдера</option>
              <option value="off">Выключить</option>
              <option value="on">Включить</option>
            </select>
          </label>
        </div>

        <label className="admin-field">
          <span>Резервные модели (через запятую)</span>
          <input
            type="text"
            value={form.fallback}
            onChange={update("fallback")}
            placeholder="model-b, model-c"
            autoComplete="off"
          />
        </label>

        <label className="admin-field">
          <span>API-ключ</span>
          <input
            type="password"
            value={form.apiKey}
            onChange={update("apiKey")}
            placeholder={
              hasApiKey ? "Ключ сохранён - оставьте поле пустым" : "sk-..."
            }
            autoComplete="new-password"
          />
          <small className="admin-hint">
            Ключ хранится на сервере и обратно не показывается. Для LM Studio
            локальный ключ не нужен.
          </small>
        </label>
      </fieldset>

      {errors.length > 0 && (
        <ul className="admin-errors" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      {savedAt && (
        <p className="admin-saved" role="status">
          Сохранено в {savedAt}. Статус ниже в меню обновлён.
        </p>
      )}

      <button
        className="primary-button admin-save-button"
        type="submit"
        disabled={saving || !loaded}
      >
        {saving ? "Сохранение..." : "Сохранить настройки LLM"}
      </button>
    </form>
  );
}
