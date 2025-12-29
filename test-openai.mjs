import "dotenv/config";
import { LLM } from "./packages/core/dist/index.js";

LLM.configure({ 
  provider: "openai",
  retry: {
    attempts: 3,
    delayMs: 500,
  },
});

const chat = LLM.chat("gpt-4o-mini", {
  systemPrompt: "You are a concise assistant",
});

const reply = await chat.ask("Explain HTTP in one sentence");
console.log("LLM reply:", reply);


// 🔥 STREAMING TEST
// let full = "";

// for await (const token of chat.stream("Explain HTTP in one sentence")) {
//   process.stdout.write(token);
//   full += token;
// }

console.log("\n\n---");
console.log("Final message stored in chat history:");
console.log(chat.history.at(-1));

console.log("\n\n--- TOOL CALLING TEST ---");

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
    console.log(`> 🛠️  Tool called: get_weather for ${location} in ${unit}`);
    return JSON.stringify({ location, temperature: 22, unit, condition: "Sunny" });
  }
};

const toolChat = LLM.chat("gpt-4o-mini", {
  systemPrompt: "You are a helpful assistant.",
  tools: [weatherTool]
});

console.log("Asking: What is the weather in London?");
const toolReply = await toolChat.ask("What is the weather in London?");
console.log("LLM Tool Reply:", toolReply);
