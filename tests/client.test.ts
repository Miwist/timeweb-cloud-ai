import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import { TimewebAPIError, TimewebCloudAIClient } from "../src/client.js";

const originalFetch = global.fetch;

describe("TimewebCloudAIClient", () => {
  const mockAccessToken = "test_token_123";
  const mockProxySource = "test_app";
  const mockAgentId = "agt_test_456";

  beforeEach(() => {
    global.fetch = originalFetch;
  });

  it("should throw if accessToken is missing", () => {
    assert.throws(
      () => {
        new TimewebCloudAIClient({
          accessToken: "",
          proxySource: mockProxySource,
        });
      },
      { message: "accessToken is required" }
    );
  });

  it("should throw if proxySource is missing", () => {
    assert.throws(
      () => {
        new TimewebCloudAIClient({
          accessToken: mockAccessToken,
          proxySource: "",
        });
      },
      { message: "proxySource is required" }
    );
  });

  it("should make POST request to /call with correct headers", async () => {
    const mockResponse = {
      id: "msg_123",
      message: "Привет!",
      finish_reason: {},
    };

    global.fetch = async (url: any, options: any) => {
      assert.ok(url.includes(`/agents/${mockAgentId}/call`));
      assert.strictEqual(options.method, "POST");
      assert.strictEqual(
        options.headers.Authorization,
        `Bearer ${mockAccessToken}`
      );
      assert.strictEqual(options.headers["x-proxy-source"], mockProxySource);

      return {
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as any;
    };

    const client = new TimewebCloudAIClient({
      accessToken: mockAccessToken,
      proxySource: mockProxySource,
    });

    const result = await client.call(mockAgentId, { message: "Здравствуйте!" });
    assert.deepStrictEqual(result, mockResponse);
  });

  it("should throw if agent_access_id is not provided", async () => {
    const client = new TimewebCloudAIClient({
      accessToken: mockAccessToken,
      proxySource: mockProxySource,
    });

    await assert.rejects(
      // @ts-expect-error intentional
      client.call(undefined, { message: "hi" }),
      { message: "agent_access_id is required for all requests" }
    );
  });

  it("should throw TimewebAPIError on non-ok JSON response", async () => {
    global.fetch = async () =>
      ({
        ok: false,
        status: 401,
        text: () => Promise.resolve(JSON.stringify({ error: "unauthorized" })),
      } as any);

    const client = new TimewebCloudAIClient({
      accessToken: mockAccessToken,
      proxySource: mockProxySource,
    });

    await assert.rejects(
      client.call(mockAgentId, { message: "hi" }),
      (error: unknown) => {
        assert.ok(error instanceof TimewebAPIError);
        assert.strictEqual(error.status, 401);
        assert.deepStrictEqual(error.body, { error: "unauthorized" });
        return true;
      }
    );
  });

  it("should throw TimewebAPIError with raw text for non-JSON error body", async () => {
    global.fetch = async () =>
      ({
        ok: false,
        status: 500,
        text: () => Promise.resolve("internal failure"),
      } as any);

    const client = new TimewebCloudAIClient({
      accessToken: mockAccessToken,
      proxySource: mockProxySource,
    });

    await assert.rejects(
      client.call(mockAgentId, { message: "hi" }),
      (error: unknown) => {
        assert.ok(error instanceof TimewebAPIError);
        assert.strictEqual(error.status, 500);
        assert.deepStrictEqual(error.body, { raw: "internal failure" });
        return true;
      }
    );
  });

  it("should call models endpoint with GET", async () => {
    const mockResponse = { object: "list", data: [{ id: "gpt-4o" }] };

    global.fetch = async (url: any, options: any) => {
      assert.ok(url.includes(`/agents/${mockAgentId}/v1/models`));
      assert.strictEqual(options.method, "GET");
      return {
        ok: true,
        text: () => Promise.resolve(JSON.stringify(mockResponse)),
      } as any;
    };

    const client = new TimewebCloudAIClient({
      accessToken: mockAccessToken,
      proxySource: mockProxySource,
    });

    const result = await client.getModels(mockAgentId);
    assert.deepStrictEqual(result, mockResponse);
  });

  it("agent chatCompletions should return convenient wrapper", async () => {
    global.fetch = async (url: any) => {
      assert.ok(url.includes(`/agents/${mockAgentId}/v1/chat/completions`));
      return {
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              id: "chatcmpl_1",
              object: "chat.completion",
              created: 1,
              model: "gpt-4o",
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "Привет из теста" },
                  finish_reason: "stop",
                },
              ],
              usage: { prompt_tokens: 1, completion_tokens: 2, total_tokens: 3 },
            })
          ),
      } as any;
    };

    const client = new TimewebCloudAIClient({
      accessToken: mockAccessToken,
      proxySource: mockProxySource,
    });

    const completion = await client.agent(mockAgentId).chatCompletions({
      messages: [{ role: "user", content: "hello" }],
    });

    assert.strictEqual(completion.text, "Привет из теста");
    assert.deepStrictEqual(completion.usage, {
      prompt_tokens: 1,
      completion_tokens: 2,
      total_tokens: 3,
    });
  });
});
