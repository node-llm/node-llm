import "dotenv/config";
import { createLLM, Tool, z } from "../../../../packages/core/dist/index.js";

/**
 * Example: Concurrent Tool Execution
 *
 * When a model returns several independent tool calls in the same turn,
 * NodeLLM executes them one at a time by default. Enabling `toolConcurrency`
 * runs them in parallel instead, which cuts latency for turns with multiple
 * unrelated tool calls (e.g. looking up weather in three different cities).
 *
 * This script times the same prompt with the setting off and on so the
 * difference is visible.
 */

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a specific location";
  schema = z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA")
  });

  async execute({ location }) {
    console.log(`⚡️ [Tool Executing] Fetching weather for: ${location}`);
    // Simulate a slow network call so the concurrency difference is visible.
    await new Promise((r) => setTimeout(r, 1000));
    return { location, temperature: 22, condition: "Sunny" };
  }
}

async function timedAsk(chat, prompt) {
  const start = Date.now();
  const response = await chat.ask(prompt);
  const elapsed = Date.now() - start;
  console.log("Assistant:", response.content);
  console.log(`Elapsed: ${elapsed}ms\n`);
}

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });

  const prompt = "What is the weather in Tokyo, London, and New York?";

  console.log("=== Sequential (default) ===");
  const sequentialChat = llm.chat("gpt-4o-mini").withTool(WeatherTool);
  await timedAsk(sequentialChat, prompt);

  console.log("=== Concurrent (toolConcurrency: true) ===");
  const concurrentChat = llm.chat("gpt-4o-mini").withTool(WeatherTool).withToolConcurrency(true);
  await timedAsk(concurrentChat, prompt);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
