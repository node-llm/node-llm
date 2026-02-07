/**
 * Agent Example - Declarative Agent Definition
 *
 * This example demonstrates how to create reusable, class-configured agents
 * using static properties - similar to ruby_llm's Agent DSL.
 *
 * Run: node examples/scripts/core/agents/basic.mjs
 */

import "dotenv/config";
import { Agent, Tool, z, defineAgent, createLLM } from "../../../../packages/core/dist/index.js";

// Create an LLM instance to use with agents
const llm = createLLM({ provider: "openai" });

// ============================================================================
// Example 1: Class-based Agent with Static Properties
// ============================================================================

// Define a simple calculator tool
class CalculatorTool extends Tool {
  name = "calculator";
  description = "Performs basic arithmetic operations";
  schema = z.object({
    a: z.number().describe("First number"),
    b: z.number().describe("Second number"),
    operation: z.enum(["add", "subtract", "multiply", "divide"]).describe("Operation to perform")
  });

  async execute({ a, b, operation }) {
    console.log(`  [Calculator] ${a} ${operation} ${b}`);
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

// Define the agent using static properties
class MathTutorAgent extends Agent {
  static model = "gpt-4o-mini";
  static instructions = `You are a friendly math tutor. 
Use the calculator tool to solve problems and explain your work step by step.
Always show the calculation process.`;
  static tools = [CalculatorTool];
  static temperature = 0.3;
}

// ============================================================================
// Example 2: Using defineAgent() for inline definition
// ============================================================================

const SupportAgent = defineAgent({
  model: "gpt-4o-mini",
  instructions: "You are a helpful customer support agent. Be concise and friendly.",
  temperature: 0.5
});

// ============================================================================
// Example 3: Agent with structured output schema
// ============================================================================

const AnalysisSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string()),
  summary: z.string()
});

class AnalysisAgent extends Agent {
  static model = "gpt-4o-mini";
  static instructions = "Analyze the given text and provide structured analysis.";
  static schema = AnalysisSchema;
  static temperature = 0;
}

// ============================================================================
// Example 4: Agent inheritance
// ============================================================================

class BaseAssistant extends Agent {
  static model = "gpt-4o-mini";
  static temperature = 0.7;
}

class CreativeWriter extends BaseAssistant {
  static instructions = "You are a creative writer. Write engaging and imaginative content.";
  static temperature = 0.9; // Override parent
}

class TechnicalWriter extends BaseAssistant {
  static instructions = "You are a technical writer. Be precise and clear.";
  static temperature = 0.2; // Override parent
}

// ============================================================================
// Usage
// ============================================================================

async function main() {
  console.log("=== Agent Examples ===\n");

  // Example 1: Math Tutor
  console.log("1. Math Tutor Agent:");
  const mathTutor = new MathTutorAgent({ llm });
  const mathResponse = await mathTutor.ask("What is 15 multiplied by 7?");
  console.log(`   Response: ${mathResponse}`);
  console.log(`   Tokens: ${mathTutor.totalUsage.total_tokens}\n`);

  // Example 2: Support Agent (inline definition)
  console.log("2. Support Agent (defineAgent):");
  const supportAgent = new SupportAgent({ llm });
  const supportResponse = await supportAgent.ask("How do I reset my password?");
  console.log(`   Response: ${supportResponse}\n`);

  // Example 3: Analysis Agent (structured output)
  console.log("3. Analysis Agent (structured output):");
  const analysisAgent = new AnalysisAgent({ llm });
  const analysisResponse = await analysisAgent.ask(
    "The new product launch exceeded all expectations. Customers love the innovative features!"
  );
  console.log("   Parsed result:", JSON.stringify(analysisResponse.parsed, null, 2));
  console.log();

  // Example 4: Override config per instance
  console.log("4. Agent with instance overrides:");
  const fastMathTutor = new MathTutorAgent({
    llm,
    model: "gpt-4o-mini",
    temperature: 0.1
  });
  const fastResponse = await fastMathTutor.ask("What is 100 divided by 4?");
  console.log(`   Response: ${fastResponse}`);
}

main().catch(console.error);
