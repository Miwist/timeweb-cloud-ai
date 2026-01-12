# timeweb-cloud-ai

[![npm version](https://img.shields.io/npm/v/timeweb-cloud-ai?color=cb3837&logo=npm)](https://www.npmjs.com/package/timeweb-cloud-ai)
[![npm downloads](https://img.shields.io/npm/dm/timeweb-cloud-ai?color=blue)](https://www.npmjs.com/package/timeweb-cloud-ai)
[![Node.js >=18](https://img.shields.io/badge/Node.js-%3E%3D18-green?logo=node.js)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue?logo=typescript)](https://www.typescriptlang.org/)

> 🚀 TypeScript-клиент для [Timeweb Cloud AI API](https://agent.timeweb.cloud/docs)  
> Работает с агентами, диалогами и OpenAI-совместимыми чатами.

---

## 📦 Установка

```bash
npm install timeweb-cloud-ai
```

**Требования:**
- Node.js **>= 18**
- TypeScript (если используете в TS-проекте)

---

## 🔑 Необходимо получить

1. **Access Token** — в панели [Timeweb Cloud AI](https://agent.timeweb.cloud)
2. **Agent ID** (`agent_access_id`) — уникальный идентификатор вашего агента (начинается с `agt_`)
3. **Proxy Source** — произвольная строка-идентификатор вашего приложения (например, `my-app`)

> ⚠️ Все три параметра обязательны для работы.

---

## 🚀 Быстрый старт

### Базовое использование

```ts
import { TimewebCloudAIClient } from 'timeweb-cloud-ai';

const client = new TimewebCloudAIClient({
  accessToken: 'ваш_токен',
  proxySource: 'my-app',
});

const response = await client.call('agt_xxx', {
  message: 'Привет! Кто ты?',
});

console.log(response.message);
```

### Удобный агент-специфичный интерфейс

```ts
const agent = client.agent('agt_xxx');

// Теперь не нужно передавать agent_id в каждый вызов
const res1 = await agent.call({ message: 'Привет!' });
const res2 = await agent.chatCompletions({
  messages: [{ role: 'user', content: 'Напиши стих' }],
});
```

---

## 📚 Доступные методы

### `client.call(agentId, payload)`
Вызывает агента с сообщением или файлами.

```ts
await client.call('agt_xxx', {
  message: 'Проанализируй документ',
  file_ids: ['file_abc123'],
});
```

### `client.chatCompletions(agentId, payload)`
OpenAI-совместимый endpoint для генерации чата.

```ts
await client.chatCompletions('agt_xxx', {
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Привет!' }],
  temperature: 0.7,
});
```

### `client.getModels(agentId)`
Получает список моделей, доступных для агента.

### `client.agent(agentId)`
Создаёт привязанный к агенту экземпляр для удобной работы.

```ts
const agent = client.agent('agt_xxx');
await agent.call({ message: '...' });
await agent.chatCompletions({ messages: [...] });
```

> 💡 Метод `getEmbedScript` существует, но **работает только во фронтенде** (из-за CORS). В Node.js он бесполезен.

---

## 🛡️ Обработка ошибок

Библиотека выбрасывает кастомную ошибку `TimewebAPIError`:

```ts
try {
  await client.call('agt_xxx', { message: '...' });
} catch (err) {
  if (err instanceof TimewebAPIError) {
    console.error('API Error:', err.status, err.body);
  }
}
```

---

## 📁 Структура проекта

- ✅ Написан на **TypeScript**
- ✅ Поддержка **ESM и CommonJS**
- ✅ Включает **.d.ts** типы
- ✅ Без внешних зависимостей (только `fetch` из Node.js)
- ✅ Лёгкий

---

## 📬 Контакт

По вопросам, предложениям или багам — пишите в [Telegram](https://t.me/miwist)

---

## Лицензия

MIT © [miwist](https://t.me/miwist)
