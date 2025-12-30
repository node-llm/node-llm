import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";

LLM.configure({ 
  provider: "openai"
});

const weatherTool = {
  type: 'function',
  function: {
    name: 'get_weather',
    description: 'Get the current weather for a location',
    parameters: {
      type: 'object',
      properties: {
        location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' },
        unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
      },
      required: ['location']
    }
  },
  handler: async ({ location, unit = 'celsius' }) => {
    console.log(`> 🛠️  Tool called: get_weather for ${location}`);
    return JSON.stringify({ location, temperature: 22, unit, condition: "Sunny" });
  }
};

async function main() {
  const chat = LLM.chat("gpt-4o-mini");

  console.log("Asking: What is the weather in London?");
  const reply = await chat
    .withTool(weatherTool)
    .ask("What is the weather in London?");

  console.log("LLM Reply:", reply.content);
}

main();
