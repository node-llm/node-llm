import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

// Configure provider - Callback style (recommended)
NodeLLM.configure((config) => {
  config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
});

// Alternative: NodeLLM.configure({ deepseekApiKey: "...", provider: "deepseek" });
NodeLLM.configure({
  provider: "deepseek",
});

const chat = NodeLLM.chat("deepseek-chat");

console.log("Chatting with DeepSeek...");
const response = await chat.ask("Hello! Tell me a one-liner joke.");

console.log("\nResponse:", response.content);
console.log("\nUsage:", response.usage);
