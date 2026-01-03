import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

const weatherTool = {
  type: "function",
  function: {
    name: "get_weather",
    description: "Get the current weather in a given location",
    parameters: {
      type: "object",
      properties: {
        location: {
          type: "string",
          description: "The city and state, e.g. San Francisco, CA",
        },
      },
      required: ["location"],
    },
  },
  async handler({ location }) {
    console.log(`[WeatherTool] Fetching weather for ${location}...`);
    return `The weather in ${location} is 72°F and sunny.`;
  }
};

async function main() {
  NodeLLM.configure({
    provider: "anthropic",
  });

  const chat = NodeLLM.chat("claude-3-haiku-20240307")
    .withTool(weatherTool);

  console.log("Asking about weather in two cities...");

  const response = await chat.ask("What is the weather like in San Francisco and New York?");

  console.log("\nFinal Response:", response.content);
  console.log("\nUsage:", response.usage);
}

main().catch(console.error);
