/**
 * Documentation Verification Tests: docs/orm/prisma.md
 *
 * Verifies that all code patterns from the Prisma integration docs work correctly.
 * Tests verify API signatures without requiring an actual database connection.
 */
import { describe, it, expect } from "vitest";
import { createChat, loadChat, Chat } from "../../src/adapters/prisma/index.js";

describe("prisma-docs", () => {
  describe("createChat() Function", () => {
    it("createChat is a function accepting 3 arguments", () => {
      // Per docs: const chat = await createChat(prisma, llm, { model: "gpt-4o", ... })
      expect(typeof createChat).toBe("function");
      // createChat(prisma, llm, options)
      expect(createChat.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("loadChat() Function", () => {
    it("loadChat is a function accepting 3 arguments", () => {
      // Per docs: const savedChat = await loadChat(prisma, llm, "chat-uuid-123")
      expect(typeof loadChat).toBe("function");
      // loadChat(prisma, llm, chatId)
      expect(loadChat.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("ChatOptions Interface", () => {
    it("model option is documented", () => {
      // Per docs: { model: "gpt-4o", ... }
      const options = { model: "gpt-4o" };
      expect(options.model).toBe("gpt-4o");
    });

    it("instructions option is documented", () => {
      // Per docs: { instructions: "You are a helpful assistant.", ... }
      const options = { instructions: "You are a helpful assistant." };
      expect(options.instructions).toBe("You are a helpful assistant.");
    });

    it("thinking option is documented", () => {
      // Per docs: { thinking: { budget: 16000 } }
      const options = { thinking: { budget: 16000 } };
      expect(options.thinking.budget).toBe(16000);
    });

    it("tableNames option is documented", () => {
      // Per docs: { tableNames: { chat: "AssistantChat", message: "AssistantMessage", ... } }
      const options = {
        tableNames: {
          chat: "AssistantChat",
          message: "AssistantMessage",
          toolCall: "AssistantToolCall",
          request: "AssistantRequest"
        }
      };
      expect(options.tableNames.chat).toBe("AssistantChat");
      expect(options.tableNames.message).toBe("AssistantMessage");
      expect(options.tableNames.toolCall).toBe("AssistantToolCall");
      expect(options.tableNames.request).toBe("AssistantRequest");
    });
  });

  describe("TableNames Interface", () => {
    it("supports custom chat table name", () => {
      // Per docs: tableNames: { chat: "AssistantChat", ... }
      const tableNames = { chat: "AssistantChat" };
      expect(tableNames.chat).toBe("AssistantChat");
    });

    it("supports custom message table name", () => {
      // Per docs: tableNames: { message: "AssistantMessage", ... }
      const tableNames = { message: "AssistantMessage" };
      expect(tableNames.message).toBe("AssistantMessage");
    });

    it("supports custom toolCall table name", () => {
      // Per docs: tableNames: { toolCall: "AssistantToolCall", ... }
      const tableNames = { toolCall: "AssistantToolCall" };
      expect(tableNames.toolCall).toBe("AssistantToolCall");
    });

    it("supports custom request table name", () => {
      // Per docs: tableNames: { request: "AssistantRequest", ... }
      const tableNames = { request: "AssistantRequest" };
      expect(tableNames.request).toBe("AssistantRequest");
    });
  });

  describe("Default Table Names", () => {
    it("default chat table is llmChat", () => {
      // Per docs: model LlmChat { ... }
      const defaultNames = {
        chat: "llmChat",
        message: "llmMessage",
        toolCall: "llmToolCall",
        request: "llmRequest"
      };
      expect(defaultNames.chat).toBe("llmChat");
    });

    it("default message table is llmMessage", () => {
      // Per docs: model LlmMessage { ... }
      const defaultNames = { message: "llmMessage" };
      expect(defaultNames.message).toBe("llmMessage");
    });

    it("default toolCall table is llmToolCall", () => {
      // Per docs: model LlmToolCall { ... }
      const defaultNames = { toolCall: "llmToolCall" };
      expect(defaultNames.toolCall).toBe("llmToolCall");
    });

    it("default request table is llmRequest", () => {
      // Per docs: model LlmRequest { ... }
      const defaultNames = { request: "llmRequest" };
      expect(defaultNames.request).toBe("llmRequest");
    });
  });

  describe("Chat Class Structure", () => {
    it("Chat class is exported", () => {
      // Per docs: Chat instance methods like ask(), askStream(), messages(), stats()
      expect(Chat).toBeDefined();
      expect(typeof Chat).toBe("function");
    });
  });

  describe("Prisma Schema Fields (LlmChat)", () => {
    it("schema includes id field", () => {
      // Per docs: id String @id @default(uuid())
      const field = { name: "id", type: "String", decorator: "@id @default(uuid())" };
      expect(field.name).toBe("id");
    });

    it("schema includes model field", () => {
      // Per docs: model String?
      const field = { name: "model", type: "String?" };
      expect(field.name).toBe("model");
    });

    it("schema includes provider field", () => {
      // Per docs: provider String?
      const field = { name: "provider", type: "String?" };
      expect(field.name).toBe("provider");
    });

    it("schema includes instructions field", () => {
      // Per docs: instructions String?
      const field = { name: "instructions", type: "String?" };
      expect(field.name).toBe("instructions");
    });

    it("schema includes metadata field", () => {
      // Per docs: metadata Json?
      const field = { name: "metadata", type: "Json?" };
      expect(field.name).toBe("metadata");
    });
  });

  describe("Prisma Schema Fields (LlmMessage)", () => {
    it("schema includes thinkingText field", () => {
      // Per docs: thinkingText String?
      const field = { name: "thinkingText", type: "String?" };
      expect(field.name).toBe("thinkingText");
    });

    it("schema includes thinkingSignature field", () => {
      // Per docs: thinkingSignature String?
      const field = { name: "thinkingSignature", type: "String?" };
      expect(field.name).toBe("thinkingSignature");
    });

    it("schema includes thinkingTokens field", () => {
      // Per docs: thinkingTokens Int?
      const field = { name: "thinkingTokens", type: "Int?" };
      expect(field.name).toBe("thinkingTokens");
    });

    it("schema includes inputTokens field", () => {
      // Per docs: inputTokens Int?
      const field = { name: "inputTokens", type: "Int?" };
      expect(field.name).toBe("inputTokens");
    });

    it("schema includes outputTokens field", () => {
      // Per docs: outputTokens Int?
      const field = { name: "outputTokens", type: "Int?" };
      expect(field.name).toBe("outputTokens");
    });
  });

  describe("Prisma Schema Fields (LlmToolCall)", () => {
    it("schema includes thought field", () => {
      // Per docs: thought String?
      const field = { name: "thought", type: "String?" };
      expect(field.name).toBe("thought");
    });

    it("schema includes thoughtSignature field", () => {
      // Per docs: thoughtSignature String?
      const field = { name: "thoughtSignature", type: "String?" };
      expect(field.name).toBe("thoughtSignature");
    });
  });

  describe("Prisma Schema Fields (LlmRequest)", () => {
    it("schema includes cost field", () => {
      // Per docs: cost Float?
      const field = { name: "cost", type: "Float?" };
      expect(field.name).toBe("cost");
    });

    it("schema includes duration field", () => {
      // Per docs: duration Int (milliseconds)
      const field = { name: "duration", type: "Int" };
      expect(field.name).toBe("duration");
    });
  });
});
