import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

// Configure provider - Callback style (recommended)
LLM.configure((config) => {
  config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
});

// Alternative: LLM.configure({ anthropicApiKey: "sk-ant-...", provider: "anthropic" });
LLM.configure({
  provider: "anthropic",
});

async function main() {
  console.log("Creating chat with Claude 3.5 Sonnet...");
  const chat = LLM.chat("claude-3-haiku-20240307");

  console.log("Sending message...");
  const response = await chat.ask("Hello, who are you?");

  console.log("\nResponse:");
  console.log(response.content);
  console.log("\nUsage:", response.usage);
}

main().catch(console.error);
