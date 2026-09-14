import { TimewebAPIError } from "./client.js";
import {
  ChatCompletionRequest,
  ChatCompletionResponse,
  ImagesGenerationsRequest,
  ImagesGenerationsResponse,
} from "./types.js";

const DEFAULT_GATEWAY_BASE = "https://api.timeweb.ai/v1";

export interface TimewebAIGatewayClientOptions {
  /** API-ключ из раздела AI Gateway (не путать с токеном агентов). */
  apiKey: string;
  baseUrl?: string;
}

/**
 * Клиент AI Gateway Timeweb (`https://api.timeweb.ai/v1`).
 * Работает с моделями напрямую, без агента / RAG.
 */
export class TimewebAIGatewayClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(options: TimewebAIGatewayClientOptions) {
    if (!options.apiKey) {
      throw new Error("apiKey is required");
    }
    this.apiKey = options.apiKey;
    this.baseUrl = (options.baseUrl || DEFAULT_GATEWAY_BASE).replace(/\/$/, "");
  }

  private async request<T>(
    method: string,
    path: string,
    data?: unknown
  ): Promise<T> {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.apiKey}`,
      "Content-Type": "application/json",
    };

    let response: Response;
    try {
      response = await fetch(url, {
        method,
        headers,
        body: data === undefined ? undefined : JSON.stringify(data),
      });
    } catch (error) {
      throw new Error(`Network error: ${(error as Error).message}`);
    }

    const text = await response.text().catch(() => "");
    if (!response.ok) {
      let jsonBody: unknown;
      try {
        jsonBody = text ? JSON.parse(text) : {};
      } catch {
        jsonBody = { raw: text };
      }
      throw new TimewebAPIError(
        response.status,
        jsonBody,
        `Timeweb AI Gateway error ${response.status}: ${text || "no body"}`
      );
    }

    try {
      return text ? (JSON.parse(text) as T) : ({} as T);
    } catch {
      throw new Error("Invalid JSON response from Timeweb AI Gateway");
    }
  }

  chatCompletions(
    payload: ChatCompletionRequest & { model: string }
  ): Promise<ChatCompletionResponse> {
    return this.request("POST", "/chat/completions", payload);
  }

  /**
   * OpenAI-совместимая генерация изображений.
   * Доступность зависит от модели в AI Gateway.
   */
  imagesGenerations(
    payload: ImagesGenerationsRequest
  ): Promise<ImagesGenerationsResponse> {
    return this.request("POST", "/images/generations", payload);
  }

  listModels(): Promise<{ object: "list"; data: Array<{ id: string }> }> {
    return this.request("GET", "/models");
  }
}
