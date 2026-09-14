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

export interface GenerateImageOptions {
  /** Текстовое описание картинки */
  prompt: string;
  /**
   * Если true (по умолчанию) — скачивает первую найденную картинку в Buffer.
   * Для data: URL декодирует base64 без сети.
   */
  download?: boolean;
  /**
   * Доп. инструкция агенту. По умолчанию просим вернуть картинку
   * (markdown/URL) без лишнего текста.
   */
  instruction?: string;
}

export interface GeneratedImageAsset {
  url: string;
  kind: "markdown" | "html" | "data" | "bare_url";
  alt?: string;
  mimeType?: string;
  buffer?: Buffer;
}

export interface GenerateImageResult {
  text: string;
  images: GeneratedImageAsset[];
  raw: AgentResponse;
}

export interface ImagesGenerationsRequest {
  model: string;
  prompt: string;
  n?: number;
  size?: string;
  quality?: string;
  style?: string;
  response_format?: "url" | "b64_json";
  user?: string;
}

export interface ImagesGenerationsResponse {
  created: number;
  data: Array<{
    url?: string;
    b64_json?: string;
    revised_prompt?: string;
  }>;
}
