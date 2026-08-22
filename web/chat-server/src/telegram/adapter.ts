export interface TelegramRequest {
  number: string;
  createdAt: string;
  service: string;
  device: string;
  deviceDetails: string;
  symptom: string;
  location: string;
  urgency: string;
  name: string;
  phone: string;
  lang: string;
  attachmentCount: number;
  termsAccepted: boolean;
  managerRequested: boolean;
}

export interface TelegramMessageReference {
  chatId: string;
  messageId: number;
  threadId?: number;
  warning?: string;
}

export interface TelegramManagerReply extends TelegramMessageReference {
  replyToMessageId: number;
  text: string;
  managerName: string;
}

export interface TelegramAdapter {
  readonly name: string;
  sendRequest(request: TelegramRequest): Promise<TelegramMessageReference | null>;
  updateRequestCard(
    request: TelegramRequest,
    chatId: string,
    messageId: number
  ): Promise<void>;
  sendClientMessage(
    requestNumber: string,
    text: string,
    target: TelegramMessageReference
  ): Promise<TelegramMessageReference | null>;
  sendManagerNotice(
    text: string,
    target: TelegramMessageReference
  ): Promise<TelegramMessageReference | null>;
  sendNotification(message: string): Promise<void>;
  startManagerReplyPolling(
    onReply: (reply: TelegramManagerReply) => Promise<void>,
    onError: (error: unknown) => Promise<void>
  ): () => void;
}
