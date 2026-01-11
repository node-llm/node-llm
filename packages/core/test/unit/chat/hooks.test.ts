import { describe, it, expect, vi } from "vitest";
import { Chat } from "../../../src/chat/Chat.js";
import { FakeProvider } from "../../fake-provider.js";
import { Message } from "../../../src/chat/Message.js";

describe("Content Policy Hooks", () => {
  describe("beforeRequest", () => {
    it("modifies the payload before sending to the provider", async () => {
      const provider = new FakeProvider(["Model response"]);
      const chat = new Chat(provider, "fake-model");

      chat.beforeRequest(async (messages) => {
        return messages.map(m => ({
          ...m,
          content: (m.content as string).replace("SECRET", "REDACTED")
        }));
      });

      await chat.ask("Tell me about SECRET info.");

      // Provider should receive the redacted version
      expect(provider.lastRequest?.messages).toHaveLength(1);
      expect(provider.lastRequest?.messages[0].content).toBe("Tell me about REDACTED info.");
      
      // But the chat history should preserve the original user input (security layer vs audit layer)
      expect(chat.history[0].content).toBe("Tell me about SECRET info.");
    });

    it("works in streaming mode", async () => {
      const provider = new FakeProvider(["Streamed content"]);
      const chat = new Chat(provider, "fake-model");

      chat.beforeRequest(async (messages) => {
        return messages.map(m => ({
          ...m,
          content: (m.content as string).replace("SSN", "XXX")
        }));
      });

      const stream = chat.stream("My SSN is 123");
      for await (const _ of stream) { /* consume */ }

      expect(provider.lastRequest?.messages[0].content).toBe("My XXX is 123");
    });
  });

  describe("afterResponse", () => {
    it("modifies the response after the provider returns it", async () => {
      const provider = new FakeProvider(["The secret is Project X"]);
      const chat = new Chat(provider, "fake-model");

      chat.afterResponse(async (response) => {
        return response.withContent(response.content.replace("Project X", "[HIDDEN]"));
      });

      const res = await chat.ask("What is the secret?");
      
      expect(res.content).toBe("The secret is [HIDDEN]");
      // History should also store the redacted version for future context turns
      expect(String(chat.history[chat.history.length - 1].content)).toBe("The secret is [HIDDEN]");
    });

    it("works in streaming mode", async () => {
      const provider = new FakeProvider(["Secret is Project X"]);
      const chat = new Chat(provider, "fake-model");

      chat.afterResponse(async (response) => {
        return response.withContent(response.content.replace("Project X", "[HIDDEN]"));
      });

      const onEnd = vi.fn();
      chat.onEndMessage(onEnd);

      const stream = chat.stream("any");
      for await (const _ of stream) { /* consume */ }

      // Content in stream chunks is NOT modified (as they are direct from provider),
      // but the final response message in onEnd and history IS modified.
      expect(onEnd).toHaveBeenCalled();
      const finalMsg = onEnd.mock.calls[0][0];
      expect(String(finalMsg.content)).toBe("Secret is [HIDDEN]");
      expect(String(chat.history[chat.history.length - 1].content)).toBe("Secret is [HIDDEN]");
    });
  });

  describe("Error handling", () => {
    it("propagates errors from beforeRequest", async () => {
      const provider = new FakeProvider();
      const chat = new Chat(provider, "fake-model");

      chat.beforeRequest(async () => {
        throw new Error("Policy Violation");
      });

      await expect(chat.ask("hi")).rejects.toThrow("Policy Violation");
    });
  });
});
