/* eslint-disable no-console */
/**
 * Agent Example - Telemetry Hooks and Static API
 *
 * This example demonstrates:
 * 1. Declarative Telemetry Hooks (onToolStart, onComplete, etc.) for observability
 * 2. Static Execution API (Agent.ask) for one-liner usage
 *
 * Run: node examples/scripts/core/agents/telemetry-hooks.mjs
 */

import "dotenv/config";
import { Agent, Tool, z } from "../../../../packages/core/dist/index.js";

// Ensure a provider is set for the global NodeLLM instance to work
if (!process.env.NODELLM_PROVIDER) {
  process.env.NODELLM_PROVIDER = "openai";
}

// ============================================================================
// 1. Define Tools
// ============================================================================

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get current weather for a city";
  schema = z.object({ city: z.string() });

  async execute({ city }) {
    console.log(`  [WeatherTool] Fetching data for ${city}...`);
    // Simulate API latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return `Sunny, 25°C in ${city}`;
  }
}

// ============================================================================
// 2. Define Agent with Telemetry Hooks
// ============================================================================

class ObservabilityAgent extends Agent {
  static model = "gpt-4o-mini"; // Fast, cheap model for example
  static instructions = "You are a helpful weather assistant.";
  static tools = [WeatherTool];
  static temperature = 0;

  // --- Telemetry Hooks ---

  /**
   * Called when the agent session starts
   */
  static onStart(context) {
    console.log(`\n🚀 [Audit] Agent started.`);
    if (context.messages) {
      console.log(`   Initial Messages: ${context.messages.length}`);
    }
  }

  /**
   * Called when a tool execution starts
   */
  static onToolStart(toolCall) {
    console.log(`\n🔍 [Audit] Starting tool: ${toolCall.function.name}`);
    console.log(`   Args: ${toolCall.function.arguments}`);
    console.time(`tool-${toolCall.id}`);
  }

  /**
   * Called when a tool execution finishes
   */
  static onToolEnd(toolCall, result) {
    console.timeEnd(`tool-${toolCall.id}`);
    console.log(`✅ [Audit] Tool completed. Result length: ${result.toString().length} chars`);
  }

  /**
   * Called when a tool execution fails
   */
  static onToolError(toolCall, error) {
    console.error(`❌ [Audit] Tool failed: ${error.message}`);
  }

  /**
   * Called when the agent completes a response
   */
  static onComplete(response) {
    console.log(`\n🎉 [Audit] Agent turn complete.`);
    console.log(`   Model: ${response.model}`);
    // console.log(`   Tokens: ${JSON.stringify(response.usage)}`); // Usage might be undefined depending on provider mock/real
    console.log(`   Finish Reason: ${response.finishReason}`);
  }
}

// ============================================================================
// 3. Run the Agent (Static API)
// ============================================================================

async function main() {
  console.log("=== Agent Telemetry Demo ===\n");
  console.log("Asking: 'What is the weather in New York?'");

  try {
    // One-liner execution using static ask()
    // This automatically instantiates the agent, wires up hooks, and runs it
    const response = await ObservabilityAgent.ask("What is the weather in New York?");

    console.log(`\n🤖 Final Response:\n${response.toString()}\n`);
  } catch (error) {
    console.error("Error running agent:", error);
  }
}

main().catch(console.error);
