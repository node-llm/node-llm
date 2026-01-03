
import { NodeLLM } from "../../../packages/core/dist/index.js";

// Tool Definition
const weatherTool = {
  type: "function",
  function: {
    name: "get_current_weather",
    description: "Get the current weather in a given location",
    parameters: {
      type: "object",
      properties: {
        location: { type: "string", description: "The city and state, e.g. San Francisco, CA" },
        unit: { type: "string", enum: ["celsius", "fahrenheit"] }
      },
      required: ["location"]
    }
  },
  handler: async ({ location, unit }) => {
    console.log(`[Tool] Fetching weather for ${location}...`);
    return JSON.stringify({ 
        location, 
        temperature: "72", 
        unit: unit || "fahrenheit", 
        forecast: ["sunny", "windy"] 
    });
  }
};

async function main() {
  console.log("🦙 Ollama Tools Example");
  console.log("Note: Requires a tool-capable model (e.g., 'llama3.1')");
  console.log("Run: ollama pull llama3.1\n");

  NodeLLM.configure({ provider: "ollama" });
  
  const chat = NodeLLM.chat("llama3.1");

  console.log("User: What is the weather in San Francisco?");
  try {
    const response = await chat
        .withTools([weatherTool])
        .ask("What is the weather in San Francisco?");

    console.log("AI:", response.content);
  } catch (error) {
    console.error("Error:", error.message);
  }
}
main();
