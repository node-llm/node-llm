import "dotenv/config";
import { LLM } from "../../packages/core/dist/index.js";

LLM.configure({ 
  provider: "openai",
});

async function main() {
  const chat = LLM.chat("gpt-4o-mini");

  console.log("--- Single Turn Usage ---");
  const response = await chat.ask("What is the capital of France?");
  
  console.log(`Reply: ${response.content}`);
  console.log(`Model: ${response.model_id}`);
  console.log(`Input Tokens:  ${response.input_tokens}`);
  console.log(`Output Tokens: ${response.output_tokens}`);
  console.log(`Total Tokens:  ${response.total_tokens}`);

  console.log("\n--- Multi-Turn / Tool-Calling Usage ---");
  const weatherTool = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather',
      parameters: { type: 'object', properties: { location: { type: 'string' } } }
    },
    handler: async ({ location }) => {
      return JSON.stringify({ location, temperature: 22, condition: "Sunny" });
    }
  };

  const toolChat = LLM.chat("gpt-4o-mini").withTool(weatherTool);
  const toolResponse = await toolChat.ask("What is the weather in London?");
  
  console.log(`Reply: ${toolResponse}`);
  console.log(`Input Tokens (Aggregated):  ${toolResponse.input_tokens}`);
  console.log(`Output Tokens (Aggregated): ${toolResponse.output_tokens}`);
  console.log(`Total Tokens (Aggregated):  ${toolResponse.total_tokens}`);
  
  console.log("\n--- Chat-wide Total Usage ---");
  const total = toolChat.totalUsage;
  console.log(`Chat Total Input:  ${total.input_tokens}`);
  console.log(`Chat Total Output: ${total.output_tokens}`);
  console.log(`Chat Total:        ${total.total_tokens}`);
}

main();
