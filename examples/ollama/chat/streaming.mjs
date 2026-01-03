
import { NodeLLM } from "../../../packages/core/dist/index.js";

async function main() {
  console.log("🦙 Ollama Streaming Chat Example");
  
  NodeLLM.configure({ provider: "ollama" });
  const chat = NodeLLM.chat("llama3");

  const prompt = "Write a haiku about TypeScript.";
  console.log(`User: ${prompt}`);
  process.stdout.write("AI: ");
  
  try {
    for await (const chunk of chat.stream(prompt)) {
      process.stdout.write(chunk.content);
    }
    console.log("\n");
  } catch (error) {
    console.error("\nError:", error.message);
  }
}
main();
