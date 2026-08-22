import { cache } from "react";
import {
  contactsWithDefaults,
  type SiteContacts,
} from "@/shared/settings";

const CHAT_SERVER_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

// Контакты приходят из админки (PostgreSQL через чат-сервер).
// При недоступном сервере сайт продолжает работать на значениях по умолчанию.
export const getContacts = cache(async (): Promise<SiteContacts> => {
  try {
    const response = await fetch(`${CHAT_SERVER_URL}/api/settings`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as {
        contacts?: Partial<SiteContacts>;
      };
      return contactsWithDefaults(data.contacts);
    }
  } catch {
    // сайт остаётся на дефолтных контактах
  }
  return contactsWithDefaults(null);
});
