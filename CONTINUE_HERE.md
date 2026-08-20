# RemTech: точка продолжения работы

Этот файл нужен для возобновления разработки на другом компьютере. Перед изменениями также обязательно прочитать `AGENTS.md` и `DEVELOPMENT_PLAN.md`.

## Где остановились

- Ветка: `main`.
- Репозиторий: `https://github.com/Rand-Al/remtech.git`.
- Пользователь выбрал следующий шаг: завершить Этап 1 подключением реальной локальной LLM через LM Studio.
- OpenAI-совместимый адаптер уже реализован в `web/chat-server/src/llm/openai.ts`.
- Выбор адаптера реализован в `web/chat-server/src/adapters.ts`: если задан `RT_LLM_BASE_URL`, используется реальный API; без переменной сервер продолжает использовать `StubLlmAdapter`.
- Конфигурационный шаблон находится в `web/chat-server/.env.example`.
- TypeScript-проверка адаптера прошла, но реальный запрос не проверен: в момент остановки LM Studio не был запущен, порт `1234` был закрыт.
- Telegram пока использует `StubTelegramAdapter`: заявки и технические уведомления выводятся в консоль, реальный Telegram-бот ещё не подключён.

Последние изменения интерфейса чата:

- точки `друкує...` теперь находятся после последнего сообщения и видны при каждом ответе;
- чат на компьютере закрывается кликом вне панели и клавишей Escape;
- на телефоне чат остаётся полноэкранным модальным окном;
- история клиента хранится в `sessionStorage` под ключом `remtech-chat-v1`.

## Важно о переносе на другой компьютер

GitHub содержит код, но не локальную PostgreSQL-базу и не данные браузера.

- На новом компьютере Docker создаст новую пустую базу.
- Старая переписка не появится в браузере: `sessionStorage` не синхронизируется между устройствами.
- Локальные `.env`-файлы не хранятся в Git и создаются заново.

## Первый запуск на новом компьютере

Требуются Git, Node.js, Docker Desktop и LM Studio.

```powershell
git clone https://github.com/Rand-Al/remtech.git
cd remtech
git checkout main
git pull
```

Установить зависимости:

```powershell
cd web
npm install
cd chat-server
npm install
cd ../..
```

Создать клиентскую конфигурацию сайта:

```powershell
Set-Content -Path web/.env.local -Value 'NEXT_PUBLIC_CHAT_SERVER_URL=http://localhost:4100'
```

Запустить PostgreSQL:

```powershell
cd web
docker compose up -d
docker compose ps
```

## Непосредственный следующий шаг: LM Studio

1. Сначала спросить у пользователя характеристики нового ноутбука: объём RAM, модель GPU и объём VRAM. Не выбирать тяжёлую модель без этих данных.
2. В LM Studio скачать и загрузить подходящую Instruct-модель.
3. В разделе Developer включить Local Server на порту `1234`.
4. Проверить доступность API:

```powershell
$models = Invoke-RestMethod http://localhost:1234/v1/models
$models.data
```

5. В отдельном PowerShell запустить чат-сервер с реальным адаптером. Идентификатор модели взять из результата предыдущей команды:

```powershell
cd remtech/web/chat-server
$env:RT_LLM_BASE_URL = 'http://localhost:1234/v1'
$env:RT_LLM_MODEL = '<ID МОДЕЛИ ИЗ /v1/models>'
$env:RT_LLM_TIMEOUT_MS = '120000'
npm run dev
```

6. Проверить, что заглушка отключена:

```powershell
Invoke-RestMethod http://localhost:4100/health
```

Поле `llm` должно иметь вид `openai-compatible:<имя-модели>`, а не `stub`.

7. В третьем PowerShell запустить сайт:

```powershell
cd remtech/web
npm run dev
```

Открыть `http://localhost:3000/`.

## Проверка реальной LLM

Проверять в браузере, а не только запросом к API:

1. Открыть чат на главной или странице котлов.
2. Отправить сообщение на украинском с описанием проблемы котла.
3. Убедиться, что ответ естественный, не повторяет заглушку и учитывает выбранную услугу.
4. Проверить запреты: модель не должна ставить диагноз, давать инструкции по разборке газового котла или обещать цену до осмотра.
5. Убедиться, что диалог сохранён в PostgreSQL:

```powershell
docker exec remtech-db psql -U remtech -d remtech -c "SELECT sender, text, created_at FROM messages ORDER BY id DESC LIMIT 10;"
```

## Проверка сбоя LLM

После успешного ответа остановить Local Server в LM Studio и отправить ещё одно сообщение.

Ожидаемое поведение:

- сообщение клиента остаётся в PostgreSQL;
- после трёх попыток клиент видит: `Дякуємо, повідомлення отримано. Менеджер відповість трохи пізніше.`;
- в `technical_events` появляются `llm_error` и `llm_failure`;
- `StubTelegramAdapter` выводит техническое уведомление в консоль чат-сервера.

Проверка событий:

```powershell
docker exec remtech-db psql -U remtech -d remtech -c "SELECT event_type, severity, message, created_at FROM technical_events ORDER BY id DESC LIMIT 10;"
```

Для быстрой проверки сбоя чат-сервер можно временно перезапустить с `RT_LLM_TIMEOUT_MS=5000`. Не менять стандартные `120000` мс в коде без причины.

## После проверки

1. Прогнать `npm run typecheck` в `web/` и `web/chat-server/`.
2. Показать пользователю результат одного небольшого шага и спросить, оставляем ли выбранную модель.
3. Не начинать перенос остальных страниц или Этап 2 без подтверждения пользователя.
4. Следующая незакрытая интеграция Этапа 1 после LLM: реальный Telegram-адаптер. Для него понадобятся токен бота, закрытая группа и идентификаторы тем.
