"use client";

import { useCallback, useEffect, useState } from "react";
import {
  formatPrice,
  getPriceItem,
  pricingCatalog,
  type PriceId,
  type PriceOverrides,
  type PriceValue,
} from "@/shared/pricing";

const CHAT_SERVER_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

type Kind = PriceValue["kind"];

type FormValue = {
  kind: Kind;
  amount: string;
  min: string;
  max: string;
};

type FormState = Record<PriceId, FormValue>;

const PRICE_IDS = Object.keys(pricingCatalog.items) as PriceId[];

const KIND_LABELS: Record<Kind, string> = {
  fixed: "фиксированная",
  range: "диапазон",
  from: "от",
  "after-inspection": "после осмотра",
  individual: "индивидуально",
};

function valueToForm(id: PriceId, overrides?: PriceOverrides): FormValue {
  const base =
    overrides?.[id] ??
    (pricingCatalog.items[id] as { value: PriceValue }).value;
  switch (base.kind) {
    case "fixed":
      return { kind: base.kind, amount: String(base.amount), min: "", max: "" };
    case "from":
      return { kind: base.kind, amount: String(base.amount), min: "", max: "" };
    case "range":
      return {
        kind: base.kind,
        amount: "",
        min: String(base.min),
        max: String(base.max),
      };
    default:
      return { kind: base.kind, amount: "", min: "", max: "" };
  }
}

function formToValue(form: FormValue): PriceValue {
  switch (form.kind) {
    case "fixed":
      return { kind: "fixed", amount: Number(form.amount) };
    case "from":
      return { kind: "from", amount: Number(form.amount) };
    case "range":
      return { kind: "range", min: Number(form.min), max: Number(form.max) };
    default:
      return { kind: form.kind };
  }
}

export default function AdminPrices({
  password,
  onAuthError,
}: {
  password: string;
  onAuthError: () => void;
}) {
  const [form, setForm] = useState<FormState>(
    () =>
      Object.fromEntries(
        PRICE_IDS.map((id) => [id, valueToForm(id)])
      ) as FormState
  );
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`${CHAT_SERVER_URL}/api/settings`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data: { prices?: PriceOverrides }) => {
        if (cancelled) return;
        setForm(
          Object.fromEntries(
            PRICE_IDS.map((id) => [id, valueToForm(id, data.prices)])
          ) as FormState
        );
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setErrors(["Не удалось загрузить цены с чат-сервера"]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const updateField = useCallback(
    (id: PriceId, field: keyof FormValue, value: string) => {
      setForm((current) => ({
        ...current,
        [id]: { ...current[id], [field]: value },
      }));
      setSavedAt(null);
    },
    []
  );

  const updateKind = useCallback((id: PriceId, kind: Kind) => {
    setForm((current) => ({
      ...current,
      [id]: { ...valueToForm(id), kind },
    }));
    setSavedAt(null);
  }, []);

  const save = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (saving) return;
      setSaving(true);
      setErrors([]);
      try {
        const value = Object.fromEntries(
          PRICE_IDS.map((id) => [id, formToValue(form[id])])
        );
        const response = await fetch(`${CHAT_SERVER_URL}/api/admin/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, key: "prices", value }),
        });
        const data = (await response.json()) as {
          ok?: boolean;
          errors?: string[];
          error?: string;
        };
        if (response.ok && data.ok) {
          setSavedAt(new Date().toLocaleTimeString("ru-RU"));
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
        setErrors([data.error ?? "Не удалось сохранить цены"]);
      } catch {
        setErrors(["Чат-сервер недоступен"]);
      } finally {
        setSaving(false);
      }
    },
    [form, password, saving, onAuthError]
  );

  return (
    <form className="admin-form" onSubmit={save}>
      <fieldset className="admin-fieldset" disabled={!loaded}>
        <legend>Цены</legend>

        {PRICE_IDS.map((id) => {
          const item = getPriceItem(id);
          const row = form[id];
          return (
            <div className="admin-price-row" key={id}>
              <div className="admin-price-title">
                <span>{item.label.ru}</span>
                <small className="admin-hint">
                  {item.label.uk} · сейчас в каталоге:{" "}
                  {formatPrice(item.value, "ru")}
                </small>
              </div>

              <div className="admin-two-columns">
                <label className="admin-field">
                  <span>Тип</span>
                  <select
                    value={row.kind}
                    onChange={(event) =>
                      updateKind(id, event.target.value as Kind)
                    }
                  >
                    {(Object.keys(KIND_LABELS) as Kind[]).map((kind) => (
                      <option key={kind} value={kind}>
                        {KIND_LABELS[kind]}
                      </option>
                    ))}
                  </select>
                </label>

                {(row.kind === "fixed" || row.kind === "from") && (
                  <label className="admin-field">
                    <span>Сумма, грн</span>
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={row.amount}
                      onChange={(event) =>
                        updateField(id, "amount", event.target.value)
                      }
                      autoComplete="off"
                    />
                  </label>
                )}

                {row.kind === "range" && (
                  <>
                    <label className="admin-field">
                      <span>От, грн</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={row.min}
                        onChange={(event) =>
                          updateField(id, "min", event.target.value)
                        }
                        autoComplete="off"
                      />
                    </label>
                    <label className="admin-field">
                      <span>До, грн</span>
                      <input
                        type="number"
                        min={0}
                        step={1}
                        value={row.max}
                        onChange={(event) =>
                          updateField(id, "max", event.target.value)
                        }
                        autoComplete="off"
                      />
                    </label>
                  </>
                )}
              </div>
            </div>
          );
        })}
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
          Сохранено в {savedAt}. Сайт и чат уже используют новые значения.
        </p>
      )}

      <button
        className="primary-button admin-save-button"
        type="submit"
        disabled={saving || !loaded}
      >
        {saving ? "Сохранение..." : "Сохранить цены"}
      </button>
    </form>
  );
}
