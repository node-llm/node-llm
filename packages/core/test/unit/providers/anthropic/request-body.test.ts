import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { AnthropicChat } from "../../../../src/providers/anthropic/Chat.js";
import { AnthropicStreaming } from "../../../../src/providers/anthropic/Streaming.js";
import { ChatRequest } from "../../../../src/providers/Provider.js";

const sentBody = () => {
  const [, init] = (fetch as unknown as Mock).mock.calls[0] as [string, RequestInit];
  return JSON.parse(String(init.body));
};

describe("Anthropic request body", () => {
  const request: ChatRequest = {
    model: "claude-sonnet-4-5",
    messages: [
      { role: "system", content: "Be brief." },
      { role: "user", content: "Hi" }
    ],
    temperature: 0.2,
    top_k: 5,
    metadata: { user_id: "u1" }
  };

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("stop after the request")));
  });

  it("sends extra parameters when streaming, as it does without streaming", async () => {
    await new AnthropicChat("https://api.test", "key").execute(request).catch(() => {});
    const chatBody = sentBody();
    (fetch as unknown as Mock).mockClear();

    const stream = new AnthropicStreaming("https://api.test", "key").execute(request);
    await stream.next().catch(() => {});
    const streamBody = sentBody();

    expect(streamBody).toMatchObject({ top_k: 5, metadata: { user_id: "u1" }, stream: true });
    expect({ ...streamBody, stream: false }).toEqual(chatBody);
  });
});
