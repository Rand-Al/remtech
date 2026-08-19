export interface TelegramRequest {
  number: string;
  service: string;
  device: string;
  symptom: string;
  location: string;
  urgency: string;
  name: string;
  phone: string;
  lang: string;
  attachmentCount: number;
}

export interface TelegramAdapter {
  readonly name: string;
  sendRequest(request: TelegramRequest): Promise<void>;
  sendNotification(message: string): Promise<void>;
}