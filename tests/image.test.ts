import { describe, it, beforeEach } from "node:test";
import * as assert from "node:assert";
import {
  dataUrlToBuffer,
  extractImagesFromText,
  guessMimeTypeFromUrl,
} from "../src/image-utils.js";
import { TimewebCloudAIClient } from "../src/client.js";
import { TimewebAIGatewayClient } from "../src/gateway-client.js";

describe("extractImagesFromText", () => {
  it("parses markdown, html, data and bare urls", () => {
    const text = [
      "Вот обложка:",
      "![cover](https://cdn.example.com/a.png)",
      '<img src="https://cdn.example.com/b.webp" alt="x">',
      "data:image/png;base64,aGVsbG8=",
      "и ещё https://cdn.example.com/c.jpg?x=1",
    ].join("\n");

    const images = extractImagesFromText(text);
    assert.strictEqual(images.length, 4);
    assert.strictEqual(images[0].kind, "markdown");
    assert.strictEqual(images[0].url, "https://cdn.example.com/a.png");
    assert.strictEqual(images[1].kind, "html");
    assert.strictEqual(images[2].kind, "data");
    assert.strictEqual(images[3].kind, "bare_url");
  });

  it("dedupes repeated urls", () => {
    const url = "https://cdn.example.com/same.png";
    const images = extractImagesFromText(`![](${url}) ${url}`);
    assert.strictEqual(images.length, 1);
  });
});

describe("image helpers", () => {
  it("guesses mime and decodes data url", () => {
    assert.strictEqual(
      guessMimeTypeFromUrl("https://x.test/a.PNG"),
      "image/png"
    );
    const { buffer, mimeType } = dataUrlToBuffer(
      "data:image/png;base64,aGVsbG8="
    );
    assert.strictEqual(mimeType, "image/png");
    assert.strictEqual(buffer.toString("utf8"), "hello");
  });
});

describe("AgentInstance.generateImage", () => {
  const originalFetch = global.fetch;
  const mockAgentId = "agt_img_1";

  beforeEach(() => {
    global.fetch = originalFetch;
  });

  it("calls /call and downloads first image", async () => {
    const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

    global.fetch = async (url: any, options: any) => {
      const href = String(url);
      if (href.includes(`/agents/${mockAgentId}/call`)) {
        assert.strictEqual(options.method, "POST");
        return {
          ok: true,
          text: () =>
            Promise.resolve(
              JSON.stringify({
                id: "msg_1",
                message: "Готово ![x](https://cdn.example.com/cover.png)",
                finish_reason: {},
              })
            ),
        } as any;
      }
      if (href === "https://cdn.example.com/cover.png") {
        return {
          ok: true,
          headers: { get: () => "image/png" },
          arrayBuffer: () => Promise.resolve(pngBytes.buffer.slice(
            pngBytes.byteOffset,
            pngBytes.byteOffset + pngBytes.byteLength
          )),
        } as any;
      }
      throw new Error(`unexpected fetch ${href}`);
    };

    const client = new TimewebCloudAIClient({
      accessToken: "tok",
      proxySource: "test",
    });
    const result = await client.agent(mockAgentId).generateImage({
      prompt: "синий круг",
    });

    assert.strictEqual(result.images.length, 1);
    assert.strictEqual(result.images[0].url, "https://cdn.example.com/cover.png");
    assert.ok(result.images[0].buffer);
    assert.strictEqual(result.images[0].mimeType, "image/png");
  });
});

describe("TimewebAIGatewayClient", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = originalFetch;
  });

  it("posts images/generations", async () => {
    global.fetch = async (url: any, options: any) => {
      assert.ok(String(url).endsWith("/images/generations"));
      assert.strictEqual(options.method, "POST");
      assert.strictEqual(
        options.headers.Authorization,
        "Bearer gateway_key"
      );
      return {
        ok: true,
        text: () =>
          Promise.resolve(
            JSON.stringify({
              created: 1,
              data: [{ url: "https://cdn.example.com/g.png" }],
            })
          ),
      } as any;
    };

    const gateway = new TimewebAIGatewayClient({ apiKey: "gateway_key" });
    const res = await gateway.imagesGenerations({
      model: "flux-2-pro",
      prompt: "blue circle",
    });
    assert.strictEqual(res.data[0].url, "https://cdn.example.com/g.png");
  });
});
