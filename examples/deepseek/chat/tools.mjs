import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure((config) => {
    config.deepseekApiKey = process.env.DEEPSEEK_API_KEY;
  });
  
  NodeLLM.configure({ provider: "deepseek" });

  const weatherTool = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather in a given location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' }
        },
        required: ['location']
      }
    },
    handler: async ({ location }) => {
      return JSON.stringify({ location, temperature: 22, unit: 'celsius' });
    }
  };

  const chat = NodeLLM.chat("deepseek-chat").withTool(weatherTool);

  console.log("Asking a question that requires a function call...");
  const response = await chat.ask("What is the weather in London?");

  console.log("\nFinal Answer:");
  console.log(response.content);
}

main().catch(console.error);
