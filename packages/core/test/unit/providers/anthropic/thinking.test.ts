import { describe, it, expect, vi, beforeEach, Mock } from "vitest";
import { applyThinking } from "../../../../src/providers/anthropic/Utils.js";
import { AnthropicChat } from "../../../../src/providers/anthropic/Chat.js";
import { AnthropicStreaming } from "../../../../src/providers/anthropic/Streaming.js";
import { AnthropicMessageRequest } from "../../../../src/providers/anthropic/types.js";
import { ThinkingConfig } from "../../../../src/providers/Provider.js";

function bodyFor(
  model: string,
  thinking: ThinkingConfig | undefined,
  extra: Partial<AnthropicMessageRequest> = {},
  maxTokensSet = false
): AnthropicMessageRequest {
  const body: AnthropicMessageRequest = { model, messages: [], max_tokens: 4096, ...extra };
  applyThinking(body, thinking, maxTokensSet);
  return body;
}

describe("Anthropic thinking", () => {
  describe("applyThinking", () => {
    it("sends nothing without a thinking config", () => {
      const body = bodyFor("claude-sonnet-5", undefined);
      expect(body.thinking).toBeUndefined();
      expect(body.output_config).toBeUndefined();
    });

    describe("budget generations (unchanged behaviour)", () => {
      it("sends a fixed budget and raises max_tokens to fit it", () => {
        const body = bodyFor("claude-sonnet-4-5", { budget: 8000 });
        expect(body.thinking).toEqual({ type: "enabled", budget_tokens: 8000 });
        expect(body.max_tokens).toBe(9024);
        expect(body.output_config).toBeUndefined();
      });

      it("keeps an explicit max_tokens", () => {
        const body = bodyFor("claude-sonnet-4-5", { budget: 8000 }, {}, true);
        expect(body.max_tokens).toBe(4096);
      });

      it("ignores effort alone, as before", () => {
        const body = bodyFor("claude-sonnet-4-5", { effort: "high" });
        expect(body.thinking).toBeUndefined();
        expect(body.output_config).toBeUndefined();
      });

      it("ignores effort alone on models that take both effort and a budget", () => {
        const body = bodyFor("claude-opus-4-6", { effort: "high" });
        expect(body.thinking).toBeUndefined();
        expect(body.output_config).toBeUndefined();
      });

      it("sends effort alongside a budget when the model takes effort", () => {
        const body = bodyFor("claude-opus-4-6", { budget: 2000, effort: "high" });
        expect(body.thinking).toEqual({ type: "enabled", budget_tokens: 2000 });
        expect(body.output_config).toEqual({ effort: "high" });
      });
    });

    describe("adaptive-only generations", () => {
      it("turns effort into adaptive thinking", () => {
        const body = bodyFor("claude-sonnet-5", { effort: "medium" });
        expect(body.thinking).toEqual({ type: "adaptive" });
        expect(body.output_config).toEqual({ effort: "medium" });
      });

      it("forwards display", () => {
        const body = bodyFor("claude-opus-4-7", { effort: "xhigh", display: "summarized" });
        expect(body.thinking).toEqual({ type: "adaptive", display: "summarized" });
        expect(body.output_config).toEqual({ effort: "xhigh" });
      });

      it("sends nothing for effort none", () => {
        const body = bodyFor("claude-sonnet-5", { effort: "none" });
        expect(body.thinking).toBeUndefined();
        expect(body.output_config).toBeUndefined();
      });

      it("skips the thinking block with forced tool choice but keeps effort", () => {
        const body = bodyFor(
          "claude-sonnet-5",
          { effort: "low" },
          { tool_choice: { type: "tool", name: "lookup" } }
        );
        expect(body.thinking).toBeUndefined();
        expect(body.output_config).toEqual({ effort: "low" });
      });

      it("passes a budget through unchanged", () => {
        const body = bodyFor("claude-sonnet-5", { budget: 2000 });
        expect(body.thinking).toEqual({ type: "enabled", budget_tokens: 2000 });
      });

      it("merges effort into an existing output_config", () => {
        const body = bodyFor(
          "claude-sonnet-5",
          { effort: "high" },
          { output_config: { format: { type: "json_schema" } } }
        );
        expect(body.output_config).toEqual({ format: { type: "json_schema" }, effort: "high" });
      });
    });

    it("turns on adaptive thinking from display alone", () => {
      const body = bodyFor("claude-sonnet-5", { display: "summarized" });
      expect(body.thinking).toEqual({ type: "adaptive", display: "summarized" });
      expect(body.output_config).toBeUndefined();
    });

    it("ignores effort for models the registry does not know", () => {
      const body = bodyFor("my-custom-model", { effort: "high" });
      expect(body.thinking).toBeUndefined();
      expect(body.output_config).toBeUndefined();
    });
  });

  describe("request bodies", () => {
    const baseUrl = "https://api.anthropic.com/v1";

    beforeEach(() => {
      vi.restoreAllMocks();
    });

    function sentBody(): Record<string, unknown> {
      const [, init] = (fetch as unknown as Mock).mock.calls[0];
      return JSON.parse(init.body);
    }

    it("chat sends adaptive thinking and effort", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: () =>
            Promise.resolve({
              content: [{ type: "text", text: "ok" }],
              usage: { input_tokens: 1, output_tokens: 1 }
            })
        })
      );

      await new AnthropicChat(baseUrl, "test-key").execute({
        model: "claude-sonnet-5",
        messages: [{ role: "user", content: "hi" }],
        thinking: { effort: "low", display: "summarized" }
      });

      const body = sentBody();
      expect(body.thinking).toEqual({ type: "adaptive", display: "summarized" });
      expect(body.output_config).toEqual({ effort: "low" });
    });

    it("streaming sends adaptive thinking and effort", async () => {
      const reader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            value: new TextEncoder().encode(
              'event: message_stop\ndata: {"type":"message_stop"}\n\n'
            ),
            done: false
          })
          .mockResolvedValueOnce({ done: true })
      };
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          statusText: "OK",
          body: { getReader: () => reader }
        })
      );

      const stream = new AnthropicStreaming(baseUrl, "test-key").execute({
        model: "claude-sonnet-5",
        messages: [{ role: "user", content: "hi" }],
        thinking: { effort: "high" }
      });
      for await (const _chunk of stream) {
        // drain
      }

      const body = sentBody();
      expect(body.thinking).toEqual({ type: "adaptive" });
      expect(body.output_config).toEqual({ effort: "high" });
    });
  });
});
