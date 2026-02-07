import { describe, it, expect, afterEach } from "vitest";
import { Agent, defineAgent, Tool, z, createLLM, NodeLLMCore } from "../../../../src/index.js";
import { setupVCR } from "../../../helpers/vcr.js";
import "dotenv/config";

// ============================================================================
// Helper to create LLM instance for tests
// ============================================================================

function createTestLLM(): NodeLLMCore {
  return createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });
}

// ============================================================================
// Test Tools
// ============================================================================

class CalculatorTool extends Tool {
  name = "calculator";
  description = "Performs basic arithmetic operations";
  schema = z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
    operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("Operation")
  });

  async execute({ a, b, operation }: { a: number; b: number; operation: string }) {
    switch (operation) {
      case "add":
        return { result: a + b };
      case "subtract":
        return { result: a - b };
      case "multiply":
        return { result: a * b };
      case "divide":
        return { result: a / b };
      default:
        return { error: "Unknown operation" };
    }
  }
}

// ============================================================================
// Test Agents (defined as factories to inject LLM)
// ============================================================================

function createMathAgent(llm: NodeLLMCore) {
  class MathAgent extends Agent {
    static model = "gpt-4o-mini";
    static instructions = "You are a math tutor. Use the calculator tool to solve problems.";
    static tools = [CalculatorTool];
    static temperature = 0;
  }
  return new MathAgent({ llm });
}

function createSimpleAgent(llm: NodeLLMCore, overrides = {}) {
  class SimpleAgent extends Agent {
    static model = "gpt-4o-mini";
    static instructions = "You are a helpful assistant. Be concise.";
    static temperature = 0;
  }
  return new SimpleAgent({ llm, ...overrides });
}

const AnalysisSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  keywords: z.array(z.string()),
  summary: z.string()
});

function createAnalysisAgent(llm: NodeLLMCore) {
  class AnalysisAgent extends Agent<z.infer<typeof AnalysisSchema>> {
    static model = "gpt-4o-mini";
    static instructions = "Analyze the given text and provide structured analysis.";
    static schema = AnalysisSchema;
    static temperature = 0;
  }
  return new AnalysisAgent({ llm });
}

// ============================================================================
// Tests
// ============================================================================

describe("OpenAI Agent Integration (VCR)", { timeout: 30000 }, () => {
  let polly: { stop: () => Promise<void> } | undefined;

  afterEach(async () => {
    if (polly) {
      await polly.stop();
    }
  });

  it("should create agent with static properties and respond", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createTestLLM();

    const agent = createSimpleAgent(llm);
    const response = await agent.ask("What is 2 + 2? Just give the number.");

    expect(String(response)).toContain("4");
    expect(agent.totalUsage.total_tokens).toBeGreaterThan(0);
  });

  it("should use tools defined on agent class", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createTestLLM();

    const agent = createMathAgent(llm);
    const response = await agent.ask("What is 15 multiplied by 7?");

    expect(String(response)).toContain("105");
    expect(agent.history.some((m) => m.role === "tool")).toBe(true);
  });

  it("should support structured output via static schema", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createTestLLM();

    const agent = createAnalysisAgent(llm);
    const response = await agent.ask("The product launch was amazing! Customers love it.");

    expect(response.parsed).toBeDefined();
    expect(response.parsed?.sentiment).toBe("positive");
    expect(Array.isArray(response.parsed?.keywords)).toBe(true);
    expect(typeof response.parsed?.summary).toBe("string");
  });

  it("should allow instance-level overrides", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createTestLLM();

    const agent = createSimpleAgent(llm, {
      temperature: 0.5,
      maxTokens: 50
    });

    const response = await agent.ask("Say 'Hello World'");
    expect(String(response)).toContain("Hello");
  });

  it("should support defineAgent() for inline definition", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createTestLLM();

    const QuickAgent = defineAgent({
      model: "gpt-4o-mini",
      instructions: "You are a helpful assistant. Be very brief.",
      temperature: 0
    });

    const agent = new QuickAgent({ llm });
    const response = await agent.ask("What color is the sky? One word.");

    expect(String(response).toLowerCase()).toContain("blue");
  });

  it("should support agent inheritance", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createTestLLM();

    class BaseAgent extends Agent {
      static model = "gpt-4o-mini";
      static temperature = 0;
    }

    class SpecializedAgent extends BaseAgent {
      static instructions = "You always respond with exactly 3 words.";
    }

    const agent = new SpecializedAgent({ llm });
    const response = await agent.ask("Describe the ocean.");

    // Should be a short response due to instructions
    const words = String(response).trim().split(/\s+/);
    expect(words.length).toBeLessThanOrEqual(5); // Allow some flexibility
  });

  it("should expose underlying chat for advanced operations", async ({ task }) => {
    polly = setupVCR(task.name, "openai");
    const llm = createTestLLM();

    const agent = createSimpleAgent(llm);

    // Access underlying chat
    expect(agent.underlyingChat).toBeDefined();
    expect(agent.modelId).toBe("gpt-4o-mini");

    const response = await agent.ask("Say 'test'");
    expect(String(response).toLowerCase()).toContain("test");

    // Check history through agent
    expect(agent.history.length).toBeGreaterThan(0);
  });
});
