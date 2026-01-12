import { describe, it, before, after, beforeEach } from "node:test";
import * as assert from "node:assert";
import { TimewebCloudAIClient } from "../src/client.js";

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
});
