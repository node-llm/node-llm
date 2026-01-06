import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

/**
 * This example demonstrates defining tools using raw JSON Schema and plain objects.
 * This is useful for migrating from other libraries or when schemas are dynamic.
 * 
 * RECOMMENDED: Use class-based tools (see tools.mjs) for better type safety and DX.
 */

const weatherTool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'City name' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
      },
      required: ['location']
    }
  },
  handler: async ({ location, unit = 'celsius' }) => {
    console.log(`[Raw JSON Tool] get_weather(${location}, ${unit})`);
    return JSON.stringify({ location, temperature: 22, unit });
  }
};

async function main() {
  NodeLLM.configure({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY,
  });

  const chat = NodeLLM.chat("gpt-4o-mini").withTool(weatherTool);
  
  console.log("Asking: What's the weather in Paris?");
  const response = await chat.ask("What's the weather in Paris?");
  console.log("\nResponse:", response.content);
}

main().catch(console.error);
