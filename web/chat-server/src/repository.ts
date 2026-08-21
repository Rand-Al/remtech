import { randomUUID } from "node:crypto";
import { pool } from "./db.js";
import type { StoredMessage, StoredRequest, RequestFields } from "./types.js";

export const MAX_MESSAGE_LENGTH = 4000;
export const LLM_HISTORY_LIMIT = 20;

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
  service: string;
  symptom: string | null;
  status: string;
  name: string | null;
  phone: string | null;
  location: string | null;
  urgency: string | null;
  lang: string;
  termsAccepted: boolean;
  telegramNotified: boolean;
  attachmentCount: number;
}

export async function getRequestDetails(
  token: string
): Promise<RequestDetails | null> {
  const result = await pool.query(
    `SELECT r.id, r.client_id, r.number, r.service, r.symptom, r.status, r.location, r.urgency,
            r.lang, r.terms_accepted, r.telegram_notified, c.name, c.phone,
            (SELECT COUNT(*) FROM attachments a WHERE a.request_id = r.id) AS attachment_count
       FROM requests r
       JOIN clients c ON c.id = r.client_id
      WHERE r.token = $1`,
    [token]
  );
  const row = result.rows[0];
  if (!row) return null;
  return {
    id: String(row.id),
    clientId: Number(row.client_id),
    number: row.number as string,
    service: row.service as string,
    symptom: (row.symptom as string | null) ?? null,
    status: row.status as string,
    name: (row.name as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    urgency: (row.urgency as string | null) ?? null,
    lang: (row.lang as string) ?? "uk",
    termsAccepted: Boolean(row.terms_accepted),
    telegramNotified: Boolean(row.telegram_notified),
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
  requestId: string
): Promise<void> {
  await pool.query(
    `UPDATE requests SET telegram_notified = true WHERE id = $1`,
    [requestId]
  );
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
