import assert from "node:assert/strict";
import test from "node:test";
import { OpenAiCompatibleLlmAdapter } from "./openai.js";

type RecordedRequest = { model?: string };

function completionResponse(model: string, content: string): Response {
  return new Response(
    JSON.stringify({
      model,
      choices: [{ message: { content } }],
    }),
    { status: 200 }
  );
}

test("moves to a fallback model when the primary one times out", async () => {
  const requests: RecordedRequest[] = [];
  const adapter = new OpenAiCompatibleLlmAdapter({
    baseUrl: "https://llm.example/v1",
    model: "primary-model",
    fallbackModels: ["backup-model"],
    attemptTimeoutMs: 120,
    timeoutMs: 5_000,
    fetchImpl: (_input, init) => {
      const body = JSON.parse(String(init?.body)) as RecordedRequest;
      requests.push(body);
      if (body.model === "primary-model") {
        return new Promise((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("Aborted", "AbortError"))
          );
        });
      }
      return Promise.resolve(completionResponse("backup-model", "Ответ резервной модели"));
    },
  });

  const response = await adapter.chat([{ role: "user", content: "тест" }]);

  assert.equal(response.content, "Ответ резервной модели");
  assert.deepEqual(
    requests.map((request) => request.model),
    ["primary-model", "backup-model"]
  );
});

test("moves to a fallback model after a server error", async () => {
  const adapter = new OpenAiCompatibleLlmAdapter({
    baseUrl: "https://llm.example/v1",
    model: "primary-model",
    fallbackModels: ["backup-model"],
    attemptTimeoutMs: 1_000,
    timeoutMs: 5_000,
    fetchImpl: async (input, init) => {
      const body = JSON.parse(String(init?.body)) as RecordedRequest;
      if (body.model === "primary-model") {
        return new Response(JSON.stringify({ error: "overloaded" }), { status: 503 });
      }
      return completionResponse("backup-model", "Ок");
    },
  });

  const response = await adapter.chat([{ role: "user", content: "тест" }]);

  assert.equal(response.content, "Ок");
});

test("throws when every model fails", async () => {
  const adapter = new OpenAiCompatibleLlmAdapter({
    baseUrl: "https://llm.example/v1",
    model: "primary-model",
    fallbackModels: ["backup-model"],
    attemptTimeoutMs: 1_000,
    timeoutMs: 5_000,
    fetchImpl: async () =>
      new Response(JSON.stringify({ error: "unavailable" }), { status: 500 }),
  });

  await assert.rejects(() => adapter.chat([{ role: "user", content: "тест" }]));
});
