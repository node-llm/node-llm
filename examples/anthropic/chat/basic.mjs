import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

// Configure provider - Callback style (recommended)
NodeLLM.configure((config) => {
  config.anthropicApiKey = process.env.ANTHROPIC_API_KEY;
});

// Alternative: NodeLLM.configure({ anthropicApiKey: "sk-ant-...", provider: "anthropic" });
NodeLLM.configure({
  provider: "anthropic",
});

async function main() {
  console.log("Creating chat with Claude 3.5 Sonnet...");
  const chat = NodeLLM.chat("claude-3-5-sonnet-20241022");

  console.log("Sending message...");
  const response = await chat.ask("Hello, who are you?");

  console.log("\nResponse:");
  console.log(response.content);
  console.log("\nUsage:", response.usage);
}

main().catch(console.error);
