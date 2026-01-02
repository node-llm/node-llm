import "dotenv/config";
import { LLM } from "../packages/core/dist/index.js";

/**
 * This example demonstrates the configuration system.
 * You can configure API keys using either callback-style or object-style syntax.
 */

console.log("=== Configuration Examples ===\n");

// Example 1: Callback-style configuration (Recommended for multiple providers)
console.log("1. Callback-style configuration:");
LLM.configure((config) => {
  config.openaiApiKey = process.env.OPENAI_API_KEY;
  config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  config.geminiApiKey = process.env.GEMINI_API_KEY;
  config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
});
console.log("✓ Configured all providers\n");

// Example 2: Inspect current configuration
console.log("2. Inspecting configuration:");
console.log("OpenAI key set:", !!LLM.config.openaiApiKey);
console.log("Anthropic key set:", !!LLM.config.anthropicApiKey);
console.log("Gemini key set:", !!LLM.config.geminiApiKey);
console.log("DeepSeek key set:", !!LLM.config.deepseekApiKey);
console.log();

// Example 3: Object-style configuration with provider selection
console.log("3. Object-style configuration:");
LLM.configure({
  provider: "openai",
  openaiApiKey: process.env.OPENAI_API_KEY // Can override here too
});
console.log("✓ Configured OpenAI provider\n");

// Example 4: Custom endpoint configuration (e.g., Azure OpenAI)
console.log("4. Custom endpoint configuration:");
if (process.env.AZURE_OPENAI_API_KEY && process.env.AZURE_OPENAI_API_BASE_ENDPOINT) {
  LLM.configure({
    openaiApiKey: process.env.AZURE_OPENAI_API_KEY,
    openaiApiBase: process.env.AZURE_OPENAI_API_BASE_ENDPOINT,
    provider: "openai"
  });
  console.log("✓ Configured Azure OpenAI endpoint");
} else {
  console.log("⊘ Skipped (Azure credentials not set)");
}
console.log();

// Example 5: Using the configured provider
console.log("5. Using configured provider:");
async function testChat() {
  try {
    LLM.configure({ provider: "openai" });
    const chat = LLM.chat("gpt-4o-mini");
    const response = await chat.ask("Say hello in one word");
    console.log("Response:", response.content);
    console.log("✓ Chat successful\n");
  } catch (error) {
    console.error("✗ Chat failed:", error.message);
  }
}

await testChat();

console.log("=== Configuration Examples Complete ===");
