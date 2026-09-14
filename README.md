# timeweb-cloud-ai

[![npm version](https://img.shields.io/npm/v/timeweb-cloud-ai?color=cb3837&logo=npm)](https://www.npmjs.com/package/timeweb-cloud-ai)
[![npm downloads](https://img.shields.io/npm/dm/timeweb-cloud-ai)](https://www.npmjs.com/package/timeweb-cloud-ai)
[![npm total downloads](https://img.shields.io/npm/dt/timeweb-cloud-ai)](https://www.npmjs.com/package/timeweb-cloud-ai)
[![CI](https://github.com/Miwist/timeweb-cloud-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Miwist/timeweb-cloud-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/timeweb-cloud-ai)](https://github.com/Miwist/timeweb-cloud-ai/blob/master/LICENSE)
[![Node.js](https://img.shields.io/node/v/timeweb-cloud-ai?logo=node.js)](https://nodejs.org/)

TypeScript/JavaScript-клиент для [Timeweb Cloud AI API](https://agent.timeweb.cloud/docs).
Поддерживает:
- вызовы агента через `/call`;
- OpenAI-совместимые `chat/completions`;
- удобный agent-bound API (`client.agent(...)`);
- мультимодальные запросы (изображение и аудио);
- генерацию картинок через агента (`generateImage`) и AI Gateway (`imagesGenerations`).

## Установка

```bash
npm install timeweb-cloud-ai
```

Требования:
- Node.js `>=18`
- глобальный `fetch` (в Node 18+ уже встроен)

## Что нужно получить в Timeweb

1. `accessToken` - токен доступа в [Timeweb AI-Агенты](https://timeweb.cloud/my/cloud-ai/agents)
2. `agent_access_id` - ID агента (например, `agt_xxx`)
3. `proxySource` - идентификатор вашего приложения (например, `my-app`)

Если у вас еще нет аккаунта Timeweb, можно зарегистрироваться по реферальной ссылке:
[https://timeweb.cloud/?i=141579](https://timeweb.cloud/?i=141579)

## Быстрый старт

```ts
import { TimewebCloudAIClient } from "timeweb-cloud-ai";

const client = new TimewebCloudAIClient({
  accessToken: process.env.TIMEWEB_AI_TOKEN!,
  proxySource: "my-app",
});

const response = await client.call("agt_xxx", {
  message: "Привет! Кто ты?",
});

console.log(response.message);
```

## Основные методы

### `client.call(agentId, payload)`

Простой вызов агента с текстом и/или файлами.

```ts
await client.call("agt_xxx", {
  message: "Проанализируй документ",
  file_ids: ["file_abc123"],
});
```

### `client.chatCompletions(agentId, payload)`

OpenAI-совместимый endpoint:

```ts
await client.chatCompletions("agt_xxx", {
  model: "gpt-4o",
  messages: [{ role: "user", content: "Напиши короткий стих" }],
  temperature: 0.7,
});
```

### `client.getModels(agentId)`

Возвращает список моделей, доступных для конкретного агента.

### `client.agent(agentId)`

Создает экземпляр, привязанный к одному агенту:

```ts
const agent = client.agent("agt_xxx");

await agent.call({ message: "Привет!" });
const completion = await agent.chatCompletions({
  messages: [{ role: "user", content: "Сделай краткое резюме текста" }],
});

console.log(completion.text);
```

## Мультимодальные запросы

### Анализ изображений

```ts
import { readFileSync } from "node:fs";

const agent = client.agent("agt_xxx");

const result = await agent.chatWithImage({
  text: "Что изображено на фото?",
  image: readFileSync("./photo.jpg"), // Buffer | base64 | путь к файлу
});

console.log(result.text);
```

### Анализ/расшифровка аудио

```ts
const agent = client.agent("agt_xxx");

const result = await agent.chatWithAudio({
  text: "Кратко перескажи основную мысль аудио",
  audio: "BASE64_WAV_STRING",
});

console.log(result.text);
```

Важно: мультимодальные методы работают только с моделями, поддерживающими изображение/аудио (например, `gpt-4o`, `gpt-4o-mini`).

## Генерация изображений

У OpenAI-совместимого API **агента** нет `/v1/images` (это прямо сказано в доках Timeweb).
Картинки делаются так:

1. В панели агента включите опцию **«Генерация изображений»** и выберите image-модель.
2. Вызовите `agent.generateImage(...)` — под капотом это `/call`, ответ парсится на markdown/URL/data-URI, картинка скачивается в `Buffer`.

```ts
const agent = client.agent("agt_xxx");

const result = await agent.generateImage({
  prompt: "Минималистичная обложка поста: синий круг на белом фоне",
});

console.log(result.images[0]?.url);
console.log(result.images[0]?.buffer?.length);
```

Также можно разобрать любой текст ответа вручную:

```ts
import { extractImagesFromText } from "timeweb-cloud-ai";

const images = extractImagesFromText(result.text);
```

### AI Gateway (модели напрямую)

Отдельный ключ из раздела **AI Gateway** (`https://api.timeweb.ai/v1`):

```ts
import { TimewebAIGatewayClient } from "timeweb-cloud-ai";

const gateway = new TimewebAIGatewayClient({
  apiKey: process.env.TIMEWEB_GATEWAY_API_KEY!,
});

const images = await gateway.imagesGenerations({
  model: "MODEL_NAME", // имя модели из панели Gateway
  prompt: "blue circle on white background",
  response_format: "url",
});

console.log(images.data[0]?.url);
```

Доступность `/images/generations` зависит от конкретной модели в Gateway.
Если endpoint недоступен для модели — используйте путь через агента (`generateImage`).

## Обработка ошибок

```ts
import { TimewebCloudAIClient, TimewebAPIError } from "timeweb-cloud-ai";

try {
  await client.call("agt_xxx", { message: "..." });
} catch (err) {
  if (err instanceof TimewebAPIError) {
    console.error("API error:", err.status, err.body);
  } else {
    console.error("Unknown error:", err);
  }
}
```

## Контакт

По вопросам и предложениям: [Telegram](https://t.me/miwist)

## Лицензия

MIT © [miwist](https://t.me/miwist)

## Разработка

Процесс issue → PR → публикация в npm: [docs/workflow.md](./docs/workflow.md).
