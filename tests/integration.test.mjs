import { describe, it } from "node:test";
import * as assert from "node:assert";
import { config } from "dotenv";
config();

import { TimewebCloudAIClient } from "../dist/index.mjs";

const TOKEN = process.env.TIMEWEB_AI_TOKEN;
const AGENT_ID = process.env.TIMEWEB_AGENT_ID;

if (!TOKEN || !AGENT_ID) {
  console.warn(
    "⚠️ Пропущено: задайте TIMEWEB_AI_TOKEN и TIMEWEB_AGENT_ID в .env"
  );
}

describe("Integration – Real API", { skip: !TOKEN || !AGENT_ID }, () => {
  const client = new TimewebCloudAIClient({
    accessToken: TOKEN,
    proxySource: process.env.TIMEWEB_PROXY_SOURCE || "test-integration",
  });

  it(
    "should get a real response from Timeweb AI agent",
    async () => {
      console.log("📡 Запрашиваю ответ от агента:", AGENT_ID);
      const response = await client.call(AGENT_ID, {
        message: "Привет! Кто ты?",
      });

      console.log("✅ Ответ:", response.message);

      assert.ok(response.id, "Ответ должен содержать id");
      assert.ok(
        typeof response.message === "string",
        "Сообщение должно быть строкой"
      );
      assert.ok(response.message.length > 0, "Сообщение не должно быть пустым");
    },
    { timeout: 15_000 }
  );
});
