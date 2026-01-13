import { Buffer } from 'buffer';

interface TimewebCloudAIClientOptions {
    accessToken: string;
    proxySource: string;
}
type ChatRole = "user" | "assistant" | "system";
interface AgentResponse {
    id: string;
    message: string;
    finish_reason: Record<string, any>;
}
interface ChatMessageDto {
    role: ChatRole;
    content: string | Array<{
        type: "text" | "image_url" | "input_audio";
        text?: string;
        image_url?: {
            url: string;
        };
        input_audio?: {
            base64Audio: string;
            format: "wav" | "mp3";
        };
    }>;
}
interface ChatCompletionRequest {
    model?: string;
    messages: ChatMessageDto[];
    temperature?: number;
    max_tokens?: number;
    max_completion_tokens?: number;
    stream?: boolean;
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
            role: ChatRole;
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

declare class TimewebChatCompletion {
    private readonly rawResponse;
    constructor(rawResponse: ChatCompletionResponse);
    /** Возвращает основной текст ответа */
    get text(): string;
    /** Возвращает весь исходный ответ (для продвинутых сценариев) */
    get raw(): ChatCompletionResponse;
    /** Возвращает количество использованных токенов */
    get usage(): {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    } | undefined;
}

declare class AgentInstance {
    private readonly client;
    readonly agent_access_id: string;
    constructor(client: TimewebCloudAIClient, agent_access_id: string);
    /**
     * Вызывает агента через упрощённый endpoint `/call`.
     */
    call(payload: CallAgentRequest): Promise<AgentResponse>;
    /**
     * OpenAI-совместимый чат. Возвращает удобную обёртку над ответом.
     */
    chatCompletions(payload: ChatCompletionRequest): Promise<TimewebChatCompletion>;
    /**
     * Получает список моделей, доступных для этого агента.
     */
    getModels(): Promise<{
        object: "list";
        data: Array<{
            id: string;
        }>;
    }>;
    /**
     * Отправляет запрос с изображением и текстом.
     * Поддерживает Buffer, base64-строку или путь к файлу.
     */
    chatWithImage(options: {
        text?: string;
        image: Buffer | string;
        mimeType?: "image/jpeg" | "image/png" | "image/webp";
        max_tokens?: number;
        temperature?: number;
    }): Promise<TimewebChatCompletion>;
    /**
     * Отправляет запрос с аудио (WAV, 16kHz, mono) и текстом.
     * Ожидается base64-кодированная строка в формате WAV.
     */
    chatWithAudio(options: {
        text?: string;
        audio: string;
        max_tokens?: number;
        temperature?: number;
    }): Promise<TimewebChatCompletion>;
    /**
     * Определяет MIME-тип изображения по сигнатуре буфера.
     */
    private detectMimeTypeFromBuffer;
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
