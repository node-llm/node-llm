import "dotenv/config";
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  NodeLLM.configure({
    provider: "openai",
    openaiApiKey: process.env.OPENAI_API_KEY,
  });

  // Define tools
  const weatherTool = {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get the current weather for a location',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string', description: 'City name' },
          unit: { type: 'string', enum: ['celsius', 'fahrenheit'], description: 'Temperature unit' }
        },
        required: ['location']
      }
    },
    handler: async ({ location, unit = 'celsius' }) => {
      console.log(`[Tool Called] get_weather(${location}, ${unit})`);
      // Simulate API call
      const temp = unit === 'celsius' ? 22 : 72;
      return JSON.stringify({ 
        location, 
        temperature: temp, 
        unit,
        condition: 'sunny'
      });
    }
  };

  const timeTool = {
    type: 'function',
    function: {
      name: 'get_current_time',
      description: 'Get the current time in a specific timezone',
      parameters: {
        type: 'object',
        properties: {
          timezone: { type: 'string', description: 'Timezone (e.g., America/New_York)' }
        },
        required: ['timezone']
      }
    },
    handler: async ({ timezone }) => {
      console.log(`[Tool Called] get_current_time(${timezone})`);
      const now = new Date();
      return JSON.stringify({
        timezone,
        time: now.toLocaleTimeString('en-US', { timeZone: timezone }),
        date: now.toLocaleDateString('en-US', { timeZone: timezone })
      });
    }
  };

  // Example 1: Single tool
  console.log("=== Example 1: Single Tool ===");
  const chat1 = NodeLLM.chat("gpt-4o-mini").withTool(weatherTool);
  const response1 = await chat1.ask("What's the weather in Paris?");
  console.log("\nFinal Answer:", response1.content);
  console.log("\n");

  // Example 2: Multiple tools
  console.log("=== Example 2: Multiple Tools ===");
  const chat2 = NodeLLM.chat("gpt-4o-mini").withTools([weatherTool, timeTool]);
  const response2 = await chat2.ask("What's the weather and current time in Tokyo?");
  console.log("\nFinal Answer:", response2.content);
  console.log("\n");

  // Example 3: Tool with different parameters
  console.log("=== Example 3: Tool with Unit Parameter ===");
  const chat3 = NodeLLM.chat("gpt-4o-mini").withTool(weatherTool);
  const response3 = await chat3.ask("What's the weather in New York in Fahrenheit?");
  console.log("\nFinal Answer:", response3.content);
  console.log("\n");

  // Example 4: Multiple tool calls in sequence
  console.log("=== Example 4: Sequential Tool Calls ===");
  const chat4 = NodeLLM.chat("gpt-4o-mini").withTools([weatherTool, timeTool]);
  const response4 = await chat4.ask("Compare the weather in London and Berlin, and tell me the time in both cities.");
  console.log("\nFinal Answer:", response4.content);
  console.log("\n");

  // Example 5: Tool that returns complex data
  const calculatorTool = {
    type: 'function',
    function: {
      name: 'calculate',
      description: 'Perform mathematical calculations',
      parameters: {
        type: 'object',
        properties: {
          expression: { type: 'string', description: 'Mathematical expression to evaluate' }
        },
        required: ['expression']
      }
    },
    handler: async ({ expression }) => {
      console.log(`[Tool Called] calculate(${expression})`);
      try {
        // Simple eval for demo - in production use a safe math parser
        const result = eval(expression);
        return JSON.stringify({ expression, result, success: true });
      } catch (error) {
        return JSON.stringify({ expression, error: error.message, success: false });
      }
    }
  };

  console.log("=== Example 5: Calculator Tool ===");
  const chat5 = NodeLLM.chat("gpt-4o-mini").withTool(calculatorTool);
  const response5 = await chat5.ask("What is (15 * 8) + (100 / 4)?");
  console.log("\nFinal Answer:", response5.content);
  console.log("\n");

  // Example 6: Tool with conversation context
  console.log("=== Example 6: Tool with Conversation Context ===");
  const chat6 = NodeLLM.chat("gpt-4o-mini").withTool(weatherTool);
  
  await chat6.ask("I'm planning a trip to Rome.");
  const response6 = await chat6.ask("What's the weather like there?");
  console.log("\nFinal Answer:", response6.content);
  console.log("\n");

  console.log("=== All tool examples completed ===");
}

main().catch(console.error);
