import { AgentInstance } from "./agent-instance.js";
import {
  TimewebCloudAIClientOptions,
  RequestOptions,
  AgentResponse,
  ChatCompletionRequest,
  CallAgentRequest,
  ChatCompletionResponse,
} from "./types.js";

/**
 * Базовый URL API Timeweb Cloud AI.
 * @see https://agent.timeweb.cloud/docs
 */
const BASE_URL = "https://agent.timeweb.cloud/api/v1/cloud-ai";

/**
 * Кастомная ошибка для API Timeweb Cloud
 */
export class TimewebAPIError extends Error {
  constructor(
    public readonly status: number,
    public readonly body: unknown,
    message: string
  ) {
    super(message);
    this.name = "TimewebAPIError";
  }
}

/**
 * Основной клиент для работы с Timeweb Cloud AI API.
 *
 * Требует токен доступа и уникальный идентификатор источника (`x-proxy-source`).
 *
 * @example
 * ```ts
 * const client = new TimewebCloudAIClient({
 *   accessToken: 'your_token',
 *   proxySource: 'my-app'
 * });
 *
 * // Или через агент-специфичный интерфейс:
 * const agent = client.agent('agt_xxx');
 * const res = await agent.call({ message: 'Привет!' });
 * ```
 */
export class TimewebCloudAIClient {
  private readonly accessToken: string;
  private readonly proxySource: string;

  constructor(options: TimewebCloudAIClientOptions) {
    if (!options.accessToken) {
      throw new Error("accessToken is required");
    }
    if (!options.proxySource) {
      throw new Error("proxySource is required");
    }
    this.accessToken = options.accessToken;
    this.proxySource = options.proxySource;
  }

  /**
   * Внутренний метод для выполнения HTTP-запросов к API.
   * Не предназначен для прямого использования.
   */
  private async request<T>(
    method: string,
    path: string,
    { params, data, agent_access_id }: RequestOptions = {}
  ): Promise<T> {
    if (!agent_access_id) {
      throw new Error("agent_access_id is required for all requests");
    }

    const url = new URL(`${BASE_URL}/agents/${agent_access_id}${path}`);

    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        url.searchParams.set(k, String(v));
      });
    }

    const headers: HeadersInit = {
      Authorization: `Bearer ${this.accessToken}`,
      "x-proxy-source": this.proxySource,
      "Content-Type": "application/json",
    };

    const config: RequestInit = { method, headers };
    if (data !== undefined) {
      config.body = JSON.stringify(data);
    }

    let response: Response;
    try {
      response = await fetch(url.toString(), config);
    } catch (error) {
      throw new Error(`Network error: ${(error as Error).message}`);
    }

    let text: string;
    try {
      text = await response.text();
    } catch {
      throw new Error("Failed to read response body");
    }

    if (!response.ok) {
      let jsonBody: unknown;
      try {
        jsonBody = text ? JSON.parse(text) : {};
      } catch {
        jsonBody = { raw: text };
      }
      const message = `Timeweb API error ${response.status}: ${
        text || "no response body"
      }`;
      throw new TimewebAPIError(response.status, jsonBody, message);
    }

    try {
      return text ? JSON.parse(text) : ({} as T);
    } catch {
      throw new Error("Invalid JSON response from Timeweb API");
    }
  }

  /**
   * Вызывает агента с сообщением или файлами.
   * @param agent_access_id Уникальный ID агента (начинается с `agt_`)
   * @param payload Объект с сообщением и/или файлами
   * @returns Ответ от агента
   */
  call(
    agent_access_id: string,
    payload: CallAgentRequest
  ): Promise<AgentResponse> {
    return this.request("POST", "/call", { agent_access_id, data: payload });
  }

  /**
   * OpenAI-совместимый endpoint для генерации чата.
   * @param agent_access_id Уникальный ID агента
   * @param payload Запрос в формате OpenAI Chat Completions
   * @returns Ответ в формате OpenAI
   */
  chatCompletions(
    agent_access_id: string,
    payload: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    return this.request("POST", "/v1/chat/completions", {
      agent_access_id,
      data: payload,
    });
  }

  /**
   * Получает список моделей, доступных для агента.
   * @param agent_access_id Уникальный ID агента
   * @returns Список моделей
   */
  getModels(
    agent_access_id: string
  ): Promise<{ object: "list"; data: Array<{ id: string }> }> {
    return this.request("GET", "/v1/models", { agent_access_id });
  }

  /**
   * ⚠️ Этот метод работает ТОЛЬКО в браузерном окружении.
   * В Node.js он вызовет ошибку CORS или 403 из-за ограничений безопасности.
   *
   * Предназначен для получения JavaScript-кода виджета агента.
   *
   * @deprecated Рекомендуется использовать только на фронтенде.
   */
  async getEmbedScript(
    agent_access_id: string,
    referer_domain: string = "",
    origin_domain: string = "",
    collapsed: boolean = true
  ): Promise<string> {
    const url = new URL(`${BASE_URL}/agents/${agent_access_id}/embed.js`);
    url.searchParams.set("collapsed", String(collapsed));

    const response = await fetch(url.toString(), {
      headers: {
        referer: referer_domain,
        origin: origin_domain,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch embed script (${response.status})`);
    }

    return await response.text();
  }

  /**
   * Создаёт привязанный к конкретному агенту экземпляр для удобной работы
   * без необходимости передавать `agent_access_id` в каждый вызов.
   *
   * @example
   * ```ts
   * const client = new TimewebCloudAIClient({ accessToken: '...', proxySource: 'my-app' });
   * const agent = client.agent('agt_xxx');
   * const response = await agent.call({ message: 'Привет!' });
   * ```
   *
   * @param agent_access_id Уникальный идентификатор агента (начинается с `agt_`)
   * @returns Экземпляр {@link AgentInstance}, привязанный к указанному агенту
   */
  agent(agent_access_id: string): AgentInstance {
    return new AgentInstance(this, agent_access_id);
  }
}
