import "dotenv/config";
import { NodeLLM, Tool, z } from "../../../packages/core/dist/index.js";

class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a specific location";
  schema = z.object({
    location: z.string().describe("The city and state, e.g. San Francisco, CA")
  });

  async execute({ location }) {
    console.log(`⚡️ [Tool Executing] Fetching weather for: ${location}`);
    // Simulate network delay
    await new Promise(r => setTimeout(r, 500));
    return { location, temperature: 22, condition: "Sunny" };
  }
}

async function main() {
  NodeLLM.configure({ 
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY
  });

  const chat = NodeLLM.chat("gpt-4o-mini").withTool(WeatherTool);

  console.log("User: What is the weather in Tokyo, London, and New York?");
  
  // This single prompt should trigger 3 parallel tool calls
  const response = await chat.ask("What is the weather in Tokyo, London, and New York?");

  console.log("\nAssistant:", response.content);
}

main().catch(console.error);
