import { ChatCompletionResponse } from "./types.js";

export class TimewebChatCompletion {
  constructor(private readonly rawResponse: ChatCompletionResponse) {}

  /** Возвращает основной текст ответа */
  get text(): string {
    return this.rawResponse.choices[0]?.message?.content?.trim() || "";
  }

  /** Возвращает весь исходный ответ (для продвинутых сценариев) */
  get raw(): ChatCompletionResponse {
    return this.rawResponse;
  }

  /** Возвращает количество использованных токенов */
  get usage() {
    return this.rawResponse.usage;
  }
}
