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

// console.log("\n\n---");
// console.log("Final message stored in chat history:");
// console.log(chat.history.at(-1));

// console.log("\n\n--- TOOL CALLING TEST ---");

// const weatherTool = {
//   type: 'function',
//   function: {
//     name: 'get_weather',
//     description: 'Get the current weather for a location',
//     parameters: {
//       type: 'object',
//       properties: {
//         location: { type: 'string', description: 'The city and state, e.g. San Francisco, CA' },
//         unit: { type: 'string', enum: ['celsius', 'fahrenheit'] }
//       },
//       required: ['location']
//     }
//   },
//   handler: async ({ location, unit = 'celsius' }) => {
//     console.log(`> 🛠️  Tool called: get_weather for ${location} in ${unit}`);
//     return JSON.stringify({ location, temperature: 22, unit, condition: "Sunny" });
//   }
// };

// const toolChat = LLM.chat("gpt-4o-mini", {
//   systemPrompt: "You are a helpful assistant.",
//   tools: [weatherTool]
// });

// console.log("Asking: What is the weather in London?");
// const toolReply = await toolChat.ask("What is the weather in London?");
// console.log("LLM Tool Reply:", toolReply);

console.log("\n\n--- VISION TEST ---");
// Note: This requires a model that supports vision (e.g. gpt-4o)
const visionChat = LLM.chat("gpt-4o-mini", {
  systemPrompt: "You are a helpful assistant.",
});

try {
  // Using a placeholder image URL for testing structure
  // In a real run, this URL needs to be accessible by OpenAI
  const visionReply = await visionChat.ask("What is in this image?", {
    files: ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/Gfp-wisconsin-madison-the-nature-boardwalk.jpg/2560px-Gfp-wisconsin-madison-the-nature-boardwalk.jpg"]
  });
  console.log("Vision Reply:", visionReply);

  console.log("\n\n--- FILE TEST (TEXT) ---");
  // Create a temporary text file
  const fs = await import("fs/promises");
  await fs.writeFile("test-note.txt", "This is a secret note about Project X.");
  
  const fileReply = await visionChat.ask("What is in this note?", {
    files: ["./test-note.txt"]
  });
  console.log("File Reply:", fileReply);
  
  await fs.unlink("test-note.txt");

} catch (e) {
  console.log("Vision/File test skipped or failed:", e.message);
}



