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
  // No model specified - defaults to Claude 3.5 Haiku for Anthropic
  const chat = NodeLLM.chat();
  console.log(`Using model: ${chat.modelId}`);

  console.log("Sending message...");
  const response = await chat.ask("Hello, who are you?");

  console.log("\nResponse:");
  console.log(response.content);
  console.log("\nUsage:", response.usage);
}

main().catch(console.error);
