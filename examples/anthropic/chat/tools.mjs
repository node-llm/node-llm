import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

// Ensure ANTHROPIC_API_KEY is set in your environment

NodeLLM.configure({
  provider: "anthropic",
});

const WeatherTool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather for a location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA"
        },
        unit: {
          type: "string",
          enum: ["celsius", "fahrenheit"]
        }
      },
      required: ["location"]
    }
  },
  handler: async ({ location, unit }) => {
    console.log(`[WeatherTool] Fetching weather for ${location}...`);
    return JSON.stringify({
      location,
      temperature: 22,
      unit: unit || "celsius",
      conditions: "Sunny",
    });
  }
};

async function main() {
  console.log("Creating chat with Tools...");
  
  const chat = NodeLLM.chat("claude-3-haiku-20240307")
    .withTool(WeatherTool);

  // Anthropic supports thinking/tool use automatically
  console.log("User: What is the weather in Paris?");
  const response = await chat.ask("What is the weather in Paris?");

  console.log("\nResponse:");
  console.log(response.content);
}

main().catch(console.error);
