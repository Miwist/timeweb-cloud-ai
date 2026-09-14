import { TimewebCloudAIClient } from "./client.js";
import {
  AgentResponse,
  CallAgentRequest,
  ChatCompletionRequest,
  GenerateImageOptions,
  GenerateImageResult,
  GeneratedImageAsset,
} from "./types.js";
import { TimewebChatCompletion } from "./completion-response.js";
import {
  dataUrlToBuffer,
  extractImagesFromText,
  guessMimeTypeFromUrl,
} from "./image-utils.js";
import { readFileSync } from "fs";
import { Buffer } from "buffer";

const DEFAULT_IMAGE_INSTRUCTION =
  "Сгенерируй изображение по описанию ниже. Верни картинку в ответе " +
  "(markdown ![](url) или прямую ссылку / data-URI). Без длинных пояснений.";

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
   * Генерация изображения через агента с включённой опцией
   * «Генерация изображений» в панели Timeweb.
   *
   * Важно: у OpenAI-совместимого API агента нет `/v1/images`.
   * Картинка приходит в тексте ответа (`/call`) как markdown/URL/data-URI.
   */
  async generateImage(
    options: GenerateImageOptions
  ): Promise<GenerateImageResult> {
    const prompt = options.prompt?.trim();
    if (!prompt) {
      throw new Error("prompt is required");
    }

    const instruction = (
      options.instruction || DEFAULT_IMAGE_INSTRUCTION
    ).trim();
    const raw = await this.call({
      message: `${instruction}\n\nОписание:\n${prompt}`,
    });

    const text = typeof raw.message === "string" ? raw.message : "";
    const extracted = extractImagesFromText(text);
    const shouldDownload = options.download !== false;

    const images: GeneratedImageAsset[] = [];
    for (const item of extracted) {
      const asset: GeneratedImageAsset = {
        url: item.url,
        kind: item.kind,
        alt: item.alt,
        mimeType: guessMimeTypeFromUrl(item.url),
      };

      if (shouldDownload) {
        try {
          if (item.url.startsWith("data:")) {
            const decoded = dataUrlToBuffer(item.url);
            asset.buffer = decoded.buffer;
            asset.mimeType = decoded.mimeType;
          } else {
            const downloaded = await this.downloadImage(item.url);
            asset.buffer = downloaded.buffer;
            asset.mimeType = downloaded.mimeType || asset.mimeType;
          }
        } catch {
          // URL оставляем даже если скачать не удалось
        }
      }

      images.push(asset);
    }

    return { text, images, raw };
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
        imageData = image;
      } else {
        const buffer = readFileSync(image);
        detectedMimeType ||= this.detectMimeTypeFromBuffer(buffer);
        imageData = `data:${detectedMimeType};base64,${buffer.toString(
          "base64"
        )}`;
      }
    } else {
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

  private async downloadImage(
    url: string
  ): Promise<{ buffer: Buffer; mimeType?: string }> {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to download image (${response.status})`);
    }
    const mimeType = response.headers.get("content-type") || undefined;
    const arrayBuffer = await response.arrayBuffer();
    return { buffer: Buffer.from(arrayBuffer), mimeType };
  }

  private detectMimeTypeFromBuffer(
    buffer: Buffer
  ): "image/jpeg" | "image/png" | "image/webp" {
    if (buffer.length < 4) return "image/jpeg";
    if (buffer[0] === 0xff && buffer[1] === 0xd8) return "image/jpeg";
    if (buffer[0] === 0x89 && buffer.toString("ascii", 0, 4) === "\x89PNG")
      return "image/png";
    if (
      buffer.length >= 12 &&
      buffer.toString("ascii", 0, 4) === "RIFF" &&
      buffer.toString("ascii", 8, 12) === "WEBP"
    ) {
      return "image/webp";
    }
    return "image/jpeg";
  }
}
