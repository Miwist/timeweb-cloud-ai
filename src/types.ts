export interface TimewebCloudAIClientOptions {
  accessToken: string;
  proxySource: string;
}

export interface RequestOptions {
  params?: Record<string, any>;
  data?: any;
  agent_access_id?: string;
}

export type ChatRole = "user" | "assistant" | "system";

export interface AgentResponse {
  id: string;
  message: string;
  finish_reason: Record<string, any>;
}

export interface ChatMessageDto {
  role: ChatRole;
  content:
    | string
    | Array<{
        type: "text" | "image_url" | "input_audio";
        text?: string;
        image_url?: { url: string };
        input_audio?: { base64Audio: string; format: "wav" | "mp3" };
      }>;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: ChatMessageDto[];
  temperature?: number;
  max_tokens?: number;
  max_completion_tokens?: number;
  stream?: boolean;
}

export interface CallAgentRequest {
  message?: string;
  parent_message_id?: string;
  file_ids?: string[];
}

/**
 * Ответ от OpenAI-совместимого endpoint `/v1/chat/completions`
 */
export interface ChatCompletionResponse {
  id: string;
  object: "chat.completion";
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: ChatRole;
      content: string;
    };
    finish_reason:
      | "stop"
      | "length"
      | "tool_calls"
      | "content_filter"
      | "function_call";
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  system_fingerprint?: string;
}

export interface ChatWithImageOptions {
  text?: string;
  image: Buffer | string;
  mimeType?: "image/jpeg" | "image/png" | "image/webp";
  max_tokens?: number;
  temperature?: number;
}

export interface ChatWithAudioOptions {
  text?: string;
  audio: string;
  max_tokens?: number;
  temperature?: number;
}
