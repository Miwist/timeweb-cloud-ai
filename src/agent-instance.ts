import { TimewebCloudAIClient } from "./client.js";
import {
  AgentResponse,
  CallAgentRequest,
  ChatCompletionRequest,
} from "./types.js";
import { TimewebChatCompletion } from "./completion-response.js";
import { readFileSync } from "fs";
import { Buffer } from "buffer";

export class AgentInstance {
  constructor(
    private readonly client: TimewebCloudAIClient,
    public readonly agent_access_id: string
  ) {}

  /**
   * Вызывает агента через упрощённый endpoint `/call`.
   */
  call(payload: CallAgentRequest): Promise<AgentResponse> {
    return this.client.call(this.agent_access_id, payload);
  }

  /**
   * OpenAI-совместимый чат. Возвращает удобную обёртку над ответом.
   */
  chatCompletions(
    payload: ChatCompletionRequest
  ): Promise<TimewebChatCompletion> {
    return this.client
      .chatCompletions(this.agent_access_id, payload)
      .then((raw) => new TimewebChatCompletion(raw));
  }

  /**
   * Получает список моделей, доступных для этого агента.
   */
  getModels(): Promise<{ object: "list"; data: Array<{ id: string }> }> {
    return this.client.getModels(this.agent_access_id);
  }

  /**
   * Отправляет запрос с изображением и текстом.
   * Поддерживает Buffer, base64-строку или путь к файлу.
   */
  async chatWithImage(options: {
    text?: string;
    image: Buffer | string;
    mimeType?: "image/jpeg" | "image/png" | "image/webp";
    max_tokens?: number;
    temperature?: number;
  }): Promise<TimewebChatCompletion> {
    const { text = "", image, mimeType, max_tokens, temperature } = options;

    let imageData: string;
    let detectedMimeType = mimeType;

    if (typeof image === "string") {
      if (image.startsWith("data:") || image.includes(";base64,")) {
        // Уже data URL
        imageData = image;
      } else {
        // Считаем, что это путь к файлу
        const buffer = readFileSync(image);
        detectedMimeType ||= this.detectMimeTypeFromBuffer(buffer);
        imageData = `data:${detectedMimeType};base64,${buffer.toString(
          "base64"
        )}`;
      }
    } else {
      // Buffer
      detectedMimeType ||= this.detectMimeTypeFromBuffer(image);
      imageData = `data:${detectedMimeType};base64,${image.toString("base64")}`;
    }

    const payload: ChatCompletionRequest = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text },
            { type: "image_url", image_url: { url: imageData } },
          ],
        },
      ],
      max_tokens,
      temperature,
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
  async chatWithAudio(options: {
    text?: string;
    audio: string;
    max_tokens?: number;
    temperature?: number;
  }): Promise<TimewebChatCompletion> {
    const {
      text = "Расшифруй аудио.",
      audio,
      max_tokens,
      temperature,
    } = options;

    const payload: ChatCompletionRequest = {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text },
            {
              type: "input_audio",
              input_audio: { base64Audio: audio, format: "wav" },
            },
          ],
        },
      ],
      max_tokens,
      temperature,
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
  private detectMimeTypeFromBuffer(buffer: Buffer): "image/jpeg" | "image/png" {
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
    if (buffer[0] === 0x89 && buffer.toString("ascii", 0, 4) === "\x89PNG")
      return "image/png";
    return "image/jpeg";
  }
}
