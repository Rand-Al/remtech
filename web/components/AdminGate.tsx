"use client";

import { useState } from "react";
import AdminContacts from "@/components/AdminContacts";

const CHAT_SERVER_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

export default function AdminGate() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting || !password) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch(`${CHAT_SERVER_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string };
      if (response.ok && data.ok) {
        setAuthenticated(true);
        setPassword("");
      } else {
        setError(data.error ?? "Неверный пароль");
      }
    } catch {
      setError("Чат-сервер недоступен");
    } finally {
      setSubmitting(false);
    }
  };

  if (authenticated) {
    return <AdminContacts />;
  }

  return (
    <form className="admin-form" onSubmit={login}>
      <fieldset className="admin-fieldset">
        <legend>Вход в админку</legend>
        <label className="admin-field admin-password">
          <span>Пароль администратора</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            autoFocus
          />
        </label>
      </fieldset>

      {error && (
        <ul className="admin-errors" role="alert">
          <li>{error}</li>
        </ul>
      )}

      <button
        className="admin-save-button"
        type="submit"
        disabled={submitting || !password}
      >
        {submitting ? "Вход..." : "Войти"}
      </button>
    </form>
  );
}
