export async function onRequestPost({ request, env }) {
  try {
    const lead = await request.json();

    if (!lead.paidDiagnostic) {
      return new Response(JSON.stringify({ error: "paid_diagnostic_required" }), { status: 400 });
    }

    const text = [
      "Новая заявка на ремонт техники",
      "",
      `Техника: ${lead.appliance || "-"}`,
      `Марка: ${lead.brand || "-"}`,
      `Модель: ${lead.model || "-"}`,
      `Проблема: ${lead.problem || "-"}`,
      `Адрес/район: ${lead.location || "-"}`,
      `Срочность: ${lead.urgency || "-"}`,
      `Телефон: ${lead.phone || "-"}`,
      `Мессенджер: ${lead.messenger || "-"}`,
      "Клиент согласился на платную диагностику: да"
    ].join("\n");

    if (!env.TELEGRAM_BOT_TOKEN || !env.TELEGRAM_CHAT_ID) {
      return new Response(JSON.stringify({ error: "telegram_env_missing" }), { status: 503 });
    }

    const response = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text
      })
    });

    if (!response.ok) {
      return new Response(JSON.stringify({ error: "telegram_failed" }), { status: 502 });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: "bad_request" }), { status: 400 });
  }
}
