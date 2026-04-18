import "dotenv/config";
import { createLLM, NodeLLM, Tool, z } from "../../../../packages/core/dist/index.js";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a specific location";
  schema = z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA")
  });

  async execute({ location }) {
    console.log(`⚡️ [Tool Executing] Fetching weather for: ${location}`);
    // Simulate network delay
    await new Promise((r) => setTimeout(r, 500));
    return { location, temperature: 22, condition: "Sunny" };
  }
}

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });
  const chat = llm.chat("gpt-4o-mini").withTool(WeatherTool);

  console.log("User: What is the weather in Tokyo, London, and New York?");

  // This single prompt should trigger 3 parallel tool calls
  const response = await chat.ask("What is the weather in Tokyo, London, and New York?");

  console.log("\nAssistant:", response.content);
  console.log("\n");

  // Example 2: Disabling parallel calls for strictly sequential logic
  console.log("=== Disabling Parallel Calls (calls: 'one') ===");
  const chat2 = llm.chat("gpt-4o-mini")
    .withTool(WeatherTool)
    .withToolCalls("one");

  console.log("User: What is the weather in Paris and Berlin?");
  const response2 = await chat2.ask("What is the weather in Paris and Berlin?");
  console.log("\nAssistant:", response2.content);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
