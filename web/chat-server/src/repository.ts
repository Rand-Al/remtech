import { randomUUID } from "node:crypto";
import { pool } from "./db.js";
import type { StoredMessage, StoredRequest, RequestFields } from "./types.js";

export const MAX_MESSAGE_LENGTH = 4000;
export const LLM_HISTORY_LIMIT = 20;

export async function ensureTelegramReplySchema(): Promise<void> {
  await pool.query(`
    ALTER TABLE messages
      ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'automation';
    ALTER TABLE requests
      ADD COLUMN IF NOT EXISTS telegram_card_finalized BOOLEAN NOT NULL DEFAULT false;
    CREATE TABLE IF NOT EXISTS telegram_message_links (
      request_id BIGINT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
      chat_id TEXT NOT NULL,
      telegram_message_id BIGINT NOT NULL,
      direction TEXT NOT NULL CHECK (direction IN ('request', 'client', 'manager')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      PRIMARY KEY (chat_id, telegram_message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_telegram_links_request
      ON telegram_message_links(request_id);
    CREATE TABLE IF NOT EXISTS telegram_cards (
      request_id BIGINT PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
      chat_id TEXT,
      telegram_message_id BIGINT,
      thread_id BIGINT,
      state TEXT NOT NULL CHECK (state IN ('preliminary', 'final', 'failed')),
      attempt_count INTEGER NOT NULL DEFAULT 0,
      last_error TEXT,
      sent_at TIMESTAMPTZ,
      last_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      UNIQUE (chat_id, telegram_message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_telegram_cards_state
      ON telegram_cards(state);
    INSERT INTO telegram_cards
      (request_id, chat_id, telegram_message_id, state, attempt_count,
       sent_at, last_attempt_at, updated_at)
    SELECT DISTINCT ON (r.id)
      r.id,
      t.chat_id,
      t.telegram_message_id,
      CASE
        WHEN r.telegram_card_finalized
          OR (r.terms_accepted AND c.name IS NOT NULL AND c.phone IS NOT NULL)
          THEN 'final'
        ELSE 'preliminary'
      END,
      1,
      t.created_at,
      t.created_at,
      now()
    FROM requests r
    JOIN clients c ON c.id = r.client_id
    JOIN telegram_message_links t
      ON t.request_id = r.id AND t.direction = 'request'
    WHERE r.telegram_notified = true
    ORDER BY r.id, t.created_at ASC, t.telegram_message_id ASC
    ON CONFLICT (request_id) DO NOTHING;
  `);
}

export type TelegramCardState = "preliminary" | "final" | "failed";

export interface TelegramCardRecord {
  requestId: string;
  chatId: string | null;
  messageId: number | null;
  threadId: number | null;
  state: TelegramCardState;
  attemptCount: number;
  lastError: string | null;
}

export async function getTelegramCard(
  requestId: string
): Promise<TelegramCardRecord | null> {
  const result = await pool.query(
    `SELECT request_id, chat_id, telegram_message_id, thread_id,
            state, attempt_count, last_error
       FROM telegram_cards
      WHERE request_id = $1`,
    [requestId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    requestId: String(row.request_id),
    chatId: (row.chat_id as string | null) ?? null,
    messageId: row.telegram_message_id === null
      ? null
      : Number(row.telegram_message_id),
    threadId: row.thread_id === null ? null : Number(row.thread_id),
    state: row.state as TelegramCardState,
    attemptCount: Number(row.attempt_count),
    lastError: (row.last_error as string | null) ?? null,
  };
}

export async function saveTelegramCard(
  requestId: string,
  chatId: string,
  messageId: number,
  threadId: number | undefined,
  state: Exclude<TelegramCardState, "failed">
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO telegram_cards
         (request_id, chat_id, telegram_message_id, thread_id, state,
          attempt_count, sent_at, last_attempt_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, 1, now(), now(), now())
       ON CONFLICT (request_id) DO UPDATE SET
         chat_id = EXCLUDED.chat_id,
         telegram_message_id = EXCLUDED.telegram_message_id,
         thread_id = EXCLUDED.thread_id,
         state = EXCLUDED.state,
         attempt_count = telegram_cards.attempt_count + 1,
         last_error = NULL,
         sent_at = COALESCE(telegram_cards.sent_at, now()),
         last_attempt_at = now(),
         updated_at = now()`,
      [requestId, chatId, messageId, threadId ?? null, state]
    );
    await client.query(
      `INSERT INTO telegram_message_links
         (request_id, chat_id, telegram_message_id, direction)
       VALUES ($1, $2, $3, 'request')
       ON CONFLICT (chat_id, telegram_message_id) DO NOTHING`,
      [requestId, chatId, messageId]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function markTelegramCardFinal(
  requestId: string
): Promise<void> {
  await pool.query(
    `UPDATE telegram_cards
        SET state = 'final',
            attempt_count = attempt_count + 1,
            last_error = NULL,
            last_attempt_at = now(),
            updated_at = now()
      WHERE request_id = $1`,
    [requestId]
  );
}

export async function recordTelegramCardError(
  requestId: string,
  error: string
): Promise<void> {
  await pool.query(
    `INSERT INTO telegram_cards
       (request_id, state, attempt_count, last_error, last_attempt_at, updated_at)
     VALUES ($1, 'failed', 1, $2, now(), now())
     ON CONFLICT (request_id) DO UPDATE SET
       attempt_count = telegram_cards.attempt_count + 1,
       last_error = EXCLUDED.last_error,
       last_attempt_at = now(),
       updated_at = now()`,
    [requestId, error.slice(0, 1000)]
  );
}

export async function createRequest(
  fields: RequestFields
): Promise<StoredRequest> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let clientId: number;
    if (fields.phone) {
      const existing = await client.query(
        `SELECT id FROM clients WHERE phone = $1 LIMIT 1`,
        [fields.phone]
      );
      if (existing.rows[0]) {
        clientId = existing.rows[0].id as number;
        await client.query(
          `UPDATE clients SET
             name = COALESCE($1, name),
             lang = $2
            WHERE id = $3`,
          [fields.name ?? null, fields.lang, clientId]
        );
      } else {
        const clientResult = await client.query(
          `INSERT INTO clients (name, phone, lang) VALUES ($1, $2, $3) RETURNING id`,
          [fields.name ?? null, fields.phone, fields.lang]
        );
        clientId = clientResult.rows[0].id as number;
      }
    } else {
      const clientResult = await client.query(
        `INSERT INTO clients (name, phone, lang) VALUES ($1, NULL, $2) RETURNING id`,
        [fields.name ?? null, fields.lang]
      );
      clientId = clientResult.rows[0].id as number;
    }

    let deviceId: number | null = null;
    if (fields.deviceType) {
      const deviceResult = await client.query(
        `INSERT INTO devices (client_id, type, brand, model) VALUES ($1, $2, $3, $4) RETURNING id`,
        [clientId, fields.deviceType, fields.deviceBrand ?? null, fields.deviceModel ?? null]
      );
      deviceId = deviceResult.rows[0].id as number;
    }

    const token = randomUUID();
    const number = `RT-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const requestResult = await client.query(
      `INSERT INTO requests
         (token, number, client_id, device_id, service, symptom, location, urgency, status, lang, terms_accepted)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, token, number, status`,
      [
        token,
        number,
        clientId,
        deviceId,
        fields.service,
        fields.symptom ?? null,
        fields.location ?? null,
        fields.urgency ?? null,
        "new",
        fields.lang,
        fields.termsAccepted,
      ]
    );

    const row = requestResult.rows[0];

    await client.query(
      `INSERT INTO request_status_history (request_id, from_status, to_status)
       VALUES ($1, NULL, 'new')`,
      [row.id]
    );

    await client.query("COMMIT");

    return {
      id: String(row.id),
      token: row.token as string,
      number: row.number as string,
      status: row.status as string,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getRequestByToken(
  token: string
): Promise<{ id: string } | null> {
  const result = await pool.query(
    `SELECT id FROM requests WHERE token = $1`,
    [token]
  );
  const row = result.rows[0];
  return row ? { id: String(row.id) } : null;
}

export interface RequestDetails {
  id: string;
  clientId: number;
  number: string;
  createdAt: string;
  service: string;
  symptom: string | null;
  status: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  urgency: string | null;
  deviceDetails: string | null;
  lang: string;
  termsAccepted: boolean;
  telegramNotified: boolean;
  telegramCardFinalized: boolean;
  attachmentCount: number;
}

export async function getRequestDetails(
  token: string
): Promise<RequestDetails | null> {
  const result = await pool.query(
    `SELECT r.id, r.client_id, r.number, r.created_at, r.service, r.symptom, r.status, r.location, r.urgency,
            r.lang, r.terms_accepted, r.telegram_notified, r.telegram_card_finalized,
            c.name, c.phone, d.notes AS device_details,
            (SELECT COUNT(*) FROM attachments a WHERE a.request_id = r.id) AS attachment_count
       FROM requests r
       JOIN clients c ON c.id = r.client_id
       LEFT JOIN devices d ON d.id = r.device_id
      WHERE r.token = $1`,
    [token]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    clientId: Number(row.client_id),
    number: row.number as string,
    createdAt: new Date(row.created_at as string).toISOString(),
    service: row.service as string,
    symptom: (row.symptom as string | null) ?? null,
    status: row.status as string,
    name: (row.name as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    urgency: (row.urgency as string | null) ?? null,
    deviceDetails: (row.device_details as string | null) ?? null,
    lang: (row.lang as string) ?? "uk",
    termsAccepted: Boolean(row.terms_accepted),
    telegramNotified: Boolean(row.telegram_notified),
    telegramCardFinalized: Boolean(row.telegram_card_finalized),
    attachmentCount: Number(row.attachment_count),
  };
}

export async function updateRequestTermsAccepted(
  requestId: string,
  accepted: boolean
): Promise<void> {
  await pool.query(
    "UPDATE requests SET terms_accepted = $1, updated_at = now() WHERE id = $2",
    [accepted, requestId]
  );
}

export async function updateRequestService(
  requestId: string,
  service: string
): Promise<void> {
  await pool.query(
    "UPDATE requests SET service = $1, updated_at = now() WHERE id = $2",
    [service, requestId]
  );
}

export async function updateRequestLocation(
  requestId: string,
  location: string
): Promise<void> {
  await pool.query(
    "UPDATE requests SET location = $1, updated_at = now() WHERE id = $2",
    [location, requestId]
  );
}

export async function updateRequestSymptom(
  requestId: string,
  symptom: string
): Promise<void> {
  await pool.query(
    "UPDATE requests SET symptom = $1, updated_at = now() WHERE id = $2",
    [symptom, requestId]
  );
}

export async function updateRequestDeviceDetails(
  requestId: string,
  deviceType: string,
  details: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const requestResult = await client.query(
      "SELECT client_id, device_id FROM requests WHERE id = $1 FOR UPDATE",
      [requestId]
    );
    const row = requestResult.rows[0];
    if (!row) throw new Error("Заявка не найдена");

    if (row.device_id) {
      await client.query(
        "UPDATE devices SET notes = $1 WHERE id = $2",
        [details, row.device_id]
      );
    } else {
      const deviceResult = await client.query(
        `INSERT INTO devices (client_id, type, notes)
         VALUES ($1, $2, $3)
         RETURNING id`,
        [row.client_id, deviceType, details]
      );
      await client.query(
        "UPDATE requests SET device_id = $1, updated_at = now() WHERE id = $2",
        [deviceResult.rows[0].id, requestId]
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function updateClientContact(
  clientId: number,
  name?: string,
  phone?: string
): Promise<void> {
  if (!name && !phone) return;
  await pool.query(
    `UPDATE clients SET
       name = COALESCE($1, name),
       phone = COALESCE($2, phone)
      WHERE id = $3`,
    [name ?? null, phone ?? null, clientId]
  );
}

export async function markRequestTelegramNotified(
  requestId: string,
  finalized: boolean
): Promise<void> {
  await pool.query(
    `UPDATE requests
        SET telegram_notified = true,
            telegram_card_finalized = telegram_card_finalized OR $2,
            updated_at = now()
      WHERE id = $1`,
    [requestId, finalized]
  );
}

export async function saveTelegramMessageLink(
  requestId: string,
  chatId: string,
  telegramMessageId: number,
  direction: "request" | "client" | "manager"
): Promise<void> {
  await pool.query(
    `INSERT INTO telegram_message_links
       (request_id, chat_id, telegram_message_id, direction)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (chat_id, telegram_message_id) DO NOTHING`,
    [requestId, chatId, telegramMessageId, direction]
  );
}

export async function getRequestByTelegramReply(
  chatId: string,
  replyToMessageId: number
): Promise<{
  id: string;
  token: string;
  number: string;
  status: string;
} | null> {
  const result = await pool.query(
    `SELECT r.id, r.token, r.number, r.status
       FROM telegram_message_links t
       JOIN requests r ON r.id = t.request_id
      WHERE t.chat_id = $1 AND t.telegram_message_id = $2`,
    [chatId, replyToMessageId]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    token: row.token as string,
    number: row.number as string,
    status: row.status as string,
  };
}

export async function getLatestTelegramMessageLink(
  requestId: string
): Promise<{ chatId: string; messageId: number; threadId?: number } | null> {
  const result = await pool.query(
    `SELECT t.chat_id, t.telegram_message_id, c.thread_id
       FROM telegram_message_links t
       LEFT JOIN telegram_cards c ON c.request_id = t.request_id
      WHERE t.request_id = $1
      ORDER BY t.created_at DESC, t.telegram_message_id DESC
      LIMIT 1`,
    [requestId]
  );
  const row = result.rows[0];
  return row
      ? {
        chatId: row.chat_id as string,
        messageId: Number(row.telegram_message_id),
        threadId: row.thread_id === null ? undefined : Number(row.thread_id),
      }
    : null;
}

export async function getTelegramRequestCardLink(
  requestId: string
): Promise<{ chatId: string; messageId: number } | null> {
  const result = await pool.query(
    `SELECT chat_id, telegram_message_id
       FROM telegram_message_links
      WHERE request_id = $1 AND direction = 'request'
      ORDER BY created_at ASC, telegram_message_id ASC
      LIMIT 1`,
    [requestId]
  );
  const row = result.rows[0];
  return row
    ? {
        chatId: row.chat_id as string,
        messageId: Number(row.telegram_message_id),
      }
    : null;
}

export async function saveTelegramManagerReply(
  requestId: string,
  chatId: string,
  telegramMessageId: number,
  text: string,
  managerName: string
): Promise<StoredMessage | null> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const link = await client.query(
      `INSERT INTO telegram_message_links
         (request_id, chat_id, telegram_message_id, direction)
       VALUES ($1, $2, $3, 'manager')
       ON CONFLICT (chat_id, telegram_message_id) DO NOTHING
       RETURNING telegram_message_id`,
      [requestId, chatId, telegramMessageId]
    );
    if (!link.rows[0]) {
      await client.query("ROLLBACK");
      return null;
    }

    const current = await client.query(
      `SELECT status FROM requests WHERE id = $1 FOR UPDATE`,
      [requestId]
    );
    const previousStatus = (current.rows[0]?.status as string | undefined) ?? null;
    if (previousStatus !== "waiting_for_manager") {
      await client.query(
        `UPDATE requests SET status = 'waiting_for_manager', updated_at = now() WHERE id = $1`,
        [requestId]
      );
      await client.query(
        `INSERT INTO request_status_history
           (request_id, from_status, to_status, changed_by)
         VALUES ($1, $2, 'waiting_for_manager', $3)`,
        [requestId, previousStatus, `telegram:${managerName}`]
      );
    }

    const messageResult = await client.query(
      `INSERT INTO messages (request_id, sender, text, source)
       VALUES ($1, 'manager', $2, 'telegram')
       RETURNING id, sender, text`,
      [requestId, text]
    );
    await client.query("COMMIT");

    const row = messageResult.rows[0];
    return {
      id: String(row.id),
      sender: row.sender as "manager",
      text: row.text as string,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function saveMessage(
  requestId: string,
  sender: "client" | "manager",
  text: string
): Promise<StoredMessage> {
  const result = await pool.query(
    `INSERT INTO messages (request_id, sender, text) VALUES ($1, $2, $3) RETURNING id, sender, text`,
    [requestId, sender, text]
  );
  const row = result.rows[0];
  return {
    id: String(row.id),
    sender: row.sender as "client" | "manager",
    text: row.text as string,
  };
}

export async function saveAttachment(
  requestId: string,
  messageId: string,
  filePath: string,
  mimeType: string,
  sizeBytes: number
): Promise<{ id: string }> {
  const result = await pool.query(
    `INSERT INTO attachments (request_id, message_id, file_path, mime_type, size_bytes)
     SELECT $1, m.id, $3, $4, $5
       FROM messages m
      WHERE m.id = $2
        AND m.request_id = $1
        AND (SELECT count(*) FROM attachments a WHERE a.message_id = m.id) < 3
     RETURNING id`,
    [requestId, messageId, filePath, mimeType, sizeBytes]
  );
  const row = result.rows[0];
  if (!row) throw new Error("Attachment limit reached or message does not belong to request");
  return { id: String(row.id) };
}

export async function getAttachmentByToken(
  attachmentId: string,
  token: string
): Promise<{ filePath: string; mimeType: string; sizeBytes: number } | null> {
  const result = await pool.query(
    `SELECT a.file_path, a.mime_type, a.size_bytes
       FROM attachments a
       JOIN requests r ON r.id = a.request_id
      WHERE a.id = $1 AND r.token = $2`,
    [attachmentId, token]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    filePath: row.file_path as string,
    mimeType: (row.mime_type as string | null) ?? "application/octet-stream",
    sizeBytes: Number(row.size_bytes),
  };
}

export async function getMessages(
  requestId: string,
  limit?: number
): Promise<StoredMessage[]> {
  const result = await pool.query(
    `SELECT id, sender, text FROM messages WHERE request_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
    [requestId, limit ?? null]
  );
  const rows = result.rows.slice().reverse();
  return rows.map((row) => ({
    id: String(row.id),
    sender: row.sender as "client" | "manager",
    text: row.text as string,
  }));
}

export async function getManagerMessagesAfterToken(
  token: string,
  afterMessageId: string
): Promise<StoredMessage[]> {
  const result = await pool.query(
    `SELECT m.id, m.sender, m.text
       FROM messages m
       JOIN requests r ON r.id = m.request_id
      WHERE r.token = $1
        AND m.sender = 'manager'
        AND m.source = 'telegram'
        AND m.id > $2
      ORDER BY m.id ASC
      LIMIT 50`,
    [token, afterMessageId || "0"]
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    sender: row.sender as "manager",
    text: row.text as string,
  }));
}

export async function updateRequestStatus(
  requestId: string,
  toStatus: string,
  changedBy: string
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const current = await client.query(
      `SELECT status FROM requests WHERE id = $1 FOR UPDATE`,
      [requestId]
    );
    const fromStatus = current.rows[0]?.status ?? null;

    await client.query(
      `UPDATE requests SET status = $1, updated_at = now() WHERE id = $2`,
      [toStatus, requestId]
    );

    await client.query(
      `INSERT INTO request_status_history (request_id, from_status, to_status, changed_by)
       VALUES ($1, $2, $3, $4)`,
      [requestId, fromStatus, toStatus, changedBy]
    );

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function logTechnicalEvent(
  eventType: string,
  severity: string,
  message: string,
  metadata?: unknown
): Promise<void> {
  await pool.query(
    `INSERT INTO technical_events (event_type, severity, message, metadata)
     VALUES ($1, $2, $3, $4)`,
    [
      eventType,
      severity,
      message,
      metadata === undefined ? null : JSON.stringify(metadata),
    ]
  );
}
