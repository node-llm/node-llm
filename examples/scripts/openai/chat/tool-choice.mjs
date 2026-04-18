import "dotenv/config";
import { createLLM, Tool, z } from "../../../../packages/core/dist/index.js";

// 1. Define Tools
class WeatherTool extends Tool {
  name = "get_weather";
  description = "Get the current weather for a location";
  schema = z.object({
    location: z.string().describe("City name"),
  });

  async execute({ location }) {
    console.log(`[Tool Called] get_weather(${location})`);
    return { location, temperature: 22, condition: "sunny" };
  }
}

class CalculatorTool extends Tool {
  name = "calculate";
  description = "Perform mathematical calculations";
  schema = z.object({
    expression: z.string().describe("Mathematical expression to evaluate"),
  });

  async execute({ expression }) {
    console.log(`[Tool Called] calculate(${expression})`);
    return { expression, result: eval(expression) };
  }
}

async function main() {
  const llm = createLLM({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY,
    maxToolCalls: 10
  });

  // Example 1: Force ANY tool call (choice: "required")
  // Using "required" ensures the model uses a tool before answering.
  console.log("=== Example 1: Forced Tool Use (choice: 'required') ===");
  const chat1 = llm.chat("gpt-4o-mini").withTools([WeatherTool, CalculatorTool], { 
    choice: "required" 
  });
  
  const response1 = await chat1.ask("What is the weather in New York?"); 
  console.log("Tool Calls:", response1.tool_calls?.map(tc => tc.function.name));
  console.log("Final Answer:", response1.content);
  console.log("\n");

  // Example 2: Disable tools (choice: "none")
  // The model will not call any tools even if explicitly asked.
  console.log("=== Example 2: Tools Disabled (choice: 'none') ===");
  const chat2 = llm.chat("gpt-4o-mini").withTools([WeatherTool], { 
    choice: "none" 
  });
  
  const response2 = await chat2.ask("What's the weather in London?");
  console.log("Tool Calls:", response2.tool_calls?.map(tc => tc.function.name) || "None");
  console.log("Final Answer:", response2.content);
  console.log("\n");

  // Example 3: Forced Sequential execution (calls: "one")
  // Restricts the model to a single tool call per turn, even for multiple tasks.
  console.log("=== Example 3: Sequential Only (calls: 'one') ===");
  const chat3 = llm.chat("gpt-4o-mini")
    .withTools([WeatherTool, CalculatorTool])
    .withToolCalls("one"); // Force sequential turns
    
  const response3 = await chat3.ask("What is the weather in Paris and what is 100 * 5?");
  console.log("Tool Calls in this turn:", response3.tool_calls?.map(tc => tc.function.name));
  console.log("Final Answer:", response3.content);
  console.log("\n");

  console.log("=== All tool control examples completed ===");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
