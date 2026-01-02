import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

// Configure provider - Callback style (recommended)
LLM.configure((config) => {
  config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
});

// Alternative: LLM.configure({ deepseekApiKey: "...", provider: "deepseek" });
LLM.configure({
  provider: "deepseek",
});

const chat = LLM.chat("deepseek-chat");

console.log("Chatting with DeepSeek...");
const response = await chat.ask("Hello! Tell me a one-liner joke.");

console.log("\nResponse:", response.content);
console.log("\nUsage:", response.usage);
