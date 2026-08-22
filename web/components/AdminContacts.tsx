"use client";

import { useCallback, useEffect, useState } from "react";
import type { SiteContacts } from "@/shared/settings";

const CHAT_SERVER_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

const EMPTY_FORM = {
  phone: "",
  telegramUrl: "",
  telegramLabel: "",
  scheduleUk: "",
  scheduleRu: "",
  areaUk: "",
  areaRu: "",
};

type FormState = typeof EMPTY_FORM;

function formFromContacts(contacts: SiteContacts): FormState {
  return {
    phone: contacts.phone,
    telegramUrl: contacts.telegramUrl,
    telegramLabel: contacts.telegramLabel,
    scheduleUk: contacts.schedule.uk,
    scheduleRu: contacts.schedule.ru,
    areaUk: contacts.area.uk,
    areaRu: contacts.area.ru,
  };
}

function payloadFromForm(form: FormState) {
  return {
    phone: form.phone,
    telegramUrl: form.telegramUrl,
    telegramLabel: form.telegramLabel,
    schedule: { uk: form.scheduleUk, ru: form.scheduleRu },
    area: { uk: form.areaUk, ru: form.areaRu },
  };
}

export default function AdminContacts() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loaded, setLoaded] = useState(false);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${CHAT_SERVER_URL}/api/settings`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { contacts?: SiteContacts }) => {
        if (cancelled || !data.contacts) return;
        setForm(formFromContacts(data.contacts));
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setErrors(["Не удалось загрузить настройки с чат-сервера"]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    (field: keyof FormState) =>
      (
        event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        setForm((current) => ({ ...current, [field]: event.target.value }));
        setSavedAt(null);
      },
    []
  );

  const save = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (saving) return;
      if (!password) {
        setErrors(["Введите пароль администратора"]);
        return;
      }
      setSaving(true);
      setErrors([]);
      try {
        const response = await fetch(`${CHAT_SERVER_URL}/api/admin/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            password,
            key: "contacts",
            value: payloadFromForm(form),
          }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          errors?: string[];
          error?: string;
        };
        if (response.ok && data.ok) {
          setSavedAt(new Date().toLocaleTimeString("ru-RU"));
          setPassword("");
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
    [form, password, saving]
  );

  return (
    <form className="admin-form" onSubmit={save}>
      <fieldset className="admin-fieldset" disabled={!loaded}>
        <legend>Контакты</legend>

        <label className="admin-field">
          <span>Телефон</span>
          <input
            type="text"
            value={form.phone}
            onChange={update("phone")}
            placeholder="+38 050 123 45 67"
            autoComplete="off"
          />
        </label>

        <div className="admin-two-columns">
          <label className="admin-field">
            <span>Ссылка Telegram</span>
            <input
              type="url"
              value={form.telegramUrl}
              onChange={update("telegramUrl")}
              placeholder="https://t.me/example"
              autoComplete="off"
            />
          </label>
          <label className="admin-field">
            <span>Подпись Telegram</span>
            <input
              type="text"
              value={form.telegramLabel}
              onChange={update("telegramLabel")}
              placeholder="@example"
              autoComplete="off"
            />
          </label>
        </div>

        <div className="admin-localized">
          <p className="admin-field-title">График работы</p>
          <label className="admin-field">
            <span>UA</span>
            <textarea
              rows={2}
              value={form.scheduleUk}
              onChange={update("scheduleUk")}
            />
          </label>
          <label className="admin-field">
            <span>RU</span>
            <textarea
              rows={2}
              value={form.scheduleRu}
              onChange={update("scheduleRu")}
            />
          </label>
        </div>

        <div className="admin-localized">
          <p className="admin-field-title">Зона выезда</p>
          <label className="admin-field">
            <span>UA</span>
            <textarea rows={2} value={form.areaUk} onChange={update("areaUk")} />
          </label>
          <label className="admin-field">
            <span>RU</span>
            <textarea rows={2} value={form.areaRu} onChange={update("areaRu")} />
          </label>
        </div>
      </fieldset>

      <label className="admin-field admin-password">
        <span>Пароль администратора</span>
        <input
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          autoComplete="off"
        />
      </label>

      {errors.length > 0 && (
        <ul className="admin-errors" role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      {savedAt && (
        <p className="admin-saved" role="status">
          Сохранено в {savedAt}
        </p>
      )}

      <button
        className="admin-save-button"
        type="submit"
        disabled={saving || !loaded}
      >
        {saving ? "Сохранение..." : "Сохранить"}
      </button>
    </form>
  );
}
