export interface TimewebCloudAIClientOptions {
  accessToken: string;
  proxySource: string;
}

export interface RequestOptions {
  params?: Record<string, any>;
  data?: any;
  agent_access_id?: string;
}

export interface AgentResponse {
  id: string;
  message: string;
  finish_reason: Record<string, any>;
}

export interface ChatCompletionRequest {
  model?: string;
  messages: Array<{
    role: "user" | "assistant" | "system";
    content: string | Array<{ type: string; [key: string]: any }>;
  }>;
  temperature?: number;
  max_completion_tokens?: number;
  stream?: boolean;
  [key: string]: any;
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
      role: "assistant" | "user" | "system";
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
