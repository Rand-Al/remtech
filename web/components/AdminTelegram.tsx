"use client";

import { useCallback, useEffect, useState } from "react";

const CHAT_SERVER_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

type FormState = {
  botToken: string;
  chatId: string;
  requestsThreadId: string;
  technicalThreadId: string;
  perRequestTopics: boolean;
};

const EMPTY_FORM: FormState = {
  botToken: "",
  chatId: "",
  requestsThreadId: "",
  technicalThreadId: "",
  perRequestTopics: false,
};

export default function AdminTelegram({
  password,
  onAuthError,
  onSaved,
}: {
  password: string;
  onAuthError: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [hasBotToken, setHasBotToken] = useState(false);
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
          telegram?: {
            chatId?: string;
            requestsThreadId?: string | null;
            technicalThreadId?: string | null;
            perRequestTopics?: boolean;
            hasBotToken?: boolean;
          };
        };
      })
      .then((data) => {
        if (cancelled || !data?.telegram) return;
        setForm({
          ...EMPTY_FORM,
          chatId: data.telegram.chatId ?? "",
          requestsThreadId: data.telegram.requestsThreadId ?? "",
          technicalThreadId: data.telegram.technicalThreadId ?? "",
          perRequestTopics: Boolean(data.telegram.perRequestTopics),
        });
        setHasBotToken(Boolean(data.telegram.hasBotToken));
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
    (
      field: keyof FormState,
      value: string | boolean
    ) => {
      setForm((current) => ({ ...current, [field]: value }) as FormState);
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
            key: "telegram",
            value: {
              botToken: form.botToken.trim(),
              chatId: form.chatId.trim(),
              requestsThreadId: form.requestsThreadId.trim() || null,
              technicalThreadId: form.technicalThreadId.trim() || null,
              perRequestTopics: form.perRequestTopics,
            },
          }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          errors?: string[];
          error?: string;
        };
        if (response.ok && data.ok) {
          setForm((current) => ({ ...current, botToken: "" }));
          setHasBotToken((current) => current || Boolean(form.botToken.trim()));
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
        <legend>Telegram-бот</legend>

        <label className="admin-field">
          <span>Токен бота</span>
          <input
            type="password"
            value={form.botToken}
            onChange={(event) => update("botToken", event.target.value)}
            placeholder={
              hasBotToken ? "Токен сохранён - оставьте поле пустым" : "123456789:AAE..."
            }
            autoComplete="new-password"
          />
          <small className="admin-hint">
            Токен от @BotFather хранится на сервере и обратно не показывается.
          </small>
        </label>

        <div className="admin-two-columns">
          <label className="admin-field">
            <span>ID группы</span>
            <input
              type="text"
              value={form.chatId}
              onChange={(event) => update("chatId", event.target.value)}
              placeholder="-1001234567890"
              autoComplete="off"
            />
          </label>
          <label className="admin-field">
            <span>Отдельная тема на заявку</span>
            <select
              value={form.perRequestTopics ? "yes" : "no"}
              onChange={(event) =>
                update("perRequestTopics", event.target.value === "yes")
              }
            >
              <option value="no">Нет - общая тема заявок</option>
              <option value="yes">Да - своя тема на заявку</option>
            </select>
          </label>
        </div>

        <div className="admin-two-columns">
          <label className="admin-field">
            <span>Тема заявок (необязательно)</span>
            <input
              type="text"
              value={form.requestsThreadId}
              onChange={(event) => update("requestsThreadId", event.target.value)}
              placeholder="2"
              autoComplete="off"
            />
          </label>
          <label className="admin-field">
            <span>Техническая тема (необязательно)</span>
            <input
              type="text"
              value={form.technicalThreadId}
              onChange={(event) => update("technicalThreadId", event.target.value)}
              placeholder="4"
              autoComplete="off"
            />
          </label>
        </div>

        <p className="admin-hint">
          Пустой ID группы - бот отключён (заглушка). После сохранения бот
          подключается сразу, без перезапуска сервера. Очистить конфигурацию
          можно, сохранив пустой ID группы.
        </p>
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
        {saving ? "Сохранение..." : "Сохранить настройки Telegram"}
      </button>
    </form>
  );
}
