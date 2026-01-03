import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.openaiApiKey = process.env.OPENAI_API_KEY;
  });
  
  NodeLLM.configure({ provider: "openai" });

  const weatherTool = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a specific location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' }
        },
        required: ['location']
      }
    },
    handler: async ({ location }) => {
      console.log(`⚡️ [Tool Executing] Fetching weather for: ${location}`);
      // Simulate network delay
      await new Promise(r => setTimeout(r, 500));
      return JSON.stringify({ location, temperature: 22, condition: "Sunny" });
    }
  };

  const chat = NodeLLM.chat("gpt-4o-mini").withTool(weatherTool);

  console.log("User: What is the weather in Tokyo, London, and New York?");
  
  // This single prompt should trigger 3 parallel tool calls
  const response = await chat.ask("What is the weather in Tokyo, London, and New York?");

  console.log("\nAssistant:", response.content);
}

main().catch(console.error);
