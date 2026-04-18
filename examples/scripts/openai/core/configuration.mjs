import "dotenv/config";
import { createLLM, NodeLLM } from "../../../../packages/core/dist/index.js";

/**
 * This example demonstrates the IMMUTABLE configuration system in NodeLLM v1.5.0+.
 *
 * In this architecture:
 * 1. Global NodeLLM is frozen at startup (Singleton).
 * 2. Runtime switching happens via Context Branching (.withProvider).
 * 3. Custom instances are created via createLLM().
 */

async function main() {
  console.log("=== NodeLLM Configuration Examples ===\n");

  // Pattern 1: Using the Default Instance (Environment variables)
  // This is safe for single-tenant apps or CLI tools.
  // It reads process.env at load time and stores it.
  console.log("1. Default Instance");
  try {
    const chat = NodeLLM.chat("gpt-4o-mini");
    console.log(`Using default instance: ${chat.modelId}`);
    // await chat.ask("Hi"); // Only if OPENAI_API_KEY is set
  } catch (e) {
    console.log("Default instance not ready (expected if no global env set)");
  }
  console.log();

  // Pattern 2: Context Branching with .withProvider()
  // This is RECOMMENDED for multi-provider apps. It creates a new isolated instance.
  console.log("2. Branching with .withProvider()");
  const anthropic = NodeLLM.withProvider("anthropic", {
    anthropicApiKey: process.env.ANTHROPIC_API_KEY
  });
  console.log(`Branch created for: ${anthropic.provider?.id}`);
  console.log();

  // Pattern 3: Explicit Instances with createLLM()
  // This is RECOMMENDED for multi-tenant apps (e.g. SaaS) where each
  // request might need a different API key.
  console.log("3. Explicit Instances via createLLM()");
  const userLLM = createLLM({
    provider: "openai",
    openaiApiKey: "sk-tenant-specific-key-here"
  });
  console.log(`Explicit instance created for: ${userLLM.provider?.id}`);
  console.log();

  console.log("=== All patterns demonstrated ===");
}

main().catch(e => { console.error(e); process.exit(1); });
