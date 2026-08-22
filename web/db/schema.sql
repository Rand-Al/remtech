-- RemTech: схема базы данных (этап 1)

-- Клиенты
CREATE TABLE IF NOT EXISTS clients (
  id BIGSERIAL PRIMARY KEY,
  name TEXT,
  phone TEXT,
  telegram TEXT,
  lang TEXT NOT NULL DEFAULT 'uk',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Техника клиента
CREATE TABLE IF NOT EXISTS devices (
  id BIGSERIAL PRIMARY KEY,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Заявки
CREATE TABLE IF NOT EXISTS requests (
  id BIGSERIAL PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  number TEXT NOT NULL UNIQUE,
  client_id BIGINT NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  device_id BIGINT REFERENCES devices(id) ON DELETE SET NULL,
  service TEXT NOT NULL,
  symptom TEXT,
  location TEXT,
  urgency TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  lang TEXT NOT NULL DEFAULT 'uk',
  terms_accepted BOOLEAN NOT NULL DEFAULT false,
  telegram_notified BOOLEAN NOT NULL DEFAULT false,
  telegram_card_finalized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Сообщения диалога
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'manager')),
  text TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'automation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Вложения (фото/видео)
CREATE TABLE IF NOT EXISTS attachments (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  message_id BIGINT REFERENCES messages(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  mime_type TEXT,
  size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- История статусов
CREATE TABLE IF NOT EXISTS request_status_history (
  id BIGSERIAL PRIMARY KEY,
  request_id BIGINT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  note TEXT,
  changed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Технические события (ошибки LLM, Telegram, сервера)
CREATE TABLE IF NOT EXISTS technical_events (
  id BIGSERIAL PRIMARY KEY,
  event_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info',
  message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Связь сообщений Telegram с заявками для ручного диалога
CREATE TABLE IF NOT EXISTS telegram_message_links (
  request_id BIGINT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  telegram_message_id BIGINT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('request', 'client', 'manager')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (chat_id, telegram_message_id)
);

-- Отдельный реестр основных карточек заявок в Telegram
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

CREATE INDEX IF NOT EXISTS idx_requests_client ON requests(client_id);
CREATE INDEX IF NOT EXISTS idx_requests_token ON requests(token);
CREATE INDEX IF NOT EXISTS idx_messages_request ON messages(request_id);
CREATE INDEX IF NOT EXISTS idx_status_history_request ON request_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_clients_phone ON clients(phone);
CREATE INDEX IF NOT EXISTS idx_telegram_links_request ON telegram_message_links(request_id);
CREATE INDEX IF NOT EXISTS idx_telegram_cards_state ON telegram_cards(state);
