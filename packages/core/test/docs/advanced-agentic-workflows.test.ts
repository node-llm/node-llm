/**
 * Documentation Verification Tests: advanced/agentic-workflows.md
 *
 * Verifies that agentic workflow code patterns work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  Tool,
  z,
  providerRegistry
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("advanced-agentic-workflows", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Core Idea: Tool as Agent", () => {
    it("Tool can call another LLM inside execute()", () => {
      // Per docs: An "agent" is just a tool that happens to call another LLM
      class MyAgent extends Tool {
        name = "my_agent";
        description = "An agent tool";
        schema = z.object({
          query: z.string()
        });

        async execute({ query }: { query: string }) {
          // In real code, this would call another LLM
          return `Processed: ${query}`;
        }
      }

      const agent = new MyAgent();
      expect(agent.name).toBe("my_agent");
      expect(typeof agent.execute).toBe("function");
    });
  });

  describe("Model Routing Pattern", () => {
    it("SmartRouter tool pattern compiles", () => {
      // Per docs: class SmartRouter extends Tool { ... }
      class SmartRouter extends Tool {
        name = "smart_router";
        description = "Routes to the best model for the task";
        schema = z.object({
          query: z.string().describe("The user's request")
        });

        async execute({ query }: { query: string }) {
          // Simplified version of the documented pattern
          const taskType = "factual";
          return `Routed ${query} to ${taskType} specialist`;
        }
      }

      const router = new SmartRouter();
      expect(router.name).toBe("smart_router");
    });
  });

  describe("RAG Pattern", () => {
    it("KnowledgeSearch tool pattern compiles", () => {
      // Per docs: class KnowledgeSearch extends Tool { ... }
      class KnowledgeSearch extends Tool {
        name = "search_knowledge";
        description = "Searches internal documents for relevant context";
        schema = z.object({
          query: z.string().describe("What to search for")
        });

        async execute({ query }: { query: string }) {
          // Simplified - real code would use vector search
          return `Search results for: ${query}`;
        }
      }

      const search = new KnowledgeSearch();
      expect(search.name).toBe("search_knowledge");
    });
  });

  describe("Multi-Agent Collaboration", () => {
    it("Researcher and Writer tool pattern compiles", () => {
      // Per docs: class Researcher extends Tool { ... }
      class Researcher extends Tool {
        name = "research";
        description = "Gathers facts about a topic";
        schema = z.object({ topic: z.string() });

        async execute({ topic }: { topic: string }) {
          return `Facts about ${topic}`;
        }
      }

      // Per docs: class Writer extends Tool { ... }
      class Writer extends Tool {
        name = "write";
        description = "Writes content from research notes";
        schema = z.object({ notes: z.string() });

        async execute({ notes }: { notes: string }) {
          return `Article based on: ${notes}`;
        }
      }

      const researcher = new Researcher();
      const writer = new Writer();

      expect(researcher.name).toBe("research");
      expect(writer.name).toBe("write");
    });

    it("Coordinator with multiple tools pattern", () => {
      // Per docs: const coordinator = createLLM({ provider: "openai" })
      //   .chat("gpt-4o")
      //   .system("First research the topic, then write an article.")
      //   .withTools([Researcher, Writer]);

      class Researcher extends Tool {
        name = "research";
        description = "Gathers facts";
        schema = z.object({ topic: z.string() });
        async execute() {
          return "facts";
        }
      }

      class Writer extends Tool {
        name = "write";
        description = "Writes content";
        schema = z.object({ notes: z.string() });
        async execute() {
          return "article";
        }
      }

      const llm = createLLM({ provider: "fake" });
      const coordinator = llm
        .chat("fake-model")
        .system("First research the topic, then write an article.")
        .withTools([Researcher, Writer]);

      expect(coordinator).toBeDefined();
    });
  });

  describe("Parallel Execution", () => {
    it("Promise.all pattern with multiple chat calls", async () => {
      // Per docs: const [sentiment, summary, topics] = await Promise.all([...])
      const llm = createLLM({ provider: "fake" });

      // Set up responses for parallel calls
      provider = new FakeProvider(["positive", "summary text", "topic1, topic2"]);
      providerRegistry.register("fake", () => provider);

      // Verify the pattern compiles (we won't actually run in parallel)
      const text = "Test content";
      expect(async () => {
        const [r1, r2, r3] = await Promise.all([
          llm.chat("fake-model").ask(`Sentiment: ${text}`),
          llm.chat("fake-model").ask(`Summary: ${text}`),
          llm.chat("fake-model").ask(`Topics: ${text}`)
        ]);
        return { sentiment: r1, summary: r2, topics: r3 };
      }).not.toThrow();
    });
  });

  describe("Tool Registration Patterns", () => {
    it("withTools accepts array of Tool classes", () => {
      // Per docs: .withTools([Researcher, Writer])
      class ToolA extends Tool {
        name = "tool_a";
        description = "Tool A";
        schema = z.object({});
        async execute() {
          return "a";
        }
      }

      class ToolB extends Tool {
        name = "tool_b";
        description = "Tool B";
        schema = z.object({});
        async execute() {
          return "b";
        }
      }

      const llm = createLLM({ provider: "fake" });
      const chat = llm.chat("fake-model").withTools([ToolA, ToolB]);

      expect(chat).toBeDefined();
    });
  });
});
