import "dotenv/config";
import { LLM } from "../../../packages/core/dist/index.js";

async function main() {
  LLM.configure({ provider: "gemini" });

  const weatherTool = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather',
      parameters: {
        type: 'object',
        properties: { location: { type: 'string' } },
        required: ['location']
      }
    },
    handler: async ({ location }) => {
      console.log(`[Tool] Weather checked for ${location}`);
      return JSON.stringify({ location, temperature: 18, unit: 'celsius' });
    }
  };

  const chat = LLM.chat("gemini-2.0-flash").withTool(weatherTool);

  console.log("Asking: How is the weather in Paris?");
  const response = await chat.ask("How is the weather in Paris?");

  console.log("\nFinal Answer:");
  console.log(response.content);
}

main().catch(console.error);
