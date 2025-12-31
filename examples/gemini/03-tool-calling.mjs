import { LLM } from "../../packages/core/dist/index.js";
import "dotenv/config";

LLM.configure({
  provider: "gemini",
});

const weatherTool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the current weather in a given location',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
          description: 'The city and state, e.g. San Francisco, CA',
        }
      },
      required: ['location'],
    },
  },
  handler: async ({ location }) => {
    console.log(`[Tool] Fetching weather for ${location}...`);
    return JSON.stringify({ 
      location, 
      temperature: 72, 
      unit: 'fahrenheit', 
      condition: 'sunny' 
    });
  },
};

const chat = LLM.chat("gemini-2.0-flash")
  .withTool(weatherTool)
  .onToolCall((call) => console.log(`\nAI is calling tool: ${call.function.name}`))
  .onToolResult((result) => console.log(`Tool returned: ${result}`));

console.log("Asking Gemini about the weather...");
const response = await chat.ask("What is the weather like in Tokyo?");

console.log("\n--- Final Response ---");
console.log(response.content);
