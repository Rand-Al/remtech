export type Role = "system" | "user" | "assistant";

export interface ChatMessage {
  role: Role;
  content: string;
}

export interface LlmResponse {
  content: string;
  model?: string;
}

export interface LlmAdapter {
  readonly name: string;
  chat(messages: ChatMessage[]): Promise<LlmResponse>;
}
