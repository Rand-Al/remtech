const leadForm = document.querySelector("[data-lead-form]");
const statusBox = document.querySelector("[data-form-status]");

function formatLead(data) {
  return [
    `Техника: ${data.appliance || "-"}`,
    `Марка: ${data.brand || "-"}`,
    `Модель: ${data.model || "-"}`,
    `Проблема: ${data.problem || "-"}`,
    `Адрес/район: ${data.location || "-"}`,
    `Срочность: ${data.urgency || "-"}`,
    `Телефон: ${data.phone || "-"}`,
    `Мессенджер: ${data.messenger || "-"}`,
    `Согласие на платную диагностику: ${data.paidDiagnostic ? "да" : "нет"}`
  ].join("\n");
}

if (leadForm) {
  leadForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const formData = new FormData(leadForm);
    const payload = Object.fromEntries(formData.entries());
    payload.paidDiagnostic = formData.get("paidDiagnostic") === "on";

    if (!payload.paidDiagnostic) {
      statusBox.textContent = "Пожалуйста, подтвердите условия выезда и диагностики перед отправкой заявки.";
      return;
    }

    statusBox.textContent = "Отправляем заявку...";

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Lead endpoint failed");
      leadForm.reset();
      statusBox.textContent = "Заявка отправлена. Мастер свяжется с вами для уточнения деталей.";
    } catch (error) {
      const leads = JSON.parse(localStorage.getItem("pendingLeads") || "[]");
      leads.push({ ...payload, createdAt: new Date().toISOString(), text: formatLead(payload) });
      localStorage.setItem("pendingLeads", JSON.stringify(leads));
      statusBox.textContent = "Заявка сохранена. После подключения Telegram она будет отправляться автоматически.";
    }
  });
}

const chatLog = document.querySelector("[data-chat-log]");
const quickReplies = document.querySelector("[data-quick-replies]");
const chatInput = document.querySelector("[data-chat-input]");
const chatSend = document.querySelector("[data-chat-send]");

const chatState = {
  step: "appliance",
  data: {}
};

const steps = {
  appliance: {
    question: "Что нужно посмотреть?",
    key: "appliance",
    replies: ["Стиральная машина", "Котел", "Посудомоечная машина", "Телевизор", "Пылесос", "Другое"],
    next: "brand"
  },
  brand: {
    question: "Подскажите марку и модель, если знаете. Если нет, напишите: не знаю.",
    key: "brand",
    replies: [],
    next: "problem"
  },
  problem: {
    question: "Что именно произошло? Можно коротко: не включается, течет, шумит, ошибка на дисплее и так далее.",
    key: "problem",
    replies: [],
    next: "location"
  },
  location: {
    question: "Где вы находитесь: Бровары или ближайший населенный пункт?",
    key: "location",
    replies: ["Бровары", "Требухов", "Княжичи", "Калиновка", "Другое"],
    next: "urgency"
  },
  urgency: {
    question: "Насколько срочно нужен выезд?",
    key: "urgency",
    replies: ["Сегодня", "Завтра", "В течение недели", "Не срочно"],
    next: "diagnostic"
  },
  diagnostic: {
    question: "Для определения причины неисправности мастер проводит диагностику. Выезд и диагностика оплачиваются отдельно, а стоимость самого ремонта определяется после осмотра. Такой формат вам подходит?",
    key: "paidDiagnostic",
    replies: ["Да, подходит", "Нет, хочу цену сразу"],
    next: "contact"
  },
  contact: {
    question: "Напишите имя и телефон. Мастер свяжется с вами и уточнит удобное время.",
    key: "contact",
    replies: [],
    next: "done"
  }
};

function addBubble(text, type = "bot") {
  const bubble = document.createElement("div");
  bubble.className = `bubble ${type === "user" ? "user" : ""}`;
  bubble.textContent = text;
  chatLog.appendChild(bubble);
  chatLog.scrollTop = chatLog.scrollHeight;
}

function renderReplies(replies) {
  quickReplies.innerHTML = "";
  replies.forEach((reply) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = reply;
    button.addEventListener("click", () => handleChatAnswer(reply));
    quickReplies.appendChild(button);
  });
}

function askCurrentStep() {
  const current = steps[chatState.step];
  if (!current) return;
  addBubble(current.question);
  renderReplies(current.replies);
}

function handleChatAnswer(answer) {
  if (!answer.trim()) return;
  const current = steps[chatState.step];
  addBubble(answer, "user");

  if (chatState.step === "diagnostic" && answer.startsWith("Нет")) {
    addBubble("Понимаю. Точную причину и стоимость ремонта можно определить только после осмотра. Вы можете вернуться к заявке позже, если такой формат подойдет.");
    renderReplies([]);
    chatInput.value = "";
    return;
  }

  chatState.data[current.key] = answer;
  chatState.step = current.next;
  chatInput.value = "";

  if (chatState.step === "done") {
    addBubble("Спасибо. Теперь можно отправить заявку через форму выше, и мастер свяжется с вами для уточнения времени.");
    renderReplies([]);
    return;
  }

  askCurrentStep();
}

if (chatLog && quickReplies && chatInput && chatSend) {
  addBubble("Здравствуйте. Помогу быстро оформить обращение, чтобы мастер понял, какая техника требует осмотра.");
  askCurrentStep();

  chatSend.addEventListener("click", () => handleChatAnswer(chatInput.value));
  chatInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") handleChatAnswer(chatInput.value);
  });
}
