/**
 * Agent Example - Lazy Configuration & Dynamic Inputs
 *
 * This example demonstrates how to use lazy evaluation for agent instructions
 * and tools, allowing you to inject dynamic context (like user info or workspace)
 * into the agent's behavior at runtime.
 *
 * Inspired by RubyLLM 1.12 "Agents Are Just LLMs with Tools".
 *
 * Run: node examples/scripts/core/agents/lazy.mjs
 */

import "dotenv/config";
import { Agent, Tool, z, createLLM } from "../../../../packages/core/dist/index.js";

// Create an LLM instance or a mock for testing
let llm;
if (process.env.OPENAI_API_KEY) {
  llm = createLLM({ provider: "openai" });
} else {
  console.log("⚠️  OPENAI_API_KEY not found. Using mock provider for demonstration.\n");
  llm = createLLM({ 
    provider: "openai",
    adapter: {
      async execute({ messages }) {
        return {
          content: "This is a mock response because no API key was found.",
          usage: { input_tokens: 10, output_tokens: 10, total_tokens: 20 }
        };
      }
    }
  });
}

// ============================================================================
// 1. Define Tools that need context
// ============================================================================

class WorkspaceSearchTool extends Tool {
  constructor(options = {}) {
    super();
    this.options = options;
  }
  name = "search_docs";
  description = "Search documents in the current workspace";
  schema = z.object({ query: z.string() });

  async execute({ query }) {
    // Access the 'scope' passed during instantiation
    const scope = this.options.scope || "global";
    console.log(`  [Search] Query: "${query}" (Scope: ${scope})`);
    
    // Mock results based on scope
    if (scope === "hr") {
      return "HR Results: Vacation policy, Payroll schedule.";
    }
    return "Global Results: Company mission, Office locations.";
  }
}

// ============================================================================
// 2. Define the Agent with Lazy Context
// ============================================================================

/**
 * @extends {Agent<{ userName: string, workspace: string }>}
 */
class WorkAssistant extends Agent {
  static model = "gpt-4o-mini";

  // Declare expected inputs (optional, for introspection)
  static inputs = ["userName", "workspace"];

  // 1. Lazy Instructions: resolve at runtime based on inputs
  static instructions = (inputs) => 
    `You are helping ${inputs.userName} in the ${inputs.workspace} workspace. 
    Use the search_docs tool to find information specific to this workspace.`;

  // 2. Lazy Tools: choose or configure tools based on inputs
  static tools = (inputs) => [
    new WorkspaceSearchTool({ scope: inputs.workspace })
  ];
}

// ============================================================================
// 3. Execution Patterns
// ============================================================================

async function main() {
  console.log("=== Lazy Agent & Dynamic Inputs ===\n");

  // Pattern A: Pass inputs during instantiation
  console.log("A. Inputs at Instantiation (Alice in HR):");
  const hrAssistant = new WorkAssistant({
    llm,
    inputs: { userName: "Alice", workspace: "hr" }
  });
  
  const responseA = await hrAssistant.ask("What documents are available?");
  console.log(`   Response: ${responseA}`);
  console.log();

  // Pattern B: Pass inputs during the turn (Explicit Turn Context)
  console.log("B. Inputs at Turn level (Bob in General):");
  const generalAssistant = new WorkAssistant({ llm });
  
  const responseB = await generalAssistant.ask("What is available here?", {
    inputs: { userName: "Bob", workspace: "general" }
  });
  console.log(`   Response: ${responseB}`);
}

main().catch(console.error);
