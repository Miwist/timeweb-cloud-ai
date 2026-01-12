interface TimewebCloudAIClientOptions {
    accessToken: string;
    proxySource: string;
}
interface AgentResponse {
    id: string;
    message: string;
    finish_reason: Record<string, any>;
}
interface ChatCompletionRequest {
    model?: string;
    messages: Array<{
        role: "user" | "assistant" | "system";
        content: string | Array<{
            type: string;
            [key: string]: any;
        }>;
    }>;
    temperature?: number;
    max_completion_tokens?: number;
    stream?: boolean;
    [key: string]: any;
}
interface CallAgentRequest {
    message?: string;
    parent_message_id?: string;
    file_ids?: string[];
}
/**
 * Ответ от OpenAI-совместимого endpoint `/v1/chat/completions`
 */
interface ChatCompletionResponse {
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
        finish_reason: "stop" | "length" | "tool_calls" | "content_filter" | "function_call";
    }>;
    usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    system_fingerprint?: string;
}

declare class AgentInstance {
    private readonly client;
    readonly agent_access_id: string;
    constructor(client: TimewebCloudAIClient, agent_access_id: string);
    call(payload: CallAgentRequest): Promise<AgentResponse>;
    chatCompletions(payload: ChatCompletionRequest): Promise<any>;
    getModels(): Promise<{
        object: "list";
        data: Array<{
            id: string;
        }>;
    }>;
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
declare class TimewebCloudAIClient {
    private readonly accessToken;
    private readonly proxySource;
    constructor(options: TimewebCloudAIClientOptions);
    /**
     * Внутренний метод для выполнения HTTP-запросов к API.
     * Не предназначен для прямого использования.
     */
    private request;
    /**
     * Вызывает агента с сообщением или файлами.
     * @param agent_access_id Уникальный ID агента (начинается с `agt_`)
     * @param payload Объект с сообщением и/или файлами
     * @returns Ответ от агента
     */
    call(agent_access_id: string, payload: CallAgentRequest): Promise<AgentResponse>;
    /**
     * OpenAI-совместимый endpoint для генерации чата.
     * @param agent_access_id Уникальный ID агента
     * @param payload Запрос в формате OpenAI Chat Completions
     * @returns Ответ в формате OpenAI
     */
    chatCompletions(agent_access_id: string, payload: ChatCompletionRequest): Promise<ChatCompletionResponse>;
    /**
     * Получает список моделей, доступных для агента.
     * @param agent_access_id Уникальный ID агента
     * @returns Список моделей
     */
    getModels(agent_access_id: string): Promise<{
        object: "list";
        data: Array<{
            id: string;
        }>;
    }>;
    /**
     * ⚠️ Этот метод работает ТОЛЬКО в браузерном окружении.
     * В Node.js он вызовет ошибку CORS или 403 из-за ограничений безопасности.
     *
     * Предназначен для получения JavaScript-кода виджета агента.
     *
     * @deprecated Рекомендуется использовать только на фронтенде.
     */
    getEmbedScript(agent_access_id: string, referer_domain?: string, origin_domain?: string, collapsed?: boolean): Promise<string>;
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
    agent(agent_access_id: string): AgentInstance;
}

export { type CallAgentRequest, type ChatCompletionRequest, TimewebCloudAIClient, type TimewebCloudAIClientOptions };
