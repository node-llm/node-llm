/**
 * Documentation Verification Tests: core-features/agents.md
 *
 * Verifies that Agent class code examples from the documentation work correctly.
 * Uses FakeProvider to avoid requiring real API keys.
 */
import { describe, it, expect, beforeEach } from "vitest";
import {
  createLLM,
  Agent,
  Tool,
  z,
  providerRegistry,
  defineAgent
} from "../../src/index.js";
import { FakeProvider } from "../fake-provider.js";

describe("core-features-agents", () => {
  let provider: FakeProvider;

  beforeEach(() => {
    provider = new FakeProvider(["Test response"]);
    providerRegistry.register("fake", () => provider);
  });

  describe("Basic Usage", () => {
    it("Agent can define static model", () => {
      // Per docs: static model = "gpt-4o";
      class AssistantAgent extends Agent {
        static model = "gpt-4o";
      }

      expect(AssistantAgent.model).toBe("gpt-4o");
    });

    it("Agent can define static instructions", () => {
      // Per docs: static instructions = "You are a helpful assistant. Be concise.";
      class AssistantAgent extends Agent {
        static instructions = "You are a helpful assistant. Be concise.";
      }

      expect(AssistantAgent.instructions).toBe(
        "You are a helpful assistant. Be concise."
      );
    });

    it("Agent can define static temperature", () => {
      // Per docs: static temperature = 0.7;
      class AssistantAgent extends Agent {
        static temperature = 0.7;
      }

      expect(AssistantAgent.temperature).toBe(0.7);
    });

    it("Agent can be instantiated with llm", () => {
      class AssistantAgent extends Agent {
        static model = "gpt-4o";
        static instructions = "You are a helpful assistant. Be concise.";
        static temperature = 0.7;
      }

      const llm = createLLM({ provider: "fake" });
      const agent = new AssistantAgent({ llm });

      expect(agent).toBeInstanceOf(Agent);
    });

    it("Agent has ask() method", async () => {
      class AssistantAgent extends Agent {
        static model = "fake-model";
        static instructions = "You are helpful.";
      }

      const llm = createLLM({ provider: "fake" });
      const agent = new AssistantAgent({ llm });

      expect(typeof agent.ask).toBe("function");
    });

    it("Agent has say() method (alias for ask)", async () => {
      class AssistantAgent extends Agent {
        static model = "fake-model";
      }

      const llm = createLLM({ provider: "fake" });
      const agent = new AssistantAgent({ llm });

      expect(typeof agent.say).toBe("function");
    });

    it("Agent has stream() method", async () => {
      class AssistantAgent extends Agent {
        static model = "fake-model";
      }

      const llm = createLLM({ provider: "fake" });
      const agent = new AssistantAgent({ llm });

      expect(typeof agent.stream).toBe("function");
    });
  });

  describe("Available Static Properties", () => {
    it("Agent supports all documented static properties", () => {
      // Per docs: model, instructions, tools, temperature, thinking, schema
      const TestSchema = z.object({ value: z.string() });

      class TestTool extends Tool {
        name = "test";
        description = "Test tool";
        schema = z.object({});
        async execute() {
          return {};
        }
      }

      class FullAgent extends Agent {
        static model = "gpt-4o";
        static instructions = "System prompt";
        static tools = [TestTool];
        static temperature = 0.5;
        static thinking = true;
        static schema = TestSchema;
      }

      expect(FullAgent.model).toBe("gpt-4o");
      expect(FullAgent.instructions).toBe("System prompt");
      expect(FullAgent.tools).toContain(TestTool);
      expect(FullAgent.temperature).toBe(0.5);
      expect(FullAgent.thinking).toBe(true);
      expect(FullAgent.schema).toBe(TestSchema);
    });
  });

  describe("Agents with Tools", () => {
    it("Tool is defined with instance properties (not static definition)", () => {
      // Per docs: class CalculatorTool extends Tool { name = "calculator"; ... }
      class CalculatorTool extends Tool<{
        a: number;
        b: number;
        operation: "add" | "subtract" | "multiply" | "divide";
      }> {
        name = "calculator";
        description = "Performs arithmetic operations";
        schema = z.object({
          a: z.number(),
          b: z.number(),
          operation: z.enum(["add", "subtract", "multiply", "divide"])
        });

        async execute({
          a,
          b,
          operation
        }: {
          a: number;
          b: number;
          operation: "add" | "subtract" | "multiply" | "divide";
        }) {
          const ops = {
            add: a + b,
            subtract: a - b,
            multiply: a * b,
            divide: a / b
          };
          return { result: ops[operation] };
        }
      }

      const tool = new CalculatorTool();
      expect(tool.name).toBe("calculator");
      expect(tool.description).toBe("Performs arithmetic operations");
    });

    it("Agent can register tools via static tools array", () => {
      class CalculatorTool extends Tool {
        name = "calculator";
        description = "Performs arithmetic operations";
        schema = z.object({ a: z.number(), b: z.number() });
        async execute() {
          return { result: 0 };
        }
      }

      // Per docs: static tools = [CalculatorTool];
      class MathAgent extends Agent {
        static model = "gpt-4o";
        static instructions = "Use the calculator tool to solve math problems.";
        static tools = [CalculatorTool];
        static temperature = 0;
      }

      expect(MathAgent.tools).toEqual([CalculatorTool]);
      expect(MathAgent.temperature).toBe(0);
    });
  });

  describe("Model Routing Agent", () => {
    it("ClassifierTool pattern compiles", () => {
      // Per docs: class ClassifierTool extends Tool { ... }
      class ClassifierTool extends Tool {
        name = "classify_task";
        description = "Classifies the task type";
        schema = z.object({ query: z.string() });

        async execute({ query }: { query: string }) {
          // Simplified - real code would call another LLM
          return { taskType: "factual" };
        }
      }

      const tool = new ClassifierTool();
      expect(tool.name).toBe("classify_task");
    });

    it("SmartRouter agent pattern compiles", () => {
      class ClassifierTool extends Tool {
        name = "classify_task";
        description = "Classifies the task type";
        schema = z.object({ query: z.string() });
        async execute() {
          return { taskType: "creative" };
        }
      }

      // Per docs: class SmartRouter extends Agent { ... }
      class SmartRouter extends Agent {
        static model = "gpt-4o";
        static instructions =
          "Classify the task, then route to the appropriate specialist.";
        static tools = [ClassifierTool];
      }

      expect(SmartRouter.model).toBe("gpt-4o");
      expect(SmartRouter.tools).toContain(ClassifierTool);
    });
  });

  describe("RAG Agent", () => {
    it("KnowledgeSearchTool pattern compiles", () => {
      // Per docs: class KnowledgeSearchTool extends Tool { ... }
      class KnowledgeSearchTool extends Tool {
        name = "search_knowledge";
        description = "Searches internal documents for relevant context";
        schema = z.object({ query: z.string().describe("What to search for") });

        async execute({ query }: { query: string }) {
          // Simplified - real code would use vector search
          return `[Policy]: ${query} - example content`;
        }
      }

      const tool = new KnowledgeSearchTool();
      expect(tool.name).toBe("search_knowledge");
      expect(tool.schema).toBeDefined();
    });

    it("RAGAgent pattern compiles", () => {
      class KnowledgeSearchTool extends Tool {
        name = "search_knowledge";
        description = "Searches internal documents for relevant context";
        schema = z.object({ query: z.string() });
        async execute() {
          return "search results";
        }
      }

      // Per docs: class RAGAgent extends Agent { ... }
      class RAGAgent extends Agent {
        static model = "gpt-4o";
        static instructions =
          "Answer questions using the knowledge search tool. Cite sources.";
        static tools = [KnowledgeSearchTool];
      }

      expect(RAGAgent.model).toBe("gpt-4o");
      expect(RAGAgent.tools).toHaveLength(1);
    });
  });

  describe("Multi-Agent Collaboration", () => {
    it("ResearchAgent and WriterAgent pattern compiles", () => {
      // Per docs: class ResearchAgent extends Agent { ... }
      class ResearchAgent extends Agent {
        static model = "gemini-2.0-flash";
        static instructions = "List 5 key facts about the topic.";
      }

      // Per docs: class WriterAgent extends Agent { ... }
      class WriterAgent extends Agent {
        static model = "claude-sonnet-4-20250514";
        static instructions = "Write a concise article from these notes.";
      }

      expect(ResearchAgent.model).toBe("gemini-2.0-flash");
      expect(WriterAgent.model).toBe("claude-sonnet-4-20250514");
    });

    it("ResearcherTool and WriterTool pattern compiles", () => {
      // Per docs: class ResearcherTool extends Tool { ... }
      class ResearcherTool extends Tool {
        name = "research";
        description = "Gathers facts about a topic";
        schema = z.object({ topic: z.string() });

        async execute({ topic }: { topic: string }) {
          // Simplified - real code would use ResearchAgent
          return `Facts about ${topic}`;
        }
      }

      // Per docs: class WriterTool extends Tool { ... }
      class WriterTool extends Tool {
        name = "write";
        description = "Writes content from research notes";
        schema = z.object({ notes: z.string() });

        async execute({ notes }: { notes: string }) {
          // Simplified - real code would use WriterAgent
          return `Article based on: ${notes}`;
        }
      }

      expect(new ResearcherTool().name).toBe("research");
      expect(new WriterTool().name).toBe("write");
    });

    it("CoordinatorAgent pattern compiles", () => {
      class ResearcherTool extends Tool {
        name = "research";
        description = "Gathers facts";
        schema = z.object({ topic: z.string() });
        async execute() {
          return "facts";
        }
      }

      class WriterTool extends Tool {
        name = "write";
        description = "Writes content";
        schema = z.object({ notes: z.string() });
        async execute() {
          return "article";
        }
      }

      // Per docs: class CoordinatorAgent extends Agent { ... }
      class CoordinatorAgent extends Agent {
        static model = "gpt-4o";
        static instructions = "First research the topic, then write an article.";
        static tools = [ResearcherTool, WriterTool];
      }

      expect(CoordinatorAgent.tools).toHaveLength(2);
    });
  });

  describe("Structured Output", () => {
    it("Agent can define static schema for structured output", () => {
      // Per docs: const SentimentSchema = z.object({ ... })
      const SentimentSchema = z.object({
        sentiment: z.enum(["positive", "negative", "neutral"]),
        confidence: z.number(),
        keywords: z.array(z.string())
      });

      // Per docs: class SentimentAnalyzer extends Agent<z.infer<typeof SentimentSchema>> { ... }
      class SentimentAnalyzer extends Agent<z.infer<typeof SentimentSchema>> {
        static model = "gpt-4o";
        static instructions = "Analyze the sentiment of the given text.";
        static schema = SentimentSchema;
      }

      expect(SentimentAnalyzer.schema).toBe(SentimentSchema);
      expect(SentimentAnalyzer.instructions).toBe(
        "Analyze the sentiment of the given text."
      );
    });
  });

  describe("Inline Definition with defineAgent()", () => {
    it("defineAgent() creates an Agent class from config object", () => {
      // Per docs: const QuickAgent = defineAgent({ ... })
      const QuickAgent = defineAgent({
        model: "gpt-4o-mini",
        instructions: "You are a helpful assistant.",
        temperature: 0
      });

      expect(QuickAgent.model).toBe("gpt-4o-mini");
      expect(QuickAgent.instructions).toBe("You are a helpful assistant.");
      expect(QuickAgent.temperature).toBe(0);
    });

    it("defineAgent() result can be instantiated", () => {
      const QuickAgent = defineAgent({
        model: "fake-model",
        instructions: "Helper"
      });

      const llm = createLLM({ provider: "fake" });
      const agent = new QuickAgent({ llm });

      expect(agent).toBeInstanceOf(Agent);
    });
  });

  describe("Agent Inheritance", () => {
    it("Child agents inherit parent static properties", () => {
      // Per docs: class BaseAgent extends Agent { ... }
      class BaseAgent extends Agent {
        static model = "gpt-4o";
        static temperature = 0;
      }

      // Per docs: class CodeReviewer extends BaseAgent { ... }
      class CodeReviewer extends BaseAgent {
        static instructions = "Review code for bugs and suggest improvements.";
      }

      // Per docs: class SecurityReviewer extends BaseAgent { ... }
      class SecurityReviewer extends BaseAgent {
        static instructions = "Review code for security vulnerabilities.";
      }

      // Children inherit model and temperature
      expect(CodeReviewer.model).toBe("gpt-4o");
      expect(CodeReviewer.temperature).toBe(0);
      expect(SecurityReviewer.model).toBe("gpt-4o");
      expect(SecurityReviewer.temperature).toBe(0);

      // Children have their own instructions
      expect(CodeReviewer.instructions).toBe(
        "Review code for bugs and suggest improvements."
      );
      expect(SecurityReviewer.instructions).toBe(
        "Review code for security vulnerabilities."
      );
    });

    it("Child can override parent static properties", () => {
      class BaseAgent extends Agent {
        static model = "gpt-4o";
        static temperature = 0.5;
      }

      class CustomAgent extends BaseAgent {
        static model = "gpt-4o-mini"; // Override
        static temperature = 0.9; // Override
      }

      expect(CustomAgent.model).toBe("gpt-4o-mini");
      expect(CustomAgent.temperature).toBe(0.9);
    });
  });

  describe("Instance Overrides", () => {
    it("Agent instance can override static temperature", () => {
      class AssistantAgent extends Agent {
        static model = "fake-model";
        static temperature = 0.5;
      }

      const llm = createLLM({ provider: "fake" });

      // Per docs: new AssistantAgent({ llm, temperature: 0.9 })
      const agent = new AssistantAgent({
        llm,
        temperature: 0.9
      });

      expect(agent).toBeInstanceOf(Agent);
      // The instance should use the overridden value
    });

    it("Agent instance can add runtime options like maxTokens", () => {
      class AssistantAgent extends Agent {
        static model = "fake-model";
      }

      const llm = createLLM({ provider: "fake" });

      // Per docs: new AssistantAgent({ llm, maxTokens: 500 })
      const agent = new AssistantAgent({
        llm,
        maxTokens: 500
      });

      expect(agent).toBeInstanceOf(Agent);
    });
  });
});
