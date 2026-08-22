import { cache } from "react";
import type { PriceOverrides } from "@/shared/pricing";

const CHAT_SERVER_URL =
  process.env.NEXT_PUBLIC_CHAT_SERVER_URL ?? "http://localhost:4100";

// Правки цен приходят из админки (PostgreSQL через чат-сервер).
// При недоступном сервере сайт работает на каталоге-дефолте из shared/pricing.
export const getPricingOverrides = cache(async (): Promise<PriceOverrides> => {
  try {
    const response = await fetch(`${CHAT_SERVER_URL}/api/settings`, {
      cache: "no-store",
    });
    if (response.ok) {
      const data = (await response.json()) as { prices?: PriceOverrides };
      return data.prices ?? {};
    }
  } catch {
    // сайт остаётся на ценах по умолчанию
  }
  return {};
});
