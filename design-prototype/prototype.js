const LANG_CHOICE_KEY = 'remtech-lang-choice';

function getBrowserLanguage() {
  if (typeof navigator === 'undefined') return 'uk';
  const language = navigator.language || (navigator.languages && navigator.languages[0]) || '';
  return String(language).toLowerCase().startsWith('ru') ? 'ru' : 'uk';
}

function applyLanguageDetection() {
  const currentPath = window.location.pathname;
  const isRuPage = currentPath === '/ru/' || currentPath.startsWith('/ru/');

  let storedLangChoice = null;
  try {
    storedLangChoice = window.localStorage.getItem(LANG_CHOICE_KEY);
  } catch {
    return;
  }

  if (storedLangChoice) return;

  const detectedLang = getBrowserLanguage();
  if (detectedLang === 'ru' && !isRuPage) {
    const targetPath = currentPath === '/' ? '/ru/' : `/ru${currentPath}`;
    window.location.replace(targetPath);
  } else if (detectedLang === 'uk' && isRuPage) {
    const targetPath = currentPath === '/ru/' ? '/' : currentPath.replace(/^\/ru/, '');
    window.location.replace(targetPath);
  }
}

applyLanguageDetection();

const panel = document.querySelector('.chat-panel');
const chatBody = document.querySelector('[data-chat-body]');
const statusText = document.querySelector('[data-status]');
const statusWrap = document.querySelector('.manager-status');
const connection = document.querySelector('[data-connection]');
const quickActions = document.querySelector('[data-quick-actions]');
const compose = document.querySelector('.chat-compose');
const messageInput = document.querySelector('#chat-message');
const floatingChat = document.querySelector('.floating-chat');
const attachmentButton = document.querySelector('[data-attach]');
const attachmentInput = document.querySelector('#chat-attachment');
const siteHeader = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const mobileNav = document.querySelector('.mobile-nav');
const faqItems = [...document.querySelectorAll('.faq-item')];
const mobileChatMedia = window.matchMedia('(max-width: 760px)');
const mobileMenuMedia = window.matchMedia('(max-width: 1120px)');
const reduceMotionMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
const pageBackgroundElements = [
  document.querySelector('.site-header'),
  document.querySelector('main'),
  document.querySelector('.site-footer'),
  mobileNav,
  floatingChat
];

const pageLang = document.body.dataset.lang || 'uk';

const i18n = {
  uk: {
    statusOnline: 'онлайн',
    statusTyping: 'друкує...',
    statusConnecting: 'підключення...',
    managerConnected: 'Менеджер підключився',
    typingAria: 'Менеджер друкує',
    attachAdded: (name) => `Додано файл: ${name}`,
    initialThanks: 'Вітаю! Дякую за опис. Підкажіть, будь ласка, марку та модель техніки, якщо знаєте.',
    initialAskService: 'Вітаю! Підкажіть, будь ласка, яка техніка потребує ремонту?',
    serviceQuestions: {
      'boiler-repair': 'Вітаю! Розкажіть, будь ласка, що сталося з котлом?',
      'boiler-cleaning': 'Вітаю! Підкажіть, будь ласка, коли востаннє проводили обслуговування котла?',
      'boiler-installation': 'Вітаю! Котел потрібно встановити вперше чи замінити наявний?',
      washer: 'Вітаю! Підкажіть, будь ласка, що сталося з пральною машиною?',
      dishwasher: 'Вітаю! Підкажіть, будь ласка, що сталося з посудомийною машиною?',
      other: 'Вітаю! Підкажіть, будь ласка, яка техніка потребує ремонту і що з нею сталося?'
    },
    serviceChangeQuestions: {
      'boiler-repair': 'Зрозумів. Розкажіть, будь ласка, що сталося з котлом?',
      'boiler-cleaning': 'Добре. Підкажіть, будь ласка, коли востаннє проводили обслуговування котла?',
      'boiler-installation': 'Добре. Котел потрібно встановити вперше чи замінити наявний?',
      washer: 'Зрозумів. Підкажіть, будь ласка, що сталося з пральною машиною?',
      dishwasher: 'Зрозумів. Підкажіть, будь ласка, що сталося з посудомийною машиною?',
      other: 'Зрозумів. Підкажіть, будь ласка, яка техніка потребує ремонту і що з нею сталося?'
    },
    followUpQuestions: [
      'Дякую. Підкажіть, будь ласка, марку та модель техніки, якщо знаєте.',
      'Де ви знаходитеся: у Броварах чи в іншому населеному пункті району?',
      'Наскільки терміново потрібен виїзд?',
      'За можливості додайте фото або коротке відео несправності.'
    ],
    menuOpen: 'Відкрити меню',
    menuClose: 'Закрити меню',
    menuTitleOpen: 'Меню',
    menuTitleClose: 'Закрити меню'
  },
  ru: {
    statusOnline: 'онлайн',
    statusTyping: 'печатает...',
    statusConnecting: 'подключение...',
    managerConnected: 'Менеджер подключился',
    typingAria: 'Менеджер печатает',
    attachAdded: (name) => `Добавлен файл: ${name}`,
    initialThanks: 'Здравствуйте! Спасибо за описание. Подскажите, пожалуйста, марку и модель техники, если знаете.',
    initialAskService: 'Здравствуйте! Подскажите, пожалуйста, какая техника нуждается в ремонте?',
    serviceQuestions: {
      'boiler-repair': 'Здравствуйте! Расскажите, пожалуйста, что случилось с котлом?',
      'boiler-cleaning': 'Здравствуйте! Подскажите, пожалуйста, когда в последний раз проводили обслуживание котла?',
      'boiler-installation': 'Здравствуйте! Котел нужно установить впервые или заменить имеющийся?',
      washer: 'Здравствуйте! Подскажите, пожалуйста, что случилось со стиральной машиной?',
      dishwasher: 'Здравствуйте! Подскажите, пожалуйста, что случилось с посудомоечной машиной?',
      other: 'Здравствуйте! Подскажите, пожалуйста, какая техника нуждается в ремонте и что с ней случилось?'
    },
    serviceChangeQuestions: {
      'boiler-repair': 'Понял. Расскажите, пожалуйста, что случилось с котлом?',
      'boiler-cleaning': 'Хорошо. Подскажите, пожалуйста, когда в последний раз проводили обслуживание котла?',
      'boiler-installation': 'Хорошо. Котел нужно установить впервые или заменить имеющийся?',
      washer: 'Понял. Подскажите, пожалуйста, что случилось со стиральной машиной?',
      dishwasher: 'Понял. Подскажите, пожалуйста, что случилось с посудомоечной машиной?',
      other: 'Понял. Подскажите, пожалуйста, какая техника нуждается в ремонте и что с ней случилось?'
    },
    followUpQuestions: [
      'Спасибо. Подскажите, пожалуйста, марку и модель техники, если знаете.',
      'Где вы находитесь: в Броварах или в другом населенном пункте района?',
      'Насколько срочно нужен выезд?',
      'По возможности добавьте фото или короткое видео неисправности.'
    ],
    menuOpen: 'Открыть меню',
    menuClose: 'Закрыть меню',
    menuTitleOpen: 'Меню',
    menuTitleClose: 'Закрыть меню'
  }
};

const lang = i18n[pageLang] || i18n.uk;

const CONNECT_DELAY_MS = 3000;
const ONLINE_PAUSE_MS = 600;
const BASE_TYPING_DELAY_MS = 900;
const PER_WORD_DELAY_MS = 180;
const MIN_TYPING_DELAY_MS = 1600;
const MAX_TYPING_DELAY_MS = 6500;
const MENU_ANIMATION_MS = 220;
const FAQ_ANIMATION_MS = 260;
const HEADER_SCROLL_THRESHOLD = 12;
const CHAT_SESSION_KEY = 'remtech-chat-session-v4';
const pageDefaultService = document.body.dataset.defaultService || null;

let connectionState = 'idle';
let connectionStartedAt = null;
let selectedService = null;
let userMessageCount = 0;
let initialManagerMessageQueued = false;
let typingActive = false;
let managerQueue = [];
let startTimers = [];
let lastChatTrigger = null;
let activeManagerItem = null;
let activeTypingElement = null;
let activeTypingTimer = null;
let menuCloseTimer = null;
let mobileNavTargetOpen = false;
let headerScrollAnchorY = window.scrollY;
let headerScrollFrame = null;
let restoringChatSession = false;
const faqAnimations = new WeakMap();

const serviceQuestions = lang.serviceQuestions;
const serviceChangeQuestions = lang.serviceChangeQuestions;
const followUpQuestions = lang.followUpQuestions;

document.querySelectorAll('[data-demo-only], [data-demo-link]').forEach((section) => {
  const isLocalPrototype = ['localhost', '127.0.0.1'].includes(window.location.hostname);
  section.hidden = !isLocalPrototype;
});

function saveChatSession() {
  if (restoringChatSession) return;

  const pendingManagerItems = activeManagerItem
    ? [activeManagerItem, ...managerQueue]
    : [...managerQueue];

  const session = {
    connectionStarted: connectionState !== 'idle',
    connectionState,
    connectionStartedAt,
    selectedService,
    userMessageCount,
    initialManagerMessageQueued,
    panelOpen: panel.classList.contains('is-open'),
    quickActionsVisible: !quickActions.hidden,
    draft: messageInput.value,
    messages: [...chatBody.querySelectorAll('.message:not(.typing)')].map((message) => ({
      sender: message.classList.contains('client') ? 'client' : 'manager',
      text: message.textContent
    })),
    managerQueue: pendingManagerItems
  };

  try {
    window.sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(session));
  } catch {
    // The prototype continues without persistence if storage is unavailable.
  }
}

function restoreChatSession() {
  let session;

  try {
    session = JSON.parse(window.sessionStorage.getItem(CHAT_SESSION_KEY));
  } catch {
    return;
  }

  if (!session || typeof session !== 'object') return;

  restoringChatSession = true;
  selectedService = session.selectedService || null;
  userMessageCount = Number(session.userMessageCount) || 0;
  initialManagerMessageQueued = Boolean(session.initialManagerMessageQueued);
  managerQueue = Array.isArray(session.managerQueue) ? session.managerQueue : [];
  messageInput.value = typeof session.draft === 'string' ? session.draft : '';
  messageInput.style.height = messageInput.value ? `${Math.min(messageInput.scrollHeight, 110)}px` : '';
  quickActions.hidden = !session.quickActionsVisible;

  if (Array.isArray(session.messages)) {
    session.messages.forEach((message) => {
      if (!message || typeof message.text !== 'string') return;
      appendMessage(message.text, message.sender === 'client' ? 'client' : 'manager');
    });
  }

  if (session.connectionState === 'online' || (session.connectionStarted && !session.connectionState)) {
    connectionState = 'online';
    connection.textContent = lang.managerConnected;
    setManagerStatus(lang.statusOnline, true);
  } else if (session.connectionState === 'connecting') {
    const savedStartedAt = Number(session.connectionStartedAt);
    connectionStartedAt = Number.isFinite(savedStartedAt) ? savedStartedAt : Date.now();
    const elapsedTime = Math.max(0, Date.now() - connectionStartedAt);
    const remainingTime = Math.max(0, CONNECT_DELAY_MS - elapsedTime);

    connectionState = 'connecting';
    setManagerStatus(lang.statusConnecting, false);

    if (remainingTime === 0) {
      completeConnection();
    } else {
      scheduleConnectionCompletion(remainingTime);
    }
  }

  if (session.panelOpen) {
    panel.removeAttribute('inert');
    panel.classList.add('is-open');
    panel.setAttribute('aria-hidden', 'false');
  }

  restoringChatSession = false;
  updateFloatingChat();
  updateMobileChatMode();

  if (session.panelOpen && connectionState === 'idle') {
    beginConnection();
  } else if (connectionState === 'online' && !initialManagerMessageQueued) {
    queueInitialManagerMessage();
  } else {
    processManagerQueue();
  }
}

function appendMessage(text, sender = 'manager') {
  const message = document.createElement('p');
  message.className = `message ${sender}`;
  message.textContent = text;
  chatBody.appendChild(message);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function setManagerStatus(text, isOnline) {
  statusText.textContent = text;
  statusWrap.classList.toggle('is-online', isOnline);
}

function updateFloatingChat() {
  const panelOpen = panel.classList.contains('is-open');
  const shouldHide = panelOpen;
  floatingChat.classList.toggle('is-hidden', shouldHide);
  floatingChat.setAttribute('aria-hidden', String(shouldHide));
  floatingChat.tabIndex = shouldHide ? -1 : 0;
}

function updateMobileChatMode() {
  const isMobileModal = panel.classList.contains('is-open') && mobileChatMedia.matches;
  document.body.classList.toggle('chat-open', isMobileModal);
  panel.setAttribute('aria-modal', String(isMobileModal));

  pageBackgroundElements.forEach((element) => {
    if (isMobileModal) {
      element.setAttribute('inert', '');
    } else {
      element.removeAttribute('inert');
    }
  });
}

function clearTimers() {
  startTimers.forEach(window.clearTimeout);
  startTimers = [];
}

function cancelActiveManagerMessage() {
  if (!typingActive) return;

  if (activeTypingTimer) {
    window.clearTimeout(activeTypingTimer);
    startTimers = startTimers.filter((timer) => timer !== activeTypingTimer);
  }

  activeTypingElement?.remove();
  activeManagerItem = null;
  activeTypingElement = null;
  activeTypingTimer = null;
  typingActive = false;
  setManagerStatus(lang.statusOnline, true);
}

function getTypingDelay(text) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const calculatedDelay = BASE_TYPING_DELAY_MS + wordCount * PER_WORD_DELAY_MS;
  return Math.min(MAX_TYPING_DELAY_MS, Math.max(MIN_TYPING_DELAY_MS, calculatedDelay));
}

function getInitialManagerMessage() {
  if (userMessageCount > 0) {
    return lang.initialThanks;
  }

  return serviceQuestions[selectedService]
    || lang.initialAskService;
}

function processManagerQueue() {
  if (connectionState !== 'online' || typingActive || managerQueue.length === 0) return;

  const item = managerQueue.shift();
  activeManagerItem = item;
  typingActive = true;
  setManagerStatus(lang.statusTyping, true);

  const typing = document.createElement('div');
  activeTypingElement = typing;
  typing.className = 'message manager typing';
  typing.setAttribute('aria-label', lang.typingAria);
  typing.innerHTML = '<span></span><span></span><span></span>';
  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;

  activeTypingTimer = window.setTimeout(() => {
    typing.remove();
    appendMessage(item.text);
    if (item.showQuickActions) quickActions.hidden = false;
    activeManagerItem = null;
    activeTypingElement = null;
    activeTypingTimer = null;
    typingActive = false;
    setManagerStatus(lang.statusOnline, true);
    processManagerQueue();
    saveChatSession();
  }, getTypingDelay(item.text));
  startTimers.push(activeTypingTimer);
  saveChatSession();
}

function enqueueManagerMessage(text, options = {}) {
  const visibleMessages = [...chatBody.querySelectorAll('.message.manager:not(.typing)')];
  const lastVisibleText = visibleMessages.at(-1)?.textContent.trim();
  const alreadyQueued = managerQueue.some((item) => item.text === text);

  if (lastVisibleText === text || activeManagerItem?.text === text || alreadyQueued) return;

  managerQueue.push({ text, showQuickActions: Boolean(options.showQuickActions) });
  processManagerQueue();
  saveChatSession();
}

function queueInitialManagerMessage() {
  if (initialManagerMessageQueued) return;
  initialManagerMessageQueued = true;
  enqueueManagerMessage(getInitialManagerMessage(), {
    showQuickActions: !selectedService && userMessageCount === 0
  });
}

function completeConnection() {
  if (connectionState !== 'connecting') return;

  connectionState = 'online';
  connectionStartedAt = null;
  connection.textContent = lang.managerConnected;
  setManagerStatus(lang.statusOnline, true);
  startTimers.push(window.setTimeout(queueInitialManagerMessage, ONLINE_PAUSE_MS));
  saveChatSession();
}

function scheduleConnectionCompletion(delay) {
  startTimers.push(window.setTimeout(() => {
    completeConnection();
  }, delay));
}

function beginConnection() {
  if (connectionState !== 'idle') return;

  connectionState = 'connecting';
  connectionStartedAt = Date.now();
  setManagerStatus(lang.statusConnecting, false);
  saveChatSession();
  scheduleConnectionCompletion(CONNECT_DELAY_MS);
}

function setMenuButtonState(isOpen) {
  menuButton.classList.toggle('is-open', isOpen);
  menuButton.setAttribute('aria-expanded', String(isOpen));
  menuButton.setAttribute('aria-label', isOpen ? lang.menuClose : lang.menuOpen);
  menuButton.title = isOpen ? lang.menuTitleClose : lang.menuTitleOpen;
}

function setHeaderHidden(isHidden) {
  siteHeader.classList.toggle('is-hidden', isHidden);
}

function updateHeaderOnScroll() {
  const currentScrollY = Math.max(0, window.scrollY);
  const scrollDelta = currentScrollY - headerScrollAnchorY;

  if (currentScrollY <= HEADER_SCROLL_THRESHOLD) {
    setHeaderHidden(false);
    headerScrollAnchorY = currentScrollY;
    return;
  }

  if (Math.abs(scrollDelta) < HEADER_SCROLL_THRESHOLD) return;

  if (mobileNavTargetOpen) closeMobileNav();
  setHeaderHidden(scrollDelta > 0);
  headerScrollAnchorY = currentScrollY;
}

function openMobileNav() {
  window.clearTimeout(menuCloseTimer);
  mobileNavTargetOpen = true;
  mobileNav.hidden = false;
  mobileNav.removeAttribute('inert');
  mobileNav.setAttribute('aria-hidden', 'false');
  setMenuButtonState(true);

  window.requestAnimationFrame(() => {
    if (mobileNavTargetOpen) mobileNav.classList.add('is-open');
  });
}

function closeMobileNav({ immediate = false } = {}) {
  window.clearTimeout(menuCloseTimer);
  mobileNavTargetOpen = false;
  mobileNav.classList.remove('is-open');
  mobileNav.setAttribute('inert', '');
  mobileNav.setAttribute('aria-hidden', 'true');
  setMenuButtonState(false);

  if (immediate || reduceMotionMedia.matches) {
    mobileNav.hidden = true;
    return;
  }

  menuCloseTimer = window.setTimeout(() => {
    mobileNav.hidden = true;
  }, MENU_ANIMATION_MS);
}

function getFaqTargetState(item) {
  return faqAnimations.get(item)?.targetOpen ?? item.classList.contains('is-open');
}

function setFaqAccessibility(item, isOpen) {
  const summary = item.querySelector('.faq-summary');
  const answer = item.querySelector('.faq-answer');
  summary.setAttribute('aria-expanded', String(isOpen));
  answer.setAttribute('aria-hidden', String(!isOpen));
  answer.toggleAttribute('inert', !isOpen);
}

function setFaqOpen(item, targetOpen) {
  const summary = item.querySelector('.faq-summary');
  const answer = item.querySelector('.faq-answer');
  const runningState = faqAnimations.get(item);
  const interruptedHeight = runningState
    ? item.getBoundingClientRect().height
    : null;

  runningState?.animation.cancel();
  faqAnimations.delete(item);
  setFaqAccessibility(item, targetOpen);

  if (reduceMotionMedia.matches || typeof item.animate !== 'function') {
    item.classList.toggle('is-open', targetOpen);
    answer.hidden = !targetOpen;
    return;
  }

  const startHeight = interruptedHeight ?? item.getBoundingClientRect().height;
  if (targetOpen) answer.hidden = false;
  item.classList.toggle('is-open', targetOpen);
  const endHeight = targetOpen
    ? item.scrollHeight
    : summary.getBoundingClientRect().height;

  item.style.height = `${startHeight}px`;
  item.style.overflow = 'hidden';

  const animation = item.animate(
    { height: [`${startHeight}px`, `${endHeight}px`] },
    { duration: FAQ_ANIMATION_MS, easing: 'ease', fill: 'forwards' }
  );

  faqAnimations.set(item, { animation, targetOpen });

  const finish = () => {
    if (faqAnimations.get(item)?.animation !== animation) return;
    if (!targetOpen) answer.hidden = true;
    item.style.removeProperty('height');
    item.style.removeProperty('overflow');
    faqAnimations.delete(item);
    animation.cancel();
  };

  animation.addEventListener('finish', finish, { once: true });
  animation.addEventListener('cancel', () => {
    if (faqAnimations.get(item)?.animation !== animation) return;
    item.style.removeProperty('height');
    item.style.removeProperty('overflow');
    faqAnimations.delete(item);
  }, { once: true });
}

function toggleFaqItem(item) {
  const targetOpen = !getFaqTargetState(item);

  if (targetOpen) {
    faqItems.forEach((otherItem) => {
      if (otherItem !== item && getFaqTargetState(otherItem)) {
        setFaqOpen(otherItem, false);
      }
    });
  }

  setFaqOpen(item, targetOpen);
}

function openChat(options = {}, trigger = null) {
  const defaultService = !options.service
    && !selectedService
    && !initialManagerMessageQueued
    && userMessageCount === 0
    ? pageDefaultService
    : null;
  const nextService = options.service || defaultService;
  const serviceChanged = nextService && nextService !== selectedService;
  if (nextService) selectedService = nextService;
  if (trigger) lastChatTrigger = mobileNav.contains(trigger) ? menuButton : trigger;

  closeMobileNav();
  panel.removeAttribute('inert');
  panel.classList.add('is-open');
  panel.setAttribute('aria-hidden', 'false');
  updateFloatingChat();
  updateMobileChatMode();

  const canAskAboutNewService = serviceChanged
    && connectionState === 'online'
    && initialManagerMessageQueued;

  beginConnection();

  if (canAskAboutNewService) {
    quickActions.hidden = true;
    managerQueue = [];
    cancelActiveManagerMessage();
    enqueueManagerMessage(serviceChangeQuestions[selectedService]);
  }

  saveChatSession();
  window.setTimeout(() => messageInput.focus(), 120);
}

function closeChat({ restoreFocus = true } = {}) {
  panel.classList.remove('is-open');
  panel.setAttribute('aria-hidden', 'true');
  panel.setAttribute('inert', '');
  updateFloatingChat();
  updateMobileChatMode();
  saveChatSession();

  if (restoreFocus && lastChatTrigger?.isConnected && !lastChatTrigger.disabled) {
    window.setTimeout(() => lastChatTrigger.focus(), 0);
  }
}

document.querySelectorAll('[data-open-chat]').forEach((button) => {
  button.addEventListener('click', () => {
    openChat({ service: button.dataset.service || null }, button);
  });
});

document.querySelector('[data-close-chat]').addEventListener('click', () => closeChat());

menuButton.addEventListener('click', () => {
  if (mobileNavTargetOpen) {
    closeMobileNav();
  } else {
    openMobileNav();
  }
});

mobileChatMedia.addEventListener('change', updateMobileChatMode);
mobileMenuMedia.addEventListener('change', (event) => {
  if (!event.matches) closeMobileNav({ immediate: true });
});

mobileNav.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', closeMobileNav);
});

faqItems.forEach((item) => {
  const summary = item.querySelector('.faq-summary');
  const answer = item.querySelector('.faq-answer');
  const itemIndex = faqItems.indexOf(item) + 1;

  answer.id = `faq-answer-${itemIndex}`;
  summary.setAttribute('aria-controls', answer.id);
  setFaqAccessibility(item, item.classList.contains('is-open'));

  summary.addEventListener('click', () => {
    toggleFaqItem(item);
  });

  summary.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    toggleFaqItem(item);
  });
});

document.addEventListener('pointerdown', (event) => {
  const target = event.target instanceof Element ? event.target : null;
  if (!target) return;

  if (panel.classList.contains('is-open')
    && !panel.contains(target)
    && !target.closest('[data-open-chat]')) {
    closeChat({ restoreFocus: false });
  }

  if (mobileNavTargetOpen
    && !mobileNav.contains(target)
    && !menuButton.contains(target)) {
    closeMobileNav();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  if (panel.classList.contains('is-open')) closeChat();
  if (mobileNavTargetOpen) {
    closeMobileNav();
    menuButton.focus();
  }
});

window.addEventListener('scroll', () => {
  if (headerScrollFrame !== null) return;

  headerScrollFrame = window.requestAnimationFrame(() => {
    updateHeaderOnScroll();
    headerScrollFrame = null;
  });
}, { passive: true });

siteHeader.addEventListener('focusin', () => setHeaderHidden(false));

quickActions.querySelectorAll('button').forEach((button) => {
  button.addEventListener('click', () => {
    selectedService = button.dataset.service;
    quickActions.hidden = true;
    enqueueManagerMessage(serviceChangeQuestions[selectedService]);
    saveChatSession();
  });
});

compose.addEventListener('submit', (event) => {
  event.preventDefault();
  const text = messageInput.value.trim();
  if (!text) return;

  userMessageCount += 1;
  appendMessage(text, 'client');
  quickActions.hidden = true;
  messageInput.value = '';
  messageInput.style.height = '';
  messageInput.style.overflowY = 'hidden';

  if (connectionState === 'online' && initialManagerMessageQueued) {
    const followUp = followUpQuestions[Math.min(userMessageCount - 1, followUpQuestions.length - 1)];
    enqueueManagerMessage(followUp);
  }

  saveChatSession();
});

messageInput.addEventListener('input', () => {
  messageInput.style.height = 'auto';
  messageInput.style.height = `${Math.min(messageInput.scrollHeight, 110)}px`;
  messageInput.style.overflowY = messageInput.scrollHeight > 110 ? 'auto' : 'hidden';
  saveChatSession();
});

attachmentButton.addEventListener('click', () => attachmentInput.click());

attachmentInput.addEventListener('change', () => {
  [...attachmentInput.files].forEach((file) => {
    appendMessage(lang.attachAdded(file.name), 'client');
  });
  attachmentInput.value = '';
  saveChatSession();
});

const LANGUAGE_SCROLL_KEY = 'remtech-lang-scroll';

document.querySelectorAll('.language-switch a, .footer-language a').forEach((link) => {
  link.addEventListener('click', () => {
    try {
      window.sessionStorage.setItem(LANGUAGE_SCROLL_KEY, String(window.scrollY));
      const targetLang = link.getAttribute('href').includes('/ru') ? 'ru' : 'uk';
      window.localStorage.setItem(LANG_CHOICE_KEY, targetLang);
    } catch {
      // The prototype continues without persistence if storage is unavailable.
    }
  });
});

function restoreLanguageScroll() {
  let savedScrollY;

  try {
    savedScrollY = Number(window.sessionStorage.getItem(LANGUAGE_SCROLL_KEY)) || 0;
    window.sessionStorage.removeItem(LANGUAGE_SCROLL_KEY);
  } catch {
    return;
  }

  if (savedScrollY > 0) {
    window.scrollTo(0, savedScrollY);
  }
}

restoreChatSession();
restoreLanguageScroll();

window.addEventListener('beforeunload', () => {
  saveChatSession();
  clearTimers();
});
