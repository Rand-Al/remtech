export interface RequestFields {
  service: string;
  symptom?: string;
  location?: string;
  urgency?: string;
  deviceType?: string;
  deviceBrand?: string;
  deviceModel?: string;
  name?: string;
  phone?: string;
  lang: string;
  termsAccepted: boolean;
}

export interface StoredRequest {
  id: string;
  token: string;
  number: string;
  status: string;
}

export interface StoredMessage {
  id: string;
  sender: "client" | "manager";
  text: string;
}