"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  TimewebCloudAIClient: () => TimewebCloudAIClient
});
module.exports = __toCommonJS(index_exports);

// src/completion-response.ts
var TimewebChatCompletion = class {
  constructor(rawResponse) {
    this.rawResponse = rawResponse;
  }
  /** Возвращает основной текст ответа */
  get text() {
    return this.rawResponse.choices[0]?.message?.content?.trim() || "";
  }
  /** Возвращает весь исходный ответ (для продвинутых сценариев) */
  get raw() {
    return this.rawResponse;
  }
  /** Возвращает количество использованных токенов */
  get usage() {
    return this.rawResponse.usage;
  }
};

// src/agent-instance.ts
var import_fs = require("fs");
var AgentInstance = class {
  constructor(client, agent_access_id) {
    this.client = client;
    this.agent_access_id = agent_access_id;
  }
  /**
   * Вызывает агента через упрощённый endpoint `/call`.
   */
  call(payload) {
    return this.client.call(this.agent_access_id, payload);
  }
  /**
   * OpenAI-совместимый чат. Возвращает удобную обёртку над ответом.
   */
  chatCompletions(payload) {
    return this.client.chatCompletions(this.agent_access_id, payload).then((raw) => new TimewebChatCompletion(raw));
  }
  /**
   * Получает список моделей, доступных для этого агента.
   */
  getModels() {
    return this.client.getModels(this.agent_access_id);
  }
  /**
   * Отправляет запрос с изображением и текстом.
   * Поддерживает Buffer, base64-строку или путь к файлу.
   */
  async chatWithImage(options) {
    const { text = "", image, mimeType, max_tokens, temperature } = options;
    let imageData;
    let detectedMimeType = mimeType;
    if (typeof image === "string") {
      if (image.startsWith("data:") || image.includes(";base64,")) {
        imageData = image;
      } else {
        const buffer = (0, import_fs.readFileSync)(image);
        detectedMimeType ||= this.detectMimeTypeFromBuffer(buffer);
        imageData = `data:${detectedMimeType};base64,${buffer.toString(
          "base64"
        )}`;
      }
    } else {
      detectedMimeType ||= this.detectMimeTypeFromBuffer(image);
      imageData = `data:${detectedMimeType};base64,${image.toString("base64")}`;
    }
    const payload = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text },
            { type: "image_url", image_url: { url: imageData } }
          ]
        }
      ],
      max_tokens,
      temperature
    };
    const rawResponse = await this.client.chatCompletions(
      this.agent_access_id,
      payload
    );
    return new TimewebChatCompletion(rawResponse);
  }
  /**
   * Отправляет запрос с аудио (WAV, 16kHz, mono) и текстом.
   * Ожидается base64-кодированная строка в формате WAV.
   */
  async chatWithAudio(options) {
    const {
      text = "\u0420\u0430\u0441\u0448\u0438\u0444\u0440\u0443\u0439 \u0430\u0443\u0434\u0438\u043E.",
      audio,
      max_tokens,
      temperature
    } = options;
    const payload = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text },
            {
              type: "input_audio",
              input_audio: { base64Audio: audio, format: "wav" }
            }
          ]
        }
      ],
      max_tokens,
      temperature
    };
    const rawResponse = await this.client.chatCompletions(
      this.agent_access_id,
      payload
    );
    return new TimewebChatCompletion(rawResponse);
  }
  /**
   * Определяет MIME-тип изображения по сигнатуре буфера.
   */
  detectMimeTypeFromBuffer(buffer) {
    if (buffer[0] === 255 && buffer[1] === 216) return "image/jpeg";
    if (buffer[0] === 137 && buffer.toString("ascii", 0, 4) === "\x89PNG")
      return "image/png";
    return "image/jpeg";
  }
};

// src/client.ts
var BASE_URL = "https://agent.timeweb.cloud/api/v1/cloud-ai";
var TimewebAPIError = class extends Error {
  constructor(status, body, message) {
    super(message);
    this.status = status;
    this.body = body;
    this.name = "TimewebAPIError";
  }
};
var TimewebCloudAIClient = class {
  accessToken;
  proxySource;
  constructor(options) {
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
  async request(method, path, { params, data, agent_access_id } = {}) {
    if (!agent_access_id) {
      throw new Error("agent_access_id is required for all requests");
    }
    const url = new URL(`${BASE_URL}/agents/${agent_access_id}${path}`);
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        url.searchParams.set(k, String(v));
      });
    }
    const headers = {
      Authorization: `Bearer ${this.accessToken}`,
      "x-proxy-source": this.proxySource,
      "Content-Type": "application/json"
    };
    const config = { method, headers };
    if (data !== void 0) {
      config.body = JSON.stringify(data);
    }
    let response;
    try {
      response = await fetch(url.toString(), config);
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
    let text;
    try {
      text = await response.text();
    } catch {
      throw new Error("Failed to read response body");
    }
    if (!response.ok) {
      let jsonBody;
      try {
        jsonBody = text ? JSON.parse(text) : {};
      } catch {
        jsonBody = { raw: text };
      }
      const message = `Timeweb API error ${response.status}: ${text || "no response body"}`;
      throw new TimewebAPIError(response.status, jsonBody, message);
    }
    try {
      return text ? JSON.parse(text) : {};
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
  call(agent_access_id, payload) {
    return this.request("POST", "/call", { agent_access_id, data: payload });
  }
  /**
   * OpenAI-совместимый endpoint для генерации чата.
   * @param agent_access_id Уникальный ID агента
   * @param payload Запрос в формате OpenAI Chat Completions
   * @returns Ответ в формате OpenAI
   */
  chatCompletions(agent_access_id, payload) {
    return this.request("POST", "/v1/chat/completions", {
      agent_access_id,
      data: payload
    });
  }
  /**
   * Получает список моделей, доступных для агента.
   * @param agent_access_id Уникальный ID агента
   * @returns Список моделей
   */
  getModels(agent_access_id) {
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
  async getEmbedScript(agent_access_id, referer_domain = "", origin_domain = "", collapsed = true) {
    const url = new URL(`${BASE_URL}/agents/${agent_access_id}/embed.js`);
    url.searchParams.set("collapsed", String(collapsed));
    const response = await fetch(url.toString(), {
      headers: {
        referer: referer_domain,
        origin: origin_domain
      }
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
  agent(agent_access_id) {
    return new AgentInstance(this, agent_access_id);
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  TimewebCloudAIClient
});
//# sourceMappingURL=index.cjs.map